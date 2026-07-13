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
 * Stage 5: Deduplication & Persistence (Legacy downstream wrapper)
 */
async function runStage5Persistence(
  acceptedOpps: Opportunity[],
): Promise<{ inserted: number; merged: number; unchanged: number }> {
  console.log('[Pipeline] Stage 5: Deduplicating and writing to storage...');
  if (acceptedOpps.length === 0) {
    return { inserted: 0, merged: 0, unchanged: 0 };
  }
  const result = await OpportunityRepository.upsertOpportunities(acceptedOpps);
  return {
    inserted: result.inserted,
    merged: result.merged,
    unchanged: result.unchanged,
  };
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

  // 1. Execute Stage 1 (Modular Discovery)
  const stage1 = new Stage1Discovery();
  const candidates = await stage1.execute(context, options);

  // 2. Execute Stage 2 (Modular Crawling)
  const stage2 = new Stage2Crawling();
  const crawledPages = await stage2.execute(candidates, { maxExtractions: 15 });

  // DB Backwards compatibility raw page saves
  await persistRawPagesCompatibility(crawledPages);

  // 3. Execute Stage 3 (Modular AI Extraction)
  const stage3 = new Stage3Extraction();
  const extractions = await stage3.execute(crawledPages, options);

  // 4. Execute Stage 4 (Modular Quality & Acceptance)
  const stage4 = new Stage4QualityAcceptance();
  const evaluatedOpps = await stage4.execute(extractions, options);

  const accepted = evaluatedOpps.filter((o) => o.decision === 'ACCEPT' || o.decision === 'REVIEW');
  const rejectedCount = evaluatedOpps.filter((o) => o.decision === 'REJECT').length;
  const reviewCount = evaluatedOpps.filter((o) => o.decision === 'REVIEW').length;

  // 5. Execute Stage 5 (Legacy Persistent Storage)
  const { inserted, merged, unchanged } = await runStage5Persistence(accepted);

  // 6. Execute Expiration Archiver
  const archivedCount = await OpportunityArchiver.archiveExpired();

  const finishedAt = new Date();
  const latencyMs = Date.now() - startTime;
  const durationSec = latencyMs / 1000;

  // Calculate metrics
  const avgQualityScore =
    accepted.length > 0
      ? Math.round(
          (accepted.reduce((sum, o) => sum + (o.qualityScore || 0), 0) / accepted.length) * 10,
        ) / 10
      : 0;

  const durationMinutes = Math.floor(durationSec / 60);
  const durationRemainingSeconds = Math.round(durationSec % 60);
  const durationStr =
    durationMinutes > 0
      ? `${durationMinutes}m ${durationRemainingSeconds}s`
      : `${durationRemainingSeconds}s`;

  const crawledSuccessful = crawledPages.filter((p) => p.crawlStatus === 'SUCCESS');
  const crawledFailed = crawledPages.filter((p) => p.crawlStatus === 'FAILED');

  console.log(`
========== Scout Discovery Report ==========
Sources Crawled:          ${TRUSTED_SOURCES.length}
Pages Discovered:        ${candidates.length}
Pages Fetched:           ${crawledSuccessful.length}
Successful Extractions:  ${extractions.length}
Duplicates Merged:        ${merged}
Archived Opportunities:   ${archivedCount}
Rejected (Low Quality):   ${rejectedCount}

Average Quality Score:   ${avgQualityScore}
New Opportunities:       ${inserted}

Duration: ${durationStr}
============================================`);

  // Log summary metrics details to DB
  let runId = 'mock_run_id';
  try {
    const runDoc = await DiscoveryRunModel.create({
      startedAt,
      finishedAt,
      targetAudience: context.targetAudience,
      categories: context.categories,
      totalQueries: TRUSTED_SOURCES.length,
      inserted,
      updated: merged,
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
    inserted,
    updated: merged,
    unchanged,
    cacheHits: crawledPages.filter((p) => p.fetchMethod === 'cache').length,
    cacheMisses: crawledPages.filter((p) => p.fetchMethod === 'firecrawl').length,
    aiFailures: 0,
    crawlFailures: crawledFailed.length,
    totalLatency: latencyMs,
  };

  return {
    runId,
    metrics,
    failedItems: [],
  };
}
