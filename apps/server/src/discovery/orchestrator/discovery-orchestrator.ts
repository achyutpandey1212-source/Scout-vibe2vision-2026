import { DiscoveryRunModel } from '../persistence/discovery-run.model';
import { OpportunityRepository } from '../persistence/opportunity.repository';
import { RawPageModel } from '../firecrawl/raw-page.model';
import { DiscoveryContext } from '../types/query.types';
import { DiscoveryOptions, DiscoveryOrchestratorResponse, PipelineMetrics } from './pipeline.types';
import { Opportunity } from '../extraction/types/opportunity.types';
import { TRUSTED_SOURCES } from '../sources/registry';
import { OpportunityArchiver } from '../utils/archiver';
import { Stage1Discovery } from '../stages/stage1';
import { Stage2Crawling, CrawledPage } from '../stages/stage2';
import { Stage3Extraction } from '../stages/stage3';
import { Stage4QualityAcceptance, QualityEvaluatedOpportunity } from '../stages/stage4';
import { Stage5Persistence } from '../stages/stage5';
import { DashboardStateInstance } from '../utils/dashboard-state';
import crypto from 'crypto';

/**
 * Persists raw crawled pages to MongoDB to maintain E2E database audits
 */
async function persistRawPagesCompatibility(crawledPages: CrawledPage[]): Promise<void> {
  for (const page of crawledPages) {
    if (page.crawlStatus === 'SUCCESS') {
      try {
        const hash = crypto.createHash('sha256').update(page.markdown).digest('hex');
        await RawPageModel.findOneAndUpdate(
          { url: page.url },
          {
            url: page.url,
            title: page.title,
            markdown: page.markdown,
            metadata: page.metadata,
            crawledAt: new Date(),
            hash,
          },
          { upsert: true, new: true },
        );
      } catch (dbErr: any) {
        console.error(
          `[DB Error] Failed to persist legacy RawPage for ${page.url}:`,
          dbErr.message,
        );
      }
    }
  }
}

/**
 * Discovery Orchestrator coordinating Pipeline Stages
 */
export async function discoverOpportunities(
  context: DiscoveryContext,
  options?: DiscoveryOptions,
): Promise<DiscoveryOrchestratorResponse> {
  const startedAt = new Date();
  const startTime = Date.now();

  // Initialize/Update Live Dashboard State
  DashboardStateInstance.updateState({
    isRunning: true,
    currentStage: 'STAGE_1_DISCOVERY',
    startedAt,
    urlsFound: 0,
    pagesCrawled: 0,
    detectorSkipped: 0,
    aiProcessed: 0,
    inserted: 0,
    updated: 0,
    archived: 0,
    failures: 0,
  });

  // 1. Execute Stage 1 (Modular Discovery)
  const stage1 = new Stage1Discovery();
  const candidates = await stage1.execute(context, options);
  DashboardStateInstance.updateState({ urlsFound: candidates.length });

  // 2. Execute Stage 2 (Modular Crawling)
  const stage2 = new Stage2Crawling();
  const crawledPages = await stage2.execute(candidates, {
    maxExtractions: (options as any)?.maxExtractions || 15,
  });

  // DB Backwards compatibility raw page saves
  await persistRawPagesCompatibility(crawledPages);

  // 3. Execute Stage 3 (Modular AI Extraction)
  const stage3 = new Stage3Extraction();
  const extractions = await stage3.execute(crawledPages, options);

  // 4. Execute Stage 4 (Modular Quality & Acceptance)
  const stage4 = new Stage4QualityAcceptance();
  const evaluatedOpps = await stage4.execute(extractions, options);

  const rejectedCount = evaluatedOpps.filter((o) => o.decision === 'REJECT').length;
  const reviewCount = evaluatedOpps.filter((o) => o.decision === 'REVIEW').length;

  // 5. Execute Stage 5 (Modular Persistence, Deduplication & Archiving)
  const stage5 = new Stage5Persistence();
  const runResult = await stage5.execute(evaluatedOpps, {
    startedAt,
    urlsFound: candidates.length,
    crawledPages: crawledPages.length,
    detectorSkipped: DashboardStateInstance.getState().detectorSkipped,
    aiProcessed: DashboardStateInstance.getState().aiProcessed,
    geminiCalls: 0, // Injected metrics
    groqCalls: 0,
    cacheHits: crawledPages.filter((p) => p.fetchMethod === 'cache').length,
    MERGE_THRESHOLD: 95,
    REVIEW_THRESHOLD: 80,
  });

  const durationSec = runResult.durationMs / 1000;
  const durationMinutes = Math.floor(durationSec / 60);
  const durationRemainingSeconds = Math.round(durationSec % 60);
  const durationStr =
    durationMinutes > 0
      ? `${durationMinutes}m ${durationRemainingSeconds}s`
      : `${durationRemainingSeconds}s`;

  console.log(`
========== Scout Discovery Report ==========
Sources Crawled:          ${TRUSTED_SOURCES.length}
Pages Discovered:        ${candidates.length}
Pages Fetched:           ${runResult.crawledPages}
Successful Extractions:  ${extractions.length}
New Opportunities:       ${runResult.inserted}
Updated Opportunities:   ${runResult.updated}
Duplicates Merged:       ${runResult.duplicatesMerged}
Archived Opportunities:   ${runResult.archived}
Rejected (Low Quality):   ${rejectedCount}

Average Quality Score:   ${runResult.averageQuality}

Duration: ${durationStr}
============================================`);

  // Log summary metrics details to DB
  let runId = 'mock_run_id';
  try {
    const runDoc = await DiscoveryRunModel.create({
      startedAt,
      finishedAt: runResult.finishedAt,
      targetAudience: context.targetAudience,
      categories: context.categories,
      totalQueries: TRUSTED_SOURCES.length,
      inserted: runResult.inserted,
      updated: runResult.duplicatesMerged,
      failures: rejectedCount,
      duration: durationSec,
    });
    runId = runDoc._id.toString();
  } catch (runErr: any) {
    console.error('[Orchestrator] Failed logging run details:', runErr.message);
  }

  const metrics: PipelineMetrics = {
    queriesGenerated: TRUSTED_SOURCES.length,
    searchResults: candidates.length,
    acceptedCandidates: candidates.length,
    crawledPages: crawledPages.length,
    snippetBypasses: crawledPages.filter((p) => p.fetchMethod === 'snippet').length,
    extracted: extractions.length,
    inserted: runResult.inserted,
    updated: runResult.duplicatesMerged,
    unchanged: runResult.updated, // mapping unchanged count
    cacheHits: crawledPages.filter((p) => p.fetchMethod === 'cache').length,
    cacheMisses: crawledPages.filter((p) => p.fetchMethod === 'firecrawl').length,
    aiFailures: 0,
    crawlFailures: crawledPages.filter((p) => p.crawlStatus === 'FAILED').length,
    totalLatency: runResult.durationMs,
  };

  return {
    runId,
    metrics,
    failedItems: [],
  };
}
