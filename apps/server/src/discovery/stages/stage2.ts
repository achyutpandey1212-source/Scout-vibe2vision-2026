import { IPipelineStage } from './pipeline-stage.interface';
import { CandidateURL } from './stage1';
import { CrawlPlanner } from '../utils/crawl-planner';
import { FirecrawlClient } from '../firecrawl/firecrawl.client';
import { redis } from '../../config/redis';
import { normalizeUrl } from '../search/search-orchestrator';
import { DashboardStateInstance } from '../utils/dashboard-state';

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

export class Stage2Crawling implements IPipelineStage<CandidateURL[], CrawledPage[]> {
  private readonly firecrawlClient: FirecrawlClient;

  constructor() {
    this.firecrawlClient = new FirecrawlClient();
  }

  /**
   * Executes Stage 2: Intelligent Crawling & Content Acquisition
   * Implements an adaptive concurrency queue to process all discovered candidate URLs.
   */
  async execute(
    candidates: CandidateURL[],
    options?: { maxExtractions?: number },
  ): Promise<CrawledPage[]> {
    console.log(
      `[Stage 2] Starting adaptive queue content acquisition for ${candidates.length} candidates...`,
    );
    const redisClient = redis.getClient();
    const results: CrawledPage[] = [];

    // Telemetry and Metrics
    let totalCrawlTime = 0;
    let firecrawlCalls = 0;
    let cacheHits = 0;
    let snippetFallbacks = 0;
    let skippedCount = 0;
    let failedCount = 0;
    let tokensSaved = 0;
    const failuresByType: Record<string, number> = {};

    const trackFailure = (type: string) => {
      failuresByType[type] = (failuresByType[type] || 0) + 1;
    };

    // Load configuration for adaptive concurrency
    const concurrencyRaw = process.env.DISCOVERY_FIRECRAWL_CONCURRENCY;
    const concurrency = concurrencyRaw ? parseInt(concurrencyRaw, 10) : 2;
    console.log(`[Stage 2] Running adaptive crawling with queue concurrency: ${concurrency}`);

    const queue = [...candidates];
    const totalCount = queue.length;
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

        // B. Strategy: Redis cache hit check
        let cachedContent: string | null = null;
        try {
          cachedContent = await redisClient.get(cacheKey);
        } catch (cacheErr: any) {
          console.error(
            `[Stage 2] [Cache Error] Failed reading Redis for ${candidate.url}:`,
            cacheErr.message,
          );
        }

        if (cachedContent) {
          try {
            const parsed = JSON.parse(cachedContent);
            const duration = Date.now() - startTime;
            cacheHits++;
            tokensSaved += Math.round(parsed.markdown.length / 4);

            return {
              url: candidate.url,
              title: candidate.source,
              markdown: parsed.markdown,
              metadata: parsed.metadata || {},
              fetchMethod: 'cache' as const,
              crawlStatus: 'SUCCESS' as const,
              crawlTime: duration,
              tokenEstimate: Math.round(parsed.markdown.length / 4),
              source: candidate.source,
              crawlReason: 'Fresh content exists in Redis cache.',
            };
          } catch {
            // Fall through to scraping on parse error
          }
        }

        // C. Strategy: Scrape with rate-limited Firecrawl
        if (plan.decision === 'USE_FIRECRAWL') {
          try {
            firecrawlCalls++;
            const scrapeResponse = await this.firecrawlClient.scrape(candidate.url);
            const duration = Date.now() - startTime;
            totalCrawlTime += duration;

            const rawMarkdown = scrapeResponse.data?.markdown || '';

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

            // Cache successfully scraped page
            const metadata = {
              description: scrapeResponse.data?.metadata?.description || '',
              domain: new URL(candidate.url).hostname,
            };
            try {
              await redisClient.setex(
                cacheKey,
                86400, // 24 Hours TTL
                JSON.stringify({
                  markdown: rawMarkdown,
                  metadata,
                  timestamp: new Date().toISOString(),
                }),
              );
            } catch (cacheSetErr: any) {
              console.error(
                `[Stage 2] [Cache Error] Failed writing cache for ${candidate.url}:`,
                cacheSetErr.message,
              );
            }

            return {
              url: candidate.url,
              title: candidate.source,
              markdown: rawMarkdown,
              metadata,
              fetchMethod: 'firecrawl' as const,
              crawlStatus: 'SUCCESS' as const,
              crawlTime: duration,
              tokenEstimate: Math.round(rawMarkdown.length / 4),
              source: candidate.source,
              crawlReason: plan.reason,
            };
          } catch (crawlErr: any) {
            const duration = Date.now() - startTime;
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
        snippetFallbacks++;
        const duration = Date.now() - startTime;
        return {
          url: candidate.url,
          title: candidate.source,
          markdown: candidate.snippet || '',
          metadata: { domain: new URL(candidate.url).hostname },
          fetchMethod: 'snippet' as const,
          crawlStatus: 'SUCCESS' as const,
          crawlTime: duration,
          tokenEstimate: Math.round((candidate.snippet || '').length / 4),
          source: candidate.source,
          crawlReason: plan.reason,
        };
      });

      // Await concurrently running requests for current batch before moving next
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      completedCount += batchResults.length;
      console.log(
        `[Stage 2] [Batch Complete] Processed ${completedCount}/${totalCount} total candidates.`,
      );
    }

    // Generate Final Analytics
    const avgCrawl = firecrawlCalls > 0 ? Math.round(totalCrawlTime / firecrawlCalls) : 0;
    const analytics: CrawlAnalytics = {
      candidatesReceived: candidates.length,
      firecrawlCalls,
      cacheHits,
      snippetFallback: snippetFallbacks,
      skipped: skippedCount,
      failed: failedCount,
      avgCrawlTime: avgCrawl / 1000,
      tokensSaved,
      firecrawlCreditsSaved: cacheHits + snippetFallbacks,
      failuresByType,
    };

    DashboardStateInstance.updateState({
      pagesCrawled: results.filter((r) => r.crawlStatus === 'SUCCESS').length,
      crawlQueueRemaining: 0,
      crawlCurrentlyCrawling: [],
    });

    this.printReport(analytics);
    return results;
  }

  private printReport(stats: CrawlAnalytics): void {
    console.log(`
========== Stage 2 Adaptive Crawl Report ==========
Total Candidates Received:   ${stats.candidatesReceived}
Firecrawl API Scrapings:     ${stats.firecrawlCalls}
Redis Cache Hits:            ${stats.cacheHits}
Snippet Fallback Events:     ${stats.snippetFallback}
Skipped URLs:                ${stats.skipped}
Failed URLs:                 ${stats.failed}
Avg Crawl Latency:           ${stats.avgCrawlTime.toFixed(2)}s
Estimated Tokens Saved:      ${stats.tokensSaved}
Firecrawl Credits Saved:     ${stats.firecrawlCreditsSaved}
Failures Breakdown:          ${JSON.stringify(stats.failuresByType)}
===================================================`);
  }
}
