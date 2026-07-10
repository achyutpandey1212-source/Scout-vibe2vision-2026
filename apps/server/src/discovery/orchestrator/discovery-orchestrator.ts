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

/**
 * Exposes a single public entrypoint orchestrating the entire Discovery Engine pipeline
 * (AI Planner -> Tavily Search -> Firecrawl Scraper -> AI Extractor -> Repository Upsert -> Runs Telemetry).
 */
export async function discoverOpportunities(
  context: DiscoveryContext,
  options?: DiscoveryOptions,
): Promise<DiscoveryOrchestratorResponse> {
  const startedAt = new Date();
  const startTime = Date.now();

  const failedItems: { url: string; reason: string; stage: string }[] = [];
  const metrics: PipelineMetrics = {
    queriesGenerated: 0,
    searchResults: 0,
    acceptedCandidates: 0,
    crawledPages: 0,
    snippetBypasses: 0,
    extracted: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    cacheHits: 0,
    cacheMisses: 0,
    aiFailures: 0,
    crawlFailures: 0,
    totalLatency: 0,
  };

  // Step 1 & 2: Generate search queries & execute Tavily Search
  let searchResponse: any = { accepted: [], rejected: [] };
  if (!options?.skipSearch) {
    console.log('[Orchestrator] Step 1: Running Query Planner...');
    const plannerResponse = await generateSearchQueries(context);
    metrics.queriesGenerated = plannerResponse.queries.length;

    console.log('[Orchestrator] Step 2: Running Search Orchestrator...');
    searchResponse = await searchOpportunities(plannerResponse);
    metrics.searchResults = searchResponse.accepted.length + searchResponse.rejected.length;
    metrics.acceptedCandidates = searchResponse.accepted.length;
  } else {
    console.log('[Orchestrator] Skipping Search steps (skipSearch=true)...');
  }

  // Step 3: Crawl candidate pages via Firecrawl
  let crawledPages: any[] = [];
  if (!options?.skipCrawl) {
    console.log('[Orchestrator] Step 3: Running Firecrawl Extraction Layer...');
    const crawlResponse = await extractCandidatePages(searchResponse.accepted);
    crawledPages = crawlResponse.extracted;
    metrics.crawlFailures = crawlResponse.failed.length;

    // Accumulate metrics from scraping
    crawledPages.forEach((p) => {
      if (p.source === 'tavily_snippet') {
        metrics.snippetBypasses++;
      } else if (p.source === 'firecrawl') {
        metrics.crawledPages++;
        if (!p.needsExtraction) {
          metrics.cacheHits++;
        } else {
          metrics.cacheMisses++;
        }
      }
    });

    for (const fail of crawlResponse.failed) {
      failedItems.push({ url: fail.url, reason: fail.reason, stage: 'firecrawl' });
    }
  } else {
    console.log('[Orchestrator] Skipping Crawling (skipCrawl=true). Reusing raw pages from DB...');
    crawledPages = await RawPageModel.find().limit(3);
  }

  // Step 4: Extract structured opportunities using AI Extractor
  const extractedOpportunities: Opportunity[] = [];
  if (!options?.skipExtract) {
    console.log('[Orchestrator] Step 4: Running AI Opportunity Extraction...');
    for (const page of crawledPages) {
      try {
        const opp = await extractOpportunityFromPage(page, 14, 'orchestrated query');
        extractedOpportunities.push(opp);
        metrics.extracted++;
      } catch (err: any) {
        metrics.aiFailures++;
        failedItems.push({ url: page.url, reason: err.message, stage: 'extraction' });
      }
    }
  } else {
    console.log('[Orchestrator] Skipping AI Opportunity Extraction (skipExtract=true)...');
  }

  // Step 5: Persist structured opportunities via Repository Layer
  if (extractedOpportunities.length > 0) {
    console.log('[Orchestrator] Step 5: Upserting opportunities in repository...');
    const repoResult = await OpportunityRepository.upsertOpportunities(extractedOpportunities);
    metrics.inserted = repoResult.inserted;
    metrics.updated = repoResult.updated;
    metrics.unchanged = repoResult.unchanged;
  }

  const finishedAt = new Date();
  metrics.totalLatency = Date.now() - startTime;
  const durationSec = metrics.totalLatency / 1000;

  // Log DiscoveryRun execution summary to MongoDB
  let runId = 'mock_run_id';
  try {
    const runDoc = await DiscoveryRunModel.create({
      startedAt,
      finishedAt,
      targetAudience: context.targetAudience,
      categories: context.categories,
      totalQueries: metrics.queriesGenerated,
      inserted: metrics.inserted,
      updated: metrics.updated,
      failures: failedItems.length,
      duration: durationSec,
    });
    runId = runDoc._id.toString();
  } catch (runErr: any) {
    console.error('[Orchestrator] Failed logging discovery run to DB:', runErr.message);
  }

  const duplicatesRemoved =
    searchResponse.rejected?.filter((r: any) => r.rejectionReason === 'Duplicate URL').length || 0;

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scout Discovery Run (${runId})
Queries Generated:  ${metrics.queriesGenerated}
URLs Found:         ${metrics.searchResults}
Duplicates Removed: ${duplicatesRemoved}
Firecrawl Requests: ${metrics.crawledPages}
Snippet Bypass:     ${metrics.snippetBypasses}
Cache Hits:         ${metrics.cacheHits}
AI Extractions:     ${metrics.extracted}
Inserted:           ${metrics.inserted}
Updated:            ${metrics.updated}
Unchanged:          ${metrics.unchanged}
Rejected/Failures:  ${failedItems.length}
Runtime:            ${durationSec.toFixed(1)}s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  return {
    runId,
    metrics,
    failedItems,
  };
}
