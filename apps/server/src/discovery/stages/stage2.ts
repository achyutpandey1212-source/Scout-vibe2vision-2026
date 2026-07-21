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

    // Filter and score seed candidates
    const seedQueue = candidates
      .filter((c) => {
        const scoreObj = CandidateScorer.scoreCandidate(c.url);
        return scoreObj.pageType !== 'BLOG' && scoreObj.pageType !== 'DOCUMENTATION';
      })
      .sort((a, b) => {
        const scoreA = CandidateScorer.scoreCandidate(a.url).score;
        const scoreB = CandidateScorer.scoreCandidate(b.url).score;
        return scoreB - scoreA;
      });

    // Dedicated Opportunity Queue for direct listings discovered on board listing pages
    const opportunityQueue: CandidateURL[] = [];
    const expandedBoardPages = new Set<string>();
    const processedUrls = new Set<string>(candidates.map((c) => normalizeUrl(c.url)));
    const budgetManager = new CrawlBudgetManager();

    // Listings-specific counters
    let boardPagesCount = 0;
    let listingsHarvestedCount = 0;
    let listingsCrawledCount = 0;
    let listingsDeduplicatedCount = 0;

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

    // Load configuration for adaptive concurrency
    const concurrencyRaw = process.env.DISCOVERY_FIRECRAWL_CONCURRENCY;
    const concurrency = concurrencyRaw ? parseInt(concurrencyRaw, 10) : 2;
    console.log(`[Stage 2] Running adaptive crawling with queue concurrency: ${concurrency}`);

    let completedCount = 0;
    let batchNumber = 0;

    // Outer Loop: Process until both queues are empty
    while (opportunityQueue.length > 0 || seedQueue.length > 0) {
      batchNumber++;

      // Concurrently process batch prioritizing Opportunity Queue
      const currentBatch: CandidateURL[] = [];
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

      // Update telemetry state
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

        const route = OpportunityDiscoveryRouter.route(candidate.url);
        if (route === 'ATS_DIRECTORY' || route === 'SINGLE_OPPORTUNITY') atsPagesCount++;
        else if (route === 'MULTI_OPPORTUNITY_DIRECTORY') careerPagesCount++;

        // Pre-crawl scoring
        const preScore = CandidateScorer.scoreCandidate(candidate.url);

        // A. Strategy: SKIP
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

        // B. Strategy: Redis cache check
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

        // C. Strategy: Scrape with rate-limited Firecrawl
        if (!cachedContent && plan.decision === 'USE_FIRECRAWL') {
          try {
            const scrapeResponse = await this.firecrawlClient.scrape(candidate.url);
            duration = Date.now() - startTime;

            rawMarkdown = scrapeResponse.data?.markdown || '';
            // Validate content
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
            failedCount++;

            let type = 'NETWORK';
            const message = crawlErr instanceof Error ? crawlErr.message : String(crawlErr);
            const isBlocked = message.includes('BLOCKED');
            if (isBlocked) type = 'BLOCKED';
            else if (message.includes('401')) type = 'INVALID_API_KEY';
            else if (message.includes('429')) type = 'RATE_LIMIT';
            else if (message.includes('timeout') || message.includes('timed out')) type = 'TIMEOUT';

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

        // D. Strategy: Snippet Fallback
        if (!cachedContent && plan.decision === 'USE_SNIPPET') {
          duration = Date.now() - startTime;
          rawMarkdown = candidate.snippet || '';
          cleanMetadata = { domain: new URL(candidate.url).hostname };
          fetchMethod = 'snippet';
        }

        // E. Eligibility, Freshness & Content Signals Filters (Pre-AI)
        if (crawlStatus === 'SUCCESS' && rawMarkdown.length > 10) {
          const eligibility = EligibilityFilter.isEligible(rawMarkdown);
          if (!eligibility.eligible) {
            console.log(
              `[Stage 2] [Filter Rejected] ${candidate.url} (Geo-restricted: ${eligibility.reason})`,
            );
            crawlStatus = 'FAILED';
            rawMarkdown = '';
          } else {
            // 2. Freshness check
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

        // F. Multi-Listing Job Board Detection & Extraction Guard
        if (crawlStatus === 'SUCCESS' && rawMarkdown.length > 10) {
          const isListingBoard = JobBoardExtractor.isBoardPage(candidate.url, rawMarkdown);

          if (isListingBoard) {
            const boardUrlNormalized = normalizeUrl(candidate.url);

            if (!expandedBoardPages.has(boardUrlNormalized)) {
              expandedBoardPages.add(boardUrlNormalized);
              boardPagesCount++;

              const rawListings = JobBoardExtractor.extractListings(rawMarkdown, candidate.url);
              listingsHarvestedCount += rawListings.length;

              let uniqueAddedCount = 0;
              for (const listing of rawListings) {
                const cleanListingUrl = JobBoardExtractor.cleanUrl(listing.listingUrl);
                const normListingUrl = normalizeUrl(cleanListingUrl);

                if (processedUrls.has(normListingUrl)) {
                  listingsDeduplicatedCount++;
                  continue;
                }

                processedUrls.add(normListingUrl);

                // Enforce global discovered listings limit per run
                if (
                  listingsHarvestedCount - listingsDeduplicatedCount <=
                  MAX_TOTAL_DISCOVERED_LISTINGS_PER_RUN
                ) {
                  uniqueAddedCount++;
                  opportunityQueue.push({
                    url: cleanListingUrl,
                    source: listing.company || candidate.source,
                    domain: candidate.domain,
                    query: `discovered-listing:${candidate.url}`,
                    snippet: '',
                    score: candidate.score,
                    discoveredAt: new Date().toISOString(),
                  });
                }
              }

              console.log(
                `[Stage2] Detected Listing Board\nDomain: ${new URL(candidate.url).hostname}\nCards Found: ${rawListings.length}\nUnique URLs: ${uniqueAddedCount}\nQueued: ${uniqueAddedCount}\nSkipped Duplicates: ${rawListings.length - uniqueAddedCount}`,
              );
              console.log(
                `[Stage2] Expanded Board: ${new URL(candidate.url).hostname}\nGenerated ${uniqueAddedCount} crawl targets`,
              );
            }

            // Skip AI extraction for board listing pages themselves
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
                console.log(
                  `[Crawl Diagnostics] Page: ${candidate.url} | Type: ${route} | Candidates Extracted: ${extracted.length}`,
                );

                for (const job of extracted) {
                  const normJobUrl = normalizeUrl(job.url);
                  if (!processedUrls.has(normJobUrl)) {
                    processedUrls.add(normJobUrl);

                    if (budgetManager.canVisitCareerPage()) {
                      budgetManager.recordCareerPageVisit();
                      // Normal discovered links can go directly to opportunityQueue
                      opportunityQueue.push({
                        url: job.url,
                        source: job.source,
                        domain: candidate.domain,
                        query: `discovered:${candidate.url}`,
                        snippet: '',
                        score: candidate.score,
                        discoveredAt: new Date().toISOString(),
                      });
                    }
                  }
                }
              } else {
                console.log(
                  `[Crawl Diagnostics] Page: ${candidate.url} | Type: ${route} | Candidates Extracted: 0`,
                );
              }
            }
          }
        }

        return {
          url: candidate.url,
          title: candidate.source,
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

      // Await concurrently running requests for current batch before moving next
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
      boardPagesCount > 0 ? Math.round((listingsHarvestedCount / boardPagesCount) * 10) / 10 : 0;

    // Update global dashboard state metrics with Phase 2 yields
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
      },
    });

    return results;
  }
}
export default Stage2Crawling;
