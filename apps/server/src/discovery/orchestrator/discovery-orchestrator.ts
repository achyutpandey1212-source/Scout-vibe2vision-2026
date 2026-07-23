import crypto from 'crypto';
import { DiscoveryRunModel } from '../persistence/discovery-run.model';
import { RawPageModel } from '../firecrawl/raw-page.model';
import { CandidateURL } from '../stages/stage1';
import { CrawledPage } from '../stages/stage2';
import { DiscoveryContext } from '../types/query.types';
import { DiscoveryOptions, DiscoveryOrchestratorResponse, PipelineMetrics } from './pipeline.types';
import { parseDiscoveryInput } from '../utils/input-parser';
import { JobBoardExtractor } from '../query-engine/job-board-extractor';
import { DashboardStateInstance } from '../utils/dashboard-state';
import { sourceRegistryService } from '../sources/source-registry.service';
import { DiscoveryBatchProcessor, BatchMetrics } from './discovery-batch-processor';
import { CANONICAL_TARGET_AUDIENCE, VERSION_CONSTANTS } from '@scout/shared';

/**
 * Discovery Orchestrator coordinating Streaming Batch Pipeline (Phase 3)
 */
export async function discoverOpportunities(
  context: DiscoveryContext,
  options?: DiscoveryOptions,
): Promise<DiscoveryOrchestratorResponse> {
  const startedAt = new Date();
  const startTime = Date.now();

  const batchSizeRaw = process.env.DISCOVERY_BATCH_SIZE;
  const batchSize = batchSizeRaw ? parseInt(batchSizeRaw, 10) : 10;
  const totalTargetLimit = (options as any)?.maxTargets || 50;

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Discovery Controller V3] Starting Streaming Pipeline
Batch Size: ${batchSize} (Config: DISCOVERY_BATCH_SIZE)
Total Targets Limit: ${totalTargetLimit}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

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

  // Build filter query based on run mode
  const runMode = (context as any).runMode || 'due';
  const runCategory = (context as any).runCategory;
  const runCustomDomains: string[] = parseDiscoveryInput((context as any).runCustomDomains);

  let targets: any[] = [];

  if (runMode === 'custom' && runCustomDomains.length > 0) {
    console.log(`
================================
Discovery Mode: CUSTOM
================================

Discovery Input

Submitted URLs: ${runCustomDomains.length}

${runCustomDomains.map((url, i) => `[${i + 1}]\n${url}`).join('\n\n')}

Sources Scheduled: ${runCustomDomains.length}
`);

    targets = runCustomDomains.map((rawUrl) => {
      const trimmed = rawUrl.trim();
      const cleanDomain = JobBoardExtractor.getBoardIdentifier(trimmed);
      return {
        domain: cleanDomain,
        organization: cleanDomain.split('.')[0],
        homepage: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
        strategy: 'direct',
        defaultTags: ['custom-crawl'],
        trustScore: 80,
        priority: 'high',
      };
    });
  } else {
    console.log(`
================================
Discovery Mode: SCHEDULED
================================
`);

    const filterQuery: Record<string, any> = {};
    if (runMode === 'high-priority') {
      filterQuery.priority = { $in: ['critical', 'high'] };
    } else if (runMode === 'category' && runCategory) {
      if (runCategory === 'STARTUP_INTERNSHIPS') {
        filterQuery.$or = [
          { category: 'STARTUP_INTERNSHIPS' },
          { category: 'INTERNSHIPS', ecosystemType: { $in: ['STARTUP', 'INCUBATOR'] } },
        ];
      } else {
        filterQuery.category = runCategory;
      }
    } else if (runMode === 'active') {
      filterQuery.bypassDueCheck = true;
    }

    // Fetch all due targets for this run using persistent round-robin cursor
    targets = await sourceRegistryService.getDueSourcesWithCursor(totalTargetLimit, filterQuery);
  }

  if (targets.length === 0) {
    console.warn(`[Discovery Controller] No sources due or found for mode: ${runMode}`);
    return {
      runId: `run_${Date.now()}`,
      metrics: {
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
        totalLatency: Date.now() - startTime,
      },
      failedItems: [],
    };
  }

  const totalBatches = Math.ceil(targets.length / batchSize);
  const allBatchMetrics: BatchMetrics[] = [];
  let totalSourcesProcessed = 0;

  // Streaming Batch Pipeline Execution
  for (let i = 0; i < targets.length; i += batchSize) {
    const batchSources = targets.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    const processor = new DiscoveryBatchProcessor();
    try {
      const batchMetrics = await processor.processBatch({
        batchNumber,
        totalBatches,
        sources: batchSources,
        context,
        options,
      });
      allBatchMetrics.push(batchMetrics);
      totalSourcesProcessed += batchSources.length;
    } catch (batchErr: any) {
      console.error(`[Discovery Controller] Batch ${batchNumber} failed: ${batchErr.message}`);
    } finally {
      // Memory cleanup after each batch before fetching next batch
      processor.clear();
    }
  }

  // Calculate Aggregated Metrics
  const totalUrlsFound = allBatchMetrics.reduce((sum, b) => sum + b.urlsFound, 0);
  const totalPagesCrawled = allBatchMetrics.reduce((sum, b) => sum + b.pagesCrawled, 0);
  const totalExtractions = allBatchMetrics.reduce((sum, b) => sum + b.extractedCount, 0);
  const totalAccepted = allBatchMetrics.reduce((sum, b) => sum + b.acceptedCount, 0);
  const totalRejected = allBatchMetrics.reduce((sum, b) => sum + b.rejectedCount, 0);
  const totalDuplicates = allBatchMetrics.reduce((sum, b) => sum + b.duplicateCount, 0);
  const totalSaved = allBatchMetrics.reduce((sum, b) => sum + b.savedCount, 0);
  const totalDurationMs = Date.now() - startTime;

  const batchTimes = allBatchMetrics.map((b) => b.durationMs);
  const avgBatchMs =
    batchTimes.length > 0
      ? Math.round(batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length)
      : 0;
  const fastestBatchMs = batchTimes.length > 0 ? Math.min(...batchTimes) : 0;
  const slowestBatchMs = batchTimes.length > 0 ? Math.max(...batchTimes) : 0;

  // Print Discovery Health Report (Task 5)
  const dbState = DashboardStateInstance.getState();
  const detectorPassPercent =
    totalPagesCrawled > 0
      ? Math.round(((totalPagesCrawled - (dbState.detectorSkipped || 0)) / totalPagesCrawled) * 100)
      : 0;
  const extractionPercent =
    totalExtractions > 0 ? Math.round((totalAccepted / totalExtractions) * 100) : 0;
  const acceptancePercent =
    totalPagesCrawled > 0 ? Math.round((totalAccepted / totalPagesCrawled) * 100) : 0;
  const avgOppsPerDir = dbState.averageOpportunitiesPerDirectory || 0;
  const avgOppsPerSource =
    totalSourcesProcessed > 0 ? Math.round((totalAccepted / totalSourcesProcessed) * 10) / 10 : 0;
  const avgPagesPerOpp =
    totalAccepted > 0 ? Math.round((totalPagesCrawled / totalAccepted) * 10) / 10 : 0;
  const skippedPdfs = dbState.skippedNonHtmlResources || 0;

  console.log(`
Discovery Health
==========================
Sources:                ${totalSourcesProcessed}
Pages:                  ${totalPagesCrawled}
Directories:            ${dbState.careerPages || 0}
ATS Boards:             ${dbState.atsPagesDetected || 0}
Single Listings:        ${totalPagesCrawled - (dbState.careerPages || 0) - (dbState.atsPagesDetected || 0)}
Directories Expanded:   ${dbState.multiJobPages || 0}
Candidate URLs:         ${totalUrlsFound}
Detector Pass %:        ${detectorPassPercent}%
Extraction %:           ${extractionPercent}%
Acceptance %:           ${acceptancePercent}%
Average Opportunities Per Directory: ${avgOppsPerDir}
Average Opportunities Per Source:    ${avgOppsPerSource}
Average Pages Per Opportunity:       ${avgPagesPerOpp}
Skipped PDFs/Non-HTML:               ${skippedPdfs}
Skipped Blogs:                       ${dbState.queriesSkipped || 0}
Skipped News:                        0
Token Savings:                       0 tokens
API Calls:                           ${totalPagesCrawled}
Estimated Cost:                      $${(totalExtractions * 0.015 + totalPagesCrawled * 0.005).toFixed(3)}
==========================`);

  // Print Final Production Discovery Report
  console.log(`
========== Discovery Report ==========
Sources Processed:    ${totalSourcesProcessed}
Pages Crawled:        ${totalPagesCrawled}
AI Extractions:       ${totalExtractions}
Accepted:             ${totalAccepted}
Rejected:             ${totalRejected}
Duplicates:           ${totalDuplicates}
Saved:                ${totalSaved}
Registry Updated:     ${totalSourcesProcessed}
Average Batch Time:   ${(avgBatchMs / 1000).toFixed(1)}s
Fastest Batch:        ${(fastestBatchMs / 1000).toFixed(1)}s
Slowest Batch:        ${(slowestBatchMs / 1000).toFixed(1)}s
Total Runtime:        ${(totalDurationMs / 1000).toFixed(1)}s
======================================`);

  // Save Run Audit Record in DB
  let runId = `run_${Date.now()}`;
  try {
    const runDoc = await DiscoveryRunModel.create({
      startedAt,
      finishedAt: new Date(),
      targetAudience: CANONICAL_TARGET_AUDIENCE,
      categories: context.categories,
      totalQueries: totalSourcesProcessed,
      inserted: totalSaved,
      updated: totalDuplicates,
      failures: totalRejected,
      duration: Math.round(totalDurationMs / 1000),
      missionVersion: VERSION_CONSTANTS.mission,
      categoryVersion: VERSION_CONSTANTS.category,
      schemaVersion: VERSION_CONSTANTS.schema,
      promptVersion: VERSION_CONSTANTS.prompt,
      registryVersion: VERSION_CONSTANTS.registry,
    });
    runId = runDoc._id.toString();
  } catch (runErr: any) {
    console.error('[Orchestrator] Failed logging run details:', runErr.message);
  }

  const metrics: PipelineMetrics = {
    queriesGenerated: totalSourcesProcessed,
    searchResults: totalUrlsFound,
    acceptedCandidates: totalUrlsFound,
    crawledPages: totalPagesCrawled,
    snippetBypasses: 0,
    extracted: totalExtractions,
    inserted: totalSaved,
    updated: totalDuplicates,
    unchanged: 0,
    cacheHits: 0,
    cacheMisses: totalPagesCrawled,
    aiFailures: 0,
    crawlFailures: 0,
    totalLatency: totalDurationMs,
  };

  return {
    runId,
    metrics,
    failedItems: [],
  };
}
