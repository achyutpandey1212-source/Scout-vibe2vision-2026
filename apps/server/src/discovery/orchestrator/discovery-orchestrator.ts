import { DiscoveryRunModel } from '../persistence/discovery-run.model';
import { OpportunityRepository } from '../persistence/opportunity.repository';
import { extractCandidatePages } from '../firecrawl/extraction-orchestrator';
import { extractOpportunityFromPage } from '../extraction/extractor/opportunity-extractor';
import { RawPageModel } from '../firecrawl/raw-page.model';
import { DiscoveryContext } from '../types/query.types';
import { DiscoveryOptions, DiscoveryOrchestratorResponse, PipelineMetrics } from './pipeline.types';
import { Opportunity } from '../extraction/types/opportunity.types';
import { TRUSTED_SOURCES } from '../sources/registry';
import { QualityScorer } from '../utils/quality-scorer';
import { OpportunityArchiver } from '../utils/archiver';
import { Stage1Discovery, CandidateURL } from '../stages/stage1';

/**
 * Stage 2: Fetching / Crawling (Legacy downstream wrapper)
 */
async function runStage2Fetch(
  candidates: CandidateURL[],
  options?: DiscoveryOptions,
): Promise<any[]> {
  console.log('[Pipeline] Stage 2: Fetching via Firecrawl Extraction Layer...');

  if (options?.skipCrawl) {
    console.log('[Orchestrator] Skipping crawl/fetch stage, reusing RawPage collection...');
    return await RawPageModel.find().limit(3);
  }

  // Map Stage 1 output CandidateURL[] to CandidateSearchResult format for legacy Stage 2 compatibility
  const legacyCandidates = candidates.map((c, idx) => ({
    url: c.url,
    title: c.source,
    snippet: c.snippet,
    domain: new URL(c.url).hostname,
    queryUsed: c.query,
    score: c.score,
    retrievedAt: c.discoveredAt,
    scoreBreakdown: { trust: 0, keyword: 0, freshness: 0, urlQuality: 0 },
    source: 'tavily' as const,
    searchRank: idx + 1,
  }));

  const crawlResponse = await extractCandidatePages(legacyCandidates);
  return crawlResponse.extracted || [];
}

/**
 * Stage 3: AI Extraction (Legacy downstream wrapper)
 */
async function runStage3Extraction(
  fetchedPages: any[],
  options?: DiscoveryOptions,
): Promise<Opportunity[]> {
  console.log('[Pipeline] Stage 3: AI Extraction...');
  if (options?.skipExtract) {
    console.log('[Orchestrator] Skipping extraction stage...');
    return [];
  }

  const extractions: Opportunity[] = [];
  for (const page of fetchedPages) {
    try {
      const opp = await extractOpportunityFromPage(page, 14, 'orchestrated query');
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

  // 2. Execute Stage 2 (Legacy Fetch)
  const fetched = await runStage2Fetch(candidates, options);

  // 3. Execute Stage 3 (Legacy Extraction)
  const extractions = await runStage3Extraction(fetched, options);

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

  console.log(`
========== Scout Discovery Report ==========
Sources Crawled:          ${TRUSTED_SOURCES.length}
Pages Discovered:        ${candidates.length}
Pages Fetched:           ${fetched.length}
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
    crawledPages: fetched.length,
    snippetBypasses: 0,
    extracted: extractions.length,
    inserted,
    updated: merged,
    unchanged,
    cacheHits: 0,
    cacheMisses: fetched.length,
    aiFailures: 0,
    crawlFailures: rejectedCount,
    totalLatency: latencyMs,
  };

  return {
    runId,
    metrics,
    failedItems: [],
  };
}
