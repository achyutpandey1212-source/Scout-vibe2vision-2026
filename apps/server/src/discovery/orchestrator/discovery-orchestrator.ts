import { DiscoveryRunModel } from '../persistence/discovery-run.model';
import { OpportunityRepository } from '../persistence/opportunity.repository';
import { generateSearchQueries } from '../query-planner/query-planner';
import { searchOpportunities } from '../search/search-orchestrator';
import { extractCandidatePages } from '../firecrawl/extraction-orchestrator';
import { extractOpportunityFromPage } from '../extraction/extractor/opportunity-extractor';
import { RawPageModel } from '../firecrawl/raw-page.model';
import { DiscoveryContext } from '../types/query.types';
import { DiscoveryOptions, DiscoveryOrchestratorResponse, PipelineMetrics } from './pipeline.types';
import { Opportunity } from '../extraction/types/opportunity.types';
import { TRUSTED_SOURCES } from '../sources/registry';
import { QualityScorer } from '../utils/quality-scorer';
import { OpportunityArchiver } from '../utils/archiver';

/**
 * Stage 1: Discovery (Sources & Registry Queries)
 */
export async function runDiscoveryStage(context: DiscoveryContext): Promise<any[]> {
  console.log('[Pipeline] Stage 1: Discovery - Running Query Planner & Search...');
  const plannerResponse = await generateSearchQueries(context);
  const searchResult = await searchOpportunities(plannerResponse);
  return searchResult.accepted || [];
}

/**
 * Stage 2: URL Validation
 */
export function runUrlValidationStage(candidates: any[]): any[] {
  console.log('[Pipeline] Stage 2: URL Validation...');
  return candidates.filter((c) => {
    try {
      const url = new URL(c.url);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  });
}

/**
 * Stage 3: Fetching
 */
export async function runFetchStage(validatedCandidates: any[]): Promise<any[]> {
  console.log('[Pipeline] Stage 3: Fetching via Firecrawl Extraction Layer...');
  const crawlResponse = await extractCandidatePages(validatedCandidates);
  return crawlResponse.extracted || [];
}

/**
 * Stage 4: AI Extraction
 */
export async function runExtractionStage(fetchedPages: any[]): Promise<Opportunity[]> {
  console.log('[Pipeline] Stage 4: AI Extraction...');
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
 * Stage 5: Quality Scorer & Threshold Check
 */
export function runQualityScorerStage(extractions: Opportunity[]): {
  accepted: Opportunity[];
  rejectedCount: number;
} {
  console.log('[Pipeline] Stage 5: Quality Scorer & Threshold checking...');
  const accepted: Opportunity[] = [];
  let rejectedCount = 0;

  for (const opp of extractions) {
    const evaluation = QualityScorer.evaluate(opp);
    opp.qualityScore = evaluation.score;
    opp.qualityBreakdown = evaluation.breakdown as any;

    // Assign trust level based on source registry verification
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
 * Stage 6: Deduplication & Persistent Storage
 */
export async function runPersistenceStage(
  acceptedOpps: Opportunity[],
): Promise<{ inserted: number; merged: number; unchanged: number }> {
  console.log('[Pipeline] Stage 6: Deduplicating and writing to storage...');
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
 * Public Orchestrator Entrypoint
 */
export async function discoverOpportunities(
  context: DiscoveryContext,
  options?: DiscoveryOptions,
): Promise<DiscoveryOrchestratorResponse> {
  const startedAt = new Date();
  const startTime = Date.now();

  // 1. Discovery (Stage 1)
  let candidates: any[] = [];
  if (!options?.skipSearch) {
    candidates = await runDiscoveryStage(context);
  } else {
    console.log('[Orchestrator] Skipping search stage...');
  }

  // 2. URL Validation (Stage 2)
  const validated = runUrlValidationStage(candidates);

  // 3. Fetching (Stage 3)
  let fetched: any[] = [];
  if (!options?.skipCrawl) {
    fetched = await runFetchStage(validated);
  } else {
    console.log('[Orchestrator] Skipping crawl/fetch stage, reusing RawPage collection...');
    fetched = await RawPageModel.find().limit(3);
  }

  // 4. Extraction (Stage 4)
  let extractions: Opportunity[] = [];
  if (!options?.skipExtract) {
    extractions = await runExtractionStage(fetched);
  } else {
    console.log('[Orchestrator] Skipping extraction stage...');
  }

  // 5. Quality Filter (Stage 5)
  const { accepted, rejectedCount } = runQualityScorerStage(extractions);

  // 6. Persistence & Deduplication (Stage 6)
  const { inserted, merged, unchanged } = await runPersistenceStage(accepted);

  // 7. Archive expired opportunities
  const archivedCount = await OpportunityArchiver.archiveExpired();

  const finishedAt = new Date();
  const latencyMs = Date.now() - startTime;
  const durationSec = latencyMs / 1000;

  // Calculate average quality score
  const avgQualityScore =
    accepted.length > 0
      ? Math.round(
          (accepted.reduce((sum, o) => sum + (o.qualityScore || 0), 0) / accepted.length) * 10,
        ) / 10
      : 0;

  // Print Formatted Pipeline Run Report
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

  // Log summary metrics metadata to DB
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
    acceptedCandidates: validated.length,
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
