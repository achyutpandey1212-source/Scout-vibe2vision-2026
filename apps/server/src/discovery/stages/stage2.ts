import { IPipelineStage } from './pipeline-stage.interface';
import { CandidateURL } from './stage1';
import { CrawlPlanner } from '../utils/crawl-planner';
import { FirecrawlClient } from '../firecrawl/firecrawl.client';
import { redis } from '../../config/redis';
import { normalizeUrl } from '../search/search-orchestrator';
import { DashboardStateInstance } from '../utils/dashboard-state';
import { AffiliateExtractor } from '../sources/affiliate-extractor';
import { OpportunityDiscoveryRouter } from '../query-engine/opportunity-discovery-router';
import { ATSDetector } from '../query-engine/ats-detector';
import { ATSParser } from '../query-engine/ats-parser/ats-parser';
import { MultiOpportunityExtractor } from '../query-engine/multi-opportunity-extractor';
import { CrawlBudgetManager } from '../query-engine/crawl-budget-manager';

export interface CrawledPage {
  url: string;
  title: string;
  markdown: string;
  metadata: any;
  fetchMethod: 'firecrawl' | 'cache' | 'snippet' | 'skipped';
  crawlStatus: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'BLOCKED';
  crawlTime: number; // In milliseconds
  tokenEstimate: number;
  source: string;
  crawlReason: string;
  failureReason?: string;
  query?: string;
}

export interface CrawlAnalytics {
  candidatesReceived: number;
  firecrawlCalls: number;
  cacheHits: number;
  snippetFallback: number;
  skipped: number;
  failed: number;
  avgCrawlTime: number;
  tokensSaved: number;
  firecrawlCreditsSaved: number;
  failuresByType: Record<string, number>;
}

function getRoutePriority(url: string): number {
  const route = OpportunityDiscoveryRouter.route(url);
  switch (route) {
    case 'ATS_JOB':
      return 100;
    case 'CAREER_PAGE':
      return 80;
    case 'PORTFOLIO_PAGE':
      return 60;
    case 'HOMEPAGE':
      return 40;
    case 'UNKNOWN':
      return 20;
    case 'BLOG':
    case 'DOCUMENTATION':
    default:
      return -10;
  }
}

export class Stage2Crawling implements IPipelineStage<CandidateURL[], CrawledPage[]> {
  private readonly firecrawlClient: FirecrawlClient;

  constructor() {
    this.firecrawlClient = new FirecrawlClient();
  }

  /**
   * Executes Stage 2: Intelligent Crawling & Content Acquisition
   * Implements candidate routing, ATS/Multi-Opportunity parsing, prioritization, and safety budgeting.
   */
  async execute(
    candidates: CandidateURL[],
    options?: { maxExtractions?: number },
  ): Promise<CrawledPage[]> {
    console.log(
      `[Stage 2] Initializing classification and prioritized crawling for ${candidates.length} candidates...`,
    );
    const redisClient = redis.getClient();
    const results: CrawledPage[] = [];

    // Filter out low-value pages (blogs/docs) and prioritize candidates
    const queue = candidates
      .filter((c) => {
        const route = OpportunityDiscoveryRouter.route(c.url);
        return route !== 'BLOG' && route !== 'DOCUMENTATION';
      })
      .sort((a, b) => getRoutePriority(b.url) - getRoutePriority(a.url));

    const totalCount = queue.length;
    const processedUrls = new Set<string>(queue.map((c) => normalizeUrl(c.url)));
    const budgetManager = new CrawlBudgetManager();

    // Telemetry and Metrics
    let totalCrawlTime = 0;
    let firecrawlCalls = 0;
    let cacheHits = 0;
    let snippetFallbacks = 0;
    let skippedCount = 0;
    let failedCount = 0;
    let tokensSaved = 0;
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

    // Outer Loop: Batch processing until queue is empty
    while (queue.length > 0) {
      batchNumber++;
      const currentBatch = queue.splice(0, concurrency);

      // Update telemetry state
      DashboardStateInstance.updateState({
        currentStage: 'STAGE_2_CRAWLING',
        crawlQueueRemaining: queue.length,
        crawlBatchNumber: batchNumber,
        crawlCurrentlyCrawling: currentBatch.map((c) => c.url),
        crawlCompleted: completedCount,
        crawlFailed: failedCount,
      });

      console.log(
        `\n[Stage 2] [Queue Processing] Starting Batch #${batchNumber} (Processing ${currentBatch.length} URLs, Remaining in Queue: ${queue.length})`,
      );

      const batchPromises = currentBatch.map(async (candidate) => {
        const startTime = Date.now();
        const plan = CrawlPlanner.evaluate(candidate);
        const normalized = normalizeUrl(candidate.url);
        const cacheKey = `firecrawl:${normalized}`;

        const route = OpportunityDiscoveryRouter.route(candidate.url);
        if (route === 'ATS_JOB') atsPagesCount++;
        else if (route === 'CAREER_PAGE') careerPagesCount++;

        // A. Strategy: SKIP
        if (plan.decision === 'SKIP') {
          skippedCount++;
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
        } catch (cacheErr: any) {
          console.error(
            `[Stage 2] [Cache Error] Failed reading Redis for ${candidate.url}:`,
            cacheErr.message,
          );
        }

        let rawMarkdown = '';
        let cleanMetadata: Record<string, any> = {};
        let fetchMethod: 'firecrawl' | 'cache' | 'snippet' = 'cache';
        const crawlStatus: 'SUCCESS' | 'FAILED' | 'BLOCKED' = 'SUCCESS';
        let duration = 0;

        if (cachedContent) {
          try {
            const parsed = JSON.parse(cachedContent);
            duration = Date.now() - startTime;
            cacheHits++;
            tokensSaved += Math.round(parsed.markdown.length / 4);
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
            firecrawlCalls++;
            const scrapeResponse = await this.firecrawlClient.scrape(candidate.url);
            duration = Date.now() - startTime;
            totalCrawlTime += duration;

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

            const cleanValue = (val: any): any => {
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
            } catch (cacheSetErr: any) {
              console.error(
                `[Stage 2] [Cache Error] Failed writing cache for ${candidate.url}:`,
                cacheSetErr.message,
              );
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
          } catch (crawlErr: any) {
            duration = Date.now() - startTime;
            totalCrawlTime += duration;
            failedCount++;

            let type = 'NETWORK';
            const isBlocked = crawlErr.message && crawlErr.message.includes('BLOCKED');
            if (isBlocked) type = 'BLOCKED';
            else if (crawlErr.message.includes('401')) type = 'INVALID_API_KEY';
            else if (crawlErr.message.includes('429')) type = 'RATE_LIMIT';
            else if (crawlErr.message.includes('timeout') || crawlErr.message.includes('timed out'))
              type = 'TIMEOUT';

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
          snippetFallbacks++;
          duration = Date.now() - startTime;
          rawMarkdown = candidate.snippet || '';
          cleanMetadata = { domain: new URL(candidate.url).hostname };
          fetchMethod = 'snippet';
        }

        // E. Dynamic ATS & Multi-Opportunity Link Extraction Hook
        if (crawlStatus === 'SUCCESS' && rawMarkdown.length > 10) {
          const isAtsPage = route === 'ATS_JOB';
          const isCareerPage = route === 'CAREER_PAGE';

          if (isAtsPage || isCareerPage) {
            const extracted = ATSParser.parse(rawMarkdown, candidate.url, candidate.source).concat(
              MultiOpportunityExtractor.extract(rawMarkdown, candidate.url, candidate.source),
            );

            if (extracted.length > 0) {
              multiJobPagesCount++;
              jobsExtractedCount += extracted.length;
              console.log(
                `[Stage 2] [Opportunity Discovery] Discovered ${extracted.length} child jobs on ${candidate.url}`,
              );

              for (const job of extracted) {
                const normJobUrl = normalizeUrl(job.url);
                if (!processedUrls.has(normJobUrl)) {
                  processedUrls.add(normJobUrl);

                  if (budgetManager.canVisitCareerPage()) {
                    budgetManager.recordCareerPageVisit();
                    queue.push({
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

              // Resort queue to bubble up the new direct job URLs immediately
              queue.sort((a, b) => getRoutePriority(b.url) - getRoutePriority(a.url));
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
      console.log(
        `[Stage 2] [Batch Complete] Processed ${completedCount}/${totalCount} total candidates.`,
      );
    }

    // Update global dashboard state metrics with Phase 2 yields
    DashboardStateInstance.updateState({
      crawlCompleted: completedCount,
      pagesCrawled: DashboardStateInstance.getState().pagesCrawled + results.length,
      // Custom extra props for Phase 2 can be passed to extend state
      ...({
        atsPagesDetected: atsPagesCount,
        careerPages: careerPagesCount,
        multiJobPages: multiJobPagesCount,
        jobsExtractedWithoutAI: jobsExtractedCount,
      } as any),
    });

    return results;
  }
}
