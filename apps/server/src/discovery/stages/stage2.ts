import { IPipelineStage } from './pipeline-stage.interface';
import { CandidateURL } from './stage1';
import { CrawlPlanner } from '../utils/crawl-planner';
import { FirecrawlClient } from '../firecrawl/firecrawl.client';
import { redis } from '../../config/redis';
import { normalizeUrl } from '../search/search-orchestrator';
import { DashboardStateInstance } from '../utils/dashboard-state';
import { AffiliateExtractor } from '../sources/affiliate-extractor';
import { OpportunityDiscoveryRouter } from '../query-engine/opportunity-discovery-router';
import { ATSParser } from '../query-engine/ats-parser/ats-parser';
import { MultiOpportunityExtractor } from '../query-engine/multi-opportunity-extractor';
import { CrawlBudgetManager } from '../query-engine/crawl-budget-manager';
import { CandidateScorer } from '../query-engine/candidate-scorer';
import { EligibilityFilter } from '../query-engine/eligibility-filter';
import { FreshnessFilter } from '../query-engine/freshness-filter';
import { JobBoardExtractor } from '../query-engine/job-board-extractor';

export interface CrawledPage {
  url: string;
  title: string;
  markdown: string;
  metadata: unknown;
  fetchMethod: 'firecrawl' | 'cache' | 'snippet' | 'skipped';
  crawlStatus: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'BLOCKED';
  crawlTime: number; // In milliseconds
  tokenEstimate: number;
  source: string;
  crawlReason: string;
  failureReason?: string;
  query?: string;
}

export class Stage2Crawling implements IPipelineStage<CandidateURL[], CrawledPage[]> {
  private readonly firecrawlClient: FirecrawlClient;
  private static glassdoorLinkLogCount = 0;

  constructor() {
    this.firecrawlClient = new FirecrawlClient();
  }

  /**
   * Executes Stage 2: Intelligent Crawling & Content Acquisition
   */
  async execute(
    candidates: CandidateURL[],
    _options?: { maxExtractions?: number },
  ): Promise<CrawledPage[]> {
    console.log(
      `[Stage 2] Initializing classification and prioritized crawling for ${candidates.length} candidates...`,
    );

    const redisClient = redis.getClient();
    const results: CrawledPage[] = [];

    // Initialize depth and traversal paths
    const seedQueue = candidates
      .filter((c) => {
        const scoreObj = CandidateScorer.scoreCandidate(c.url);
        return scoreObj.pageType !== 'BLOG' && scoreObj.pageType !== 'DOCUMENTATION';
      })
      .map((c) => ({
        ...c,
        depth: (c as any).depth || 1,
        path: (c as any).path || JobBoardExtractor.classifyUrl(c.url),
      }))
      .sort((a, b) => {
        const scoreA = CandidateScorer.scoreCandidate(a.url).score;
        const scoreB = CandidateScorer.scoreCandidate(b.url).score;
        return scoreB - scoreA;
      });

    // Dedicated Opportunity Queue for direct listings discovered on board listing pages
    const opportunityQueue: any[] = [];
    const expandedBoardPages = new Set<string>();
    const processedUrls = new Set<string>(candidates.map((c) => normalizeUrl(c.url)));
    const budgetManager = new CrawlBudgetManager();

    // Navigational Telemetry
    let searchPagesCount = 0;
    let companyPagesCount = 0;
    let listingPagesCount = 0;
    let jobDetailsCount = 0;
    let maxNavigationDepth = 1;
    let totalCardsFoundAcrossRuns = 0;
    let pagesWithCardsCount = 0;
    let jobsDiscoveredFromCompanies = 0;
    const traversalsList: string[] = [];

    // Listings-specific telemetry counters
    let boardPagesCount = 0;
    let listingsHarvestedCount = 0;
    let listingsCrawledCount = 0;
    let listingsDeduplicatedCount = 0;
    let listingPagesSkippedCount = 0;
    let jobDetailUrlsExtractedCount = 0;
    let listingUrlsDiscardedCount = 0;
    let queuePeakSize = seedQueue.length;
    let recursiveExpansionsPrevented = 0;

    const MAX_TOTAL_DISCOVERED_LISTINGS_PER_RUN = parseInt(
      process.env.MAX_TOTAL_DISCOVERED_LISTINGS_PER_RUN || '250',
      10,
    );

    let failedCount = 0;
    let atsPagesCount = 0;
    let careerPagesCount = 0;
    let multiJobPagesCount = 0;
    let jobsExtractedCount = 0;

    const failuresByType: Record<string, number> = {};

    const trackFailure = (type: string) => {
      failuresByType[type] = (failuresByType[type] || 0) + 1;
    };

    const concurrencyRaw = process.env.DISCOVERY_FIRECRAWL_CONCURRENCY;
    const concurrency = concurrencyRaw ? parseInt(concurrencyRaw, 10) : 2;
    console.log(`[Stage 2] Running adaptive crawling with queue concurrency: ${concurrency}`);

    let completedCount = 0;
    let batchNumber = 0;

    // Outer Loop: Process until both queues are empty
    while (opportunityQueue.length > 0 || seedQueue.length > 0) {
      batchNumber++;

      const currentQueueSize = opportunityQueue.length + seedQueue.length;
      if (currentQueueSize > queuePeakSize) {
        queuePeakSize = currentQueueSize;
      }

      const currentBatch: any[] = [];
      while (
        currentBatch.length < concurrency &&
        (opportunityQueue.length > 0 || seedQueue.length > 0)
      ) {
        if (opportunityQueue.length > 0) {
          const item = opportunityQueue.shift()!;
          currentBatch.push(item);
          listingsCrawledCount++;
        } else {
          currentBatch.push(seedQueue.shift()!);
        }
      }

      const totalRemaining = opportunityQueue.length + seedQueue.length;

      // Update dashboard telemetry state
      DashboardStateInstance.updateState({
        currentStage: 'STAGE_2_CRAWLING',
        crawlQueueRemaining: totalRemaining,
        crawlBatchNumber: batchNumber,
        crawlCurrentlyCrawling: currentBatch.map((c) => c.url),
        crawlCompleted: completedCount,
        crawlFailed: failedCount,
      });

      console.log(
        `\n[Stage 2] [Queue Processing] Starting Batch #${batchNumber} (Processing ${currentBatch.length} URLs, Remaining in Queue: ${totalRemaining})`,
      );

      const batchPromises = currentBatch.map(async (candidate) => {
        const startTime = Date.now();
        const plan = CrawlPlanner.evaluate(candidate);
        const normalized = normalizeUrl(candidate.url);
        const cacheKey = `firecrawl:${normalized}`;
        const parentDepth = candidate.depth || 1;
        const parentPath = candidate.path || 'Unknown';

        if (parentDepth > maxNavigationDepth) {
          maxNavigationDepth = parentDepth;
        }

        const route = OpportunityDiscoveryRouter.route(candidate.url);
        if (route === 'ATS_DIRECTORY' || route === 'SINGLE_OPPORTUNITY') atsPagesCount++;
        else if (route === 'MULTI_OPPORTUNITY_DIRECTORY') careerPagesCount++;

        const preScore = CandidateScorer.scoreCandidate(candidate.url);

        if (plan.decision === 'SKIP' || preScore.score < 20) {
          if (plan.reason === 'SKIPPED_NON_HTML_RESOURCE') {
            DashboardStateInstance.updateState({
              skippedNonHtmlResources:
                (DashboardStateInstance.getState().skippedNonHtmlResources || 0) + 1,
            });
          }
          return {
            url: candidate.url,
            title: candidate.source,
            markdown: '',
            metadata: {},
            fetchMethod: 'skipped' as const,
            crawlStatus: 'SKIPPED' as const,
            crawlTime: 0,
            tokenEstimate: 0,
            source: candidate.source,
            crawlReason: plan.reason,
          };
        }

        let cachedContent: string | null = null;
        try {
          cachedContent = await redisClient.get(cacheKey);
        } catch {
          console.error(`[Stage 2] [Cache Error] Failed reading Redis for ${candidate.url}:`);
        }

        let rawMarkdown = '';
        let cleanMetadata: Record<string, unknown> = {};
        let fetchMethod: 'firecrawl' | 'cache' | 'snippet' = 'cache';
        let crawlStatus: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'SKIPPED' = 'SUCCESS';
        let duration = 0;

        if (cachedContent) {
          try {
            const parsed = JSON.parse(cachedContent);
            duration = Date.now() - startTime;
            rawMarkdown = parsed.markdown;
            cleanMetadata = parsed.metadata || {};
            fetchMethod = 'cache';
          } catch {
            cachedContent = null;
          }
        }

        if (!cachedContent && plan.decision === 'USE_FIRECRAWL') {
          try {
            const scrapeResponse = await this.firecrawlClient.scrape(candidate.url);
            duration = Date.now() - startTime;

            rawMarkdown = scrapeResponse.data?.markdown || '';

            const validation = CrawlPlanner.validateContent(rawMarkdown);
            if (!validation.valid) {
              failedCount++;
              const type = validation.reason || 'CONTENT_TOO_SMALL';
              trackFailure(type);

              return {
                url: candidate.url,
                title: candidate.source,
                markdown: '',
                metadata: {},
                fetchMethod: 'firecrawl' as const,
                crawlStatus: 'FAILED' as const,
                crawlTime: duration,
                tokenEstimate: 0,
                source: candidate.source,
                crawlReason: plan.reason,
                failureReason: type,
              };
            }

            const rawMetadata = scrapeResponse.data?.metadata || {};
            cleanMetadata = {
              domain: new URL(candidate.url).hostname,
            };

            const cleanValue = (val: unknown): unknown => {
              if (Array.isArray(val)) {
                if (val.length === 0) return undefined;
                return cleanValue(val[0]);
              }
              return val;
            };

            for (const key in rawMetadata) {
              const cleaned = cleanValue(rawMetadata[key]);
              if (cleaned !== undefined) {
                cleanMetadata[key] = String(cleaned);
              }
            }

            if (!cleanMetadata.description) cleanMetadata.description = '';
            if (!cleanMetadata.language) cleanMetadata.language = 'en';

            try {
              await redisClient.setex(
                cacheKey,
                86400,
                JSON.stringify({
                  markdown: rawMarkdown,
                  metadata: cleanMetadata,
                  timestamp: new Date().toISOString(),
                }),
              );
            } catch {
              console.error(`[Stage 2] [Cache Error] Failed writing cache for ${candidate.url}:`);
            }

            try {
              const sourceDomain = new URL(candidate.url).hostname;
              const affiliates = AffiliateExtractor.extract(rawMarkdown, sourceDomain);
              if (affiliates.length > 0) {
                AffiliateExtractor.queue(affiliates, sourceDomain).catch(() => {});
              }
            } catch {
              // Ignored
            }

            fetchMethod = 'firecrawl';
          } catch (crawlErr: unknown) {
            const message = crawlErr instanceof Error ? crawlErr.message : String(crawlErr);
            console.warn(
              `[Stage 2] [Firecrawl Error] ${candidate.url} failed (${message}). Attempting fallback fetch...`,
            );

            // Fallback fetch execution
            let fallbackMarkdown = candidate.snippet || '';
            let fallbackTitle = candidate.source || 'Unknown';
            let fallbackSuccess = false;

            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000);
              const httpRes = await fetch(candidate.url, {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
                signal: controller.signal,
              });
              clearTimeout(timeoutId);

              if (httpRes.ok) {
                const htmlText = await httpRes.text();
                const titleMatch = htmlText.match(/<title[^>]*>([^<]+)<\/title>/i);
                if (titleMatch) fallbackTitle = titleMatch[1].trim();

                const cleanText = htmlText
                  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();

                if (cleanText.length > 20) {
                  fallbackMarkdown = cleanText;
                  fallbackSuccess = true;
                }
              }
            } catch (fallbackErr: any) {
              console.warn(
                `[Stage 2] [Fallback Fetch Error] ${candidate.url}: ${fallbackErr.message}`,
              );
            }

            if (!fallbackSuccess && candidate.snippet && candidate.snippet.length > 20) {
              fallbackMarkdown = candidate.snippet;
              fallbackSuccess = true;
            }

            if (fallbackSuccess) {
              console.log(
                `[Stage 2] [Fallback Success] Recovered content for ${candidate.url} via fallback fetch.`,
              );
              rawMarkdown = fallbackMarkdown;
              cleanMetadata = {
                domain: new URL(candidate.url).hostname,
                title: fallbackTitle,
                description: '',
                language: 'en',
              };
              fetchMethod = 'snippet';
              crawlStatus = 'SUCCESS';
            } else {
              failedCount++;
              let type = 'PROVIDER_FAILURE';
              const isBlocked = message.includes('BLOCKED') || message.includes('403');
              if (isBlocked) type = 'BLOCKED';
              else if (message.includes('401')) type = 'INVALID_API_KEY';
              else if (message.includes('402')) type = 'PROVIDER_FAILURE';
              else if (message.includes('429')) type = 'RATE_LIMIT';
              else if (message.includes('timeout') || message.includes('timed out'))
                type = 'TIMEOUT';
              else type = 'NETWORK_FAILURE';

              trackFailure(type);

              return {
                url: candidate.url,
                title: candidate.source,
                markdown: '',
                metadata: {},
                fetchMethod: 'firecrawl' as const,
                crawlStatus: type === 'BLOCKED' ? ('BLOCKED' as const) : ('FAILED' as const),
                crawlTime: duration,
                tokenEstimate: 0,
                source: candidate.source,
                crawlReason: plan.reason,
                failureReason: type,
              };
            }
          }
        }

        if (!cachedContent && plan.decision === 'USE_SNIPPET') {
          duration = Date.now() - startTime;
          rawMarkdown = candidate.snippet || '';
          cleanMetadata = { domain: new URL(candidate.url).hostname };
          fetchMethod = 'snippet';
        }

        if (crawlStatus === 'SUCCESS' && rawMarkdown.length > 10) {
          const pageTitle = (cleanMetadata as any)?.title || candidate.source || 'Unknown';
          const eligibility = EligibilityFilter.isEligible(rawMarkdown, candidate.url, pageTitle);
          if (!eligibility.eligible) {
            console.log(
              `[Stage 2] [Filter Rejected] ${candidate.url} (Geo-restricted: ${eligibility.reason})`,
            );
            crawlStatus = 'FAILED';
            rawMarkdown = '';
          } else {
            const freshness = FreshnessFilter.isFresh(rawMarkdown);
            if (!freshness.fresh) {
              console.log(
                `[Stage 2] [Filter Rejected] ${candidate.url} (Expired/Past year: ${freshness.reason})`,
              );
              crawlStatus = 'FAILED';
              rawMarkdown = '';
            }
          }
        }

        // F. Recursive Job Board & Company Jobs Page Harvesting
        if (crawlStatus === 'SUCCESS' && rawMarkdown.length > 10) {
          const classification = JobBoardExtractor.classifyUrl(candidate.url);
          const isListingBoard = JobBoardExtractor.isBoardPage(candidate.url, rawMarkdown);

          // Update navigation counts
          if (classification === 'SEARCH_PAGE') searchPagesCount++;
          else if (classification === 'COMPANY_JOBS_PAGE') companyPagesCount++;
          else if (classification === 'LISTING_PAGE') listingPagesCount++;
          else if (classification === 'JOB_DETAIL') jobDetailsCount++;

          console.log(
            `[Stage 2] [Navigation] URL: ${candidate.url} | Class: ${classification} | Path: ${parentPath} | Depth: ${parentDepth}`,
          );

          if (
            isListingBoard ||
            classification === 'SEARCH_PAGE' ||
            classification === 'LISTING_PAGE' ||
            classification === 'COMPANY_JOBS_PAGE'
          ) {
            const boardNormalized = JobBoardExtractor.getBoardIdentifier(candidate.url);

            if (!expandedBoardPages.has(boardNormalized)) {
              expandedBoardPages.add(boardNormalized);
              boardPagesCount++;

              const rawListings = JobBoardExtractor.extractListings(rawMarkdown, candidate.url);
              listingsHarvestedCount += rawListings.length;

              if (rawListings.length > 0) {
                pagesWithCardsCount++;
                totalCardsFoundAcrossRuns += rawListings.length;
              }

              if (classification === 'COMPANY_JOBS_PAGE') {
                jobsDiscoveredFromCompanies += rawListings.length;
              }

              let uniqueAddedCount = 0;
              let discardedListingsCount = 0;

              for (const listing of rawListings) {
                // Logs 2 & 3: Trace jl parameter through cleanUrl — first 3 Glassdoor URLs only
                const isGlassdoorTrace =
                  listing.listingUrl.includes('glassdoor') &&
                  Stage2Crawling.glassdoorLinkLogCount < 3;

                if (isGlassdoorTrace) {
                  Stage2Crawling.glassdoorLinkLogCount++;
                  console.log(`BEFORE CLEAN:\n${listing.listingUrl}`);
                }

                const cleanListingUrl = JobBoardExtractor.cleanUrl(listing.listingUrl);

                if (isGlassdoorTrace) {
                  console.log(`AFTER CLEAN:\n${cleanListingUrl}`);
                }

                const normListingUrl = normalizeUrl(cleanListingUrl);
                const childClassification = JobBoardExtractor.classifyUrl(cleanListingUrl);

                // Decline assets and unclassified listings
                if (childClassification === 'UNKNOWN') {
                  discardedListingsCount++;
                  listingUrlsDiscardedCount++;
                  continue;
                }

                if (processedUrls.has(normListingUrl)) {
                  listingsDeduplicatedCount++;
                  continue;
                }

                processedUrls.add(normListingUrl);

                if (jobDetailUrlsExtractedCount <= MAX_TOTAL_DISCOVERED_LISTINGS_PER_RUN) {
                  uniqueAddedCount++;
                  jobDetailUrlsExtractedCount++;

                  const nextPath = `${parentPath} -> ${JobBoardExtractor.getBoardIdentifier(cleanListingUrl)}`;
                  traversalsList.push(nextPath);

                  opportunityQueue.push({
                    url: cleanListingUrl,
                    source: listing.company || candidate.source,
                    domain: candidate.domain,
                    query: `discovered-listing:${candidate.url}`,
                    snippet: '',
                    score: candidate.score,
                    discoveredAt: new Date().toISOString(),
                    // Increment depth for recursive crawl
                    depth: parentDepth + 1,
                    path: nextPath,
                  });
                }
              }

              console.log(`
Listing Board Detected
Domain:                  ${boardNormalized}
Reason Detected:         Known domain or listing structures matched
Cards Found:             ${rawListings.length}
Job Detail URLs:         ${uniqueAddedCount}
Listing URLs Discarded:  ${discardedListingsCount}
Duplicate URLs:          ${rawListings.length - uniqueAddedCount - discardedListingsCount}
Queued:                  ${uniqueAddedCount}
`);
            } else {
              recursiveExpansionsPrevented++;
              listingPagesSkippedCount++;
              console.log(
                `[Stage 2] [Safeguard] Skipping expansion for already harvested board: ${boardNormalized}`,
              );
            }

            // Reject intermediate directories / listings from AI extraction
            crawlStatus = 'SKIPPED';
          } else {
            // Normal ATS or Multi-Opportunity directories
            const isAtsPage = route === 'ATS_DIRECTORY' || route === 'SINGLE_OPPORTUNITY';
            const isCareerPage =
              route === 'MULTI_OPPORTUNITY_DIRECTORY' || route === 'PORTFOLIO_DIRECTORY';

            if (isAtsPage || isCareerPage) {
              const extracted = ATSParser.parse(
                rawMarkdown,
                candidate.url,
                candidate.source,
              ).concat(
                MultiOpportunityExtractor.extract(rawMarkdown, candidate.url, candidate.source),
              );

              if (extracted.length > 0) {
                multiJobPagesCount++;
                jobsExtractedCount += extracted.length;

                for (const job of extracted) {
                  const normJobUrl = normalizeUrl(job.url);
                  const listingClassification = JobBoardExtractor.classifyUrl(job.url);

                  if (
                    (listingClassification === 'JOB_DETAIL' ||
                      listingClassification === 'COMPANY_JOBS_PAGE') &&
                    !processedUrls.has(normJobUrl)
                  ) {
                    processedUrls.add(normJobUrl);

                    if (budgetManager.canVisitCareerPage()) {
                      budgetManager.recordCareerPageVisit();

                      const nextPath = `${parentPath} -> ${JobBoardExtractor.getBoardIdentifier(job.url)}`;
                      traversalsList.push(nextPath);

                      opportunityQueue.push({
                        url: job.url,
                        source: job.source,
                        domain: candidate.domain,
                        query: `discovered:${candidate.url}`,
                        snippet: '',
                        score: candidate.score,
                        discoveredAt: new Date().toISOString(),
                        depth: parentDepth + 1,
                        path: nextPath,
                      });
                    }
                  } else {
                    listingUrlsDiscardedCount++;
                  }
                }
              }
            }
          }
        }

        // Final eligibility validation check
        const pageClassification = JobBoardExtractor.classifyUrl(candidate.url);
        if (pageClassification !== 'JOB_DETAIL' && crawlStatus === 'SUCCESS') {
          crawlStatus = 'SKIPPED';
        }

        return {
          url: candidate.url,
          title: (cleanMetadata as any)?.title || candidate.source || 'Unknown',
          markdown: rawMarkdown,
          metadata: cleanMetadata,
          fetchMethod,
          crawlStatus,
          crawlTime: duration,
          tokenEstimate: Math.round(rawMarkdown.length / 4),
          source: candidate.source,
          crawlReason: plan.reason,
        };
      });

      const batchResults = await Promise.all(batchPromises);
      const mappedResults = batchResults.map((res, index) => ({
        ...res,
        query: currentBatch[index]?.query,
      }));
      results.push(...mappedResults);

      completedCount += batchResults.length;
      console.log(`[Stage 2] [Batch Complete] Processed ${completedCount} total candidates.`);
    }

    const avgOppsPerDir =
      multiJobPagesCount > 0 ? Math.round((jobsExtractedCount / multiJobPagesCount) * 10) / 10 : 0;

    const avgListingsPerBoard =
      boardPagesCount > 0
        ? Math.round((jobDetailUrlsExtractedCount / boardPagesCount) * 10) / 10
        : 0;

    const avgCardsPerPage =
      pagesWithCardsCount > 0
        ? Math.round((totalCardsFoundAcrossRuns / pagesWithCardsCount) * 10) / 10
        : 0;

    const avgJobsPerCompany =
      companyPagesCount > 0
        ? Math.round((jobsDiscoveredFromCompanies / companyPagesCount) * 10) / 10
        : 0;

    // Log Navigation Diagnostics
    console.log(`
[Navigation Diagnostics]
Search Pages:                      ${searchPagesCount}
Company Pages:                     ${companyPagesCount}
Listing Pages:                     ${listingPagesCount}
Job Details:                       ${jobDetailsCount}
Navigation Depth:                  ${maxNavigationDepth}
Average cards per page:            ${avgCardsPerPage}
Average jobs discovered per company: ${avgJobsPerCompany}

Example Traversal Paths:
${
  traversalsList
    .slice(0, 5)
    .map((p) => ` - ${p}`)
    .join('\n') || 'None'
}
`);

    // Dashboard Telemetry
    DashboardStateInstance.updateState({
      crawlCompleted: completedCount,
      pagesCrawled: DashboardStateInstance.getState().pagesCrawled + results.length,
      skippedNonHtmlResources: DashboardStateInstance.getState().skippedNonHtmlResources || 0,
      averageOpportunitiesPerDirectory: avgOppsPerDir,
      boardPagesDetected: boardPagesCount,
      listingsHarvested: listingsHarvestedCount,
      listingsCrawled: listingsCrawledCount,
      listingsDeduplicated: listingsDeduplicatedCount,
      avgListingsPerBoard,
      ...{
        atsPagesDetected: atsPagesCount,
        careerPages: careerPagesCount,
        multiJobPages: multiJobPagesCount,
        jobsExtractedWithoutAI: jobsExtractedCount,
        listingBoardsDetected: boardPagesCount,
        listingPagesSkipped: listingPagesSkippedCount,
        jobDetailUrlsExtracted: jobDetailUrlsExtractedCount,
        jobDetailUrlsCrawled: listingsCrawledCount,
        listingUrlsDiscarded: listingUrlsDiscardedCount,
        duplicateListingUrls: listingsDeduplicatedCount,
        queuePeakSize,
        queueFinalSize: opportunityQueue.length + seedQueue.length,
        averageJobUrlsPerBoard: avgListingsPerBoard,
        recursiveExpansionsPrevented,
      },
    });

    return results;
  }
}
export default Stage2Crawling;
