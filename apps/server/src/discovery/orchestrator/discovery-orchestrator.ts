import { DiscoveryRunModel } from '../persistence/discovery-run.model';
import { OpportunityRepository } from '../persistence/opportunity.repository';
import { extractOpportunityFromPage } from '../extraction/extractor/opportunity-extractor';
import { RawPageModel } from '../firecrawl/raw-page.model';
import { DiscoveryContext } from '../types/query.types';
import { DiscoveryOptions, DiscoveryOrchestratorResponse, PipelineMetrics } from './pipeline.types';
import { Opportunity } from '../extraction/types/opportunity.types';
import { TRUSTED_SOURCES } from '../sources/registry';
import { QualityScorer } from '../utils/quality-scorer';
import { OpportunityArchiver } from '../utils/archiver';
import { Stage1Discovery } from '../stages/stage1';
import { Stage2Crawling, CrawledPage } from '../stages/stage2';
import crypto from 'crypto';

/**
 * Stage 3: AI Extraction (Legacy downstream wrapper)
 * Restores RawPage saves to MongoDB to maintain E2E database consistency before extraction runs.
 */
async function runStage3Extraction(
  crawledPages: CrawledPage[],
  options?: DiscoveryOptions,
): Promise<Opportunity[]> {
  console.log('[Pipeline] Stage 3: AI Extraction...');
  if (options?.skipExtract) {
    console.log('[Orchestrator] Skipping extraction stage...');
    return [];
  }

  // Backwards compatibility: Write RawPages to MongoDB in the coordinator wrapper
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

  const extractions: Opportunity[] = [];
  for (const page of crawledPages) {
    if (page.crawlStatus !== 'SUCCESS') continue;

    try {
      const hash = crypto.createHash('sha256').update(page.markdown).digest('hex');
      const legacyPageObj = {
        ...page,
        hash,
      };
      const opp = await extractOpportunityFromPage(legacyPageObj, 14, 'orchestrated query');
      extractions.push(opp);
    } catch (err: any) {
      console.warn(`[Extraction Stage] Failed on url ${page.url}:`, err.message);
    }
  }
  return extractions;
}

/**
 * Stage 4: Quality Scorer & Threshold Check (Legacy downstream wrapper)
 */
function runStage4QualityCheck(extractions: Opportunity[]): {
  accepted: Opportunity[];
  rejectedCount: number;
} {
  console.log('[Pipeline] Stage 4: Quality Scorer & Threshold checking...');
  const accepted: Opportunity[] = [];
  let rejectedCount = 0;

  for (const opp of extractions) {
    const evaluation = QualityScorer.evaluate(opp);
    opp.qualityScore = evaluation.score;
    opp.qualityBreakdown = evaluation.breakdown as any;

    const matchedSource = TRUSTED_SOURCES.find(
      (src) => opp.organization?.toLowerCase() === src.organization.toLowerCase(),
    );
    opp.trustLevel = matchedSource ? 'OFFICIAL' : 'UNKNOWN';

    if (evaluation.shouldReject) {
      rejectedCount++;
      console.log(`[Quality Check] Rejected "${opp.title}" (Score: ${evaluation.score})`);
    } else {
      accepted.push(opp);
    }
  }

  return { accepted, rejectedCount };
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

  // 3. Execute Stage 3 (Legacy Extraction & RawPage writes)
  const extractions = await runStage3Extraction(crawledPages, options);

  // 4. Execute Stage 4 (Legacy Quality Filtering)
  const { accepted, rejectedCount } = runStage4QualityCheck(extractions);

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
