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
  crawlStatus: 'SUCCESS' | 'FAILED' | 'SKIPPED';
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
   */
  async execute(
    candidates: CandidateURL[],
    options?: { maxExtractions?: number },
  ): Promise<CrawledPage[]> {
    console.log(`[Stage 2] Starting content acquisition for ${candidates.length} candidates...`);
    const redisClient = redis.getClient();
    const results: CrawledPage[] = [];

    // Metrics tracking
    let totalCrawlTime = 0;
    let firecrawlCalls = 0;
    let cacheHits = 0;
    let snippetFallbacks = 0;
    let skipped = 0;
    let failed = 0;
    let tokensSaved = 0;
    const failuresByType: Record<string, number> = {};

    const trackFailure = (type: string) => {
      failuresByType[type] = (failuresByType[type] || 0) + 1;
    };

    // Limits
    const limit = options?.maxExtractions || 15;
    const targets = candidates.slice(0, limit);

    for (const candidate of targets) {
      const startTime = Date.now();
      const plan = CrawlPlanner.evaluate(candidate);
      const normalized = normalizeUrl(candidate.url);
      const cacheKey = `firecrawl:${normalized}`;

      // A. Decision: SKIP
      if (plan.decision === 'SKIP') {
        skipped++;
        results.push({
          url: candidate.url,
          title: candidate.source,
          markdown: '',
          metadata: {},
          fetchMethod: 'skipped',
          crawlStatus: 'SKIPPED',
          crawlTime: 0,
          tokenEstimate: 0,
          source: candidate.source,
          crawlReason: plan.reason,
        });
        console.log(`[Stage 2] [Skip] URL: ${candidate.url} (Reason: ${plan.reason})`);
        continue;
      }

      // B. Try Cache Strategy First (Unless skipSearch is active)
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

          results.push({
            url: candidate.url,
            title: candidate.source,
            markdown: parsed.markdown,
            metadata: parsed.metadata || {},
            fetchMethod: 'cache',
            crawlStatus: 'SUCCESS',
            crawlTime: duration,
            tokenEstimate: Math.round(parsed.markdown.length / 4),
            source: candidate.source,
            crawlReason: 'Fresh content exists in Redis cache.',
          });

          console.log(
            `[Stage 2] [Cache Hit] URL: ${candidate.url} (${parsed.markdown.length} bytes)`,
          );
          continue;
        } catch {
          // Fall through on JSON parse error
        }
      }

      // C. Strategy: USE_FIRECRAWL
      if (plan.decision === 'USE_FIRECRAWL') {
        try {
          firecrawlCalls++;
          const scrapeResponse = await this.firecrawlClient.scrape(candidate.url);
          const duration = Date.now() - startTime;
          totalCrawlTime += duration;

          const rawMarkdown = scrapeResponse.data?.markdown || '';

          // Content Validation check
          const validation = CrawlPlanner.validateContent(rawMarkdown);
          if (!validation.valid) {
            failed++;
            const type = validation.reason || 'CONTENT_TOO_SMALL';
            trackFailure(type);

            results.push({
              url: candidate.url,
              title: candidate.source,
              markdown: '',
              metadata: {},
              fetchMethod: 'firecrawl',
              crawlStatus: 'FAILED',
              crawlTime: duration,
              tokenEstimate: 0,
              source: candidate.source,
              crawlReason: plan.reason,
              failureReason: type,
            });

            console.log(`[Stage 2] [Failed Validation] URL: ${candidate.url} (Reason: ${type})`);
            continue;
          }

          // Cache parsed content
          const metadata = {
            description: scrapeResponse.data?.metadata?.description || '',
            domain: new URL(candidate.url).hostname,
          };
          try {
            await redisClient.setex(
              cacheKey,
              86400, // 24 hours TTL
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

          results.push({
            url: candidate.url,
            title: candidate.source,
            markdown: rawMarkdown,
            metadata,
            fetchMethod: 'firecrawl',
            crawlStatus: 'SUCCESS',
            crawlTime: duration,
            tokenEstimate: Math.round(rawMarkdown.length / 4),
            source: candidate.source,
            crawlReason: plan.reason,
          });

          console.log(
            `[Stage 2] [Crawl Success] URL: ${candidate.url} (Duration: ${(duration / 1000).toFixed(1)}s)`,
          );
          continue;
        } catch (crawlErr: any) {
          const duration = Date.now() - startTime;
          totalCrawlTime += duration;
          failed++;

          // Identify fail type
          let type = 'NETWORK';
          if (crawlErr.message.includes('401')) type = 'INVALID_API_KEY';
          else if (crawlErr.message.includes('429')) type = 'RATE_LIMIT';
          else if (crawlErr.message.includes('timeout') || crawlErr.message.includes('timed out'))
            type = 'TIMEOUT';

          if (firecrawlCalls === 1) {
            DashboardStateInstance.updateState({
              firecrawlError: `Firecrawl failed on first request: [${type}] ${crawlErr.message}`,
            });
          }

          trackFailure(type);

          results.push({
            url: candidate.url,
            title: candidate.source,
            markdown: '',
            metadata: {},
            fetchMethod: 'firecrawl',
            crawlStatus: 'FAILED',
            crawlTime: duration,
            tokenEstimate: 0,
            source: candidate.source,
            crawlReason: plan.reason,
            failureReason: type,
          });

          console.log(
            `[Stage 2] [Crawl Failed] URL: ${candidate.url} (Reason: ${crawlErr.message})`,
          );
          continue;
        }
      }

      // D. Strategy: USE_SNIPPET_FALLBACK
      snippetFallbacks++;
      const duration = Date.now() - startTime;
      results.push({
        url: candidate.url,
        title: candidate.source,
        markdown: candidate.snippet || '',
        metadata: { domain: new URL(candidate.url).hostname },
        fetchMethod: 'snippet',
        crawlStatus: 'SUCCESS',
        crawlTime: duration,
        tokenEstimate: Math.round((candidate.snippet || '').length / 4),
        source: candidate.source,
        crawlReason: plan.reason,
      });

      console.log(`[Stage 2] [Snippet Fallback] URL: ${candidate.url}`);
    }

    // Generate Analytics Report
    const avgCrawl = firecrawlCalls > 0 ? Math.round(totalCrawlTime / firecrawlCalls) : 0;
    const analytics: CrawlAnalytics = {
      candidatesReceived: candidates.length,
      firecrawlCalls,
      cacheHits,
      snippetFallback: snippetFallbacks,
      skipped,
      failed,
      avgCrawlTime: avgCrawl / 1000,
      tokensSaved,
      firecrawlCreditsSaved: cacheHits + snippetFallbacks,
      failuresByType,
    };

    DashboardStateInstance.updateState({
      pagesCrawled: results.filter((r) => r.crawlStatus === 'SUCCESS').length,
    });

    this.printReport(analytics);
    return results;
  }

  private printReport(stats: CrawlAnalytics): void {
    console.log(`
========== Stage 2 Crawl Analytics ==========
Candidates Processed:    ${stats.candidatesReceived}
Firecrawl API Calls:     ${stats.firecrawlCalls}
Cache Hits (Redis):      ${stats.cacheHits}
Snippet Fallbacks:       ${stats.snippetFallback}
Skipped Pages:           ${stats.skipped}
Failed Crawls:           ${stats.failed}
Avg Crawl Latency:       ${stats.avgCrawlTime.toFixed(2)}s
Estimated Tokens Saved:  ${stats.tokensSaved}
Firecrawl Credits Saved: ${stats.firecrawlCreditsSaved}
Failures Breakdown:      ${JSON.stringify(stats.failuresByType)}
=============================================`);
  }
}
