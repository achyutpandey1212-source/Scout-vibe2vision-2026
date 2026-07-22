import { IPipelineStage } from './pipeline-stage.interface';
import { DiscoveryContext } from '../types/query.types';
import { crawlSchedulerService } from '../sources/crawl-scheduler.service';
import { TavilyClient } from '../search/tavily.client';
import { normalizeUrl } from '../search/search-orchestrator';
import { CrawlTarget, ISourceRegistryEntry } from '../sources/source-registry.types';
import { generateQueries } from '../query-engine/query-generator';
import { DashboardStateInstance } from '../utils/dashboard-state';
import { JobBoardExtractor } from '../query-engine/job-board-extractor';
import { parseDiscoveryInput } from '../utils/input-parser';

export interface CandidateURL {
  url: string;
  source: string;
  domain?: string;
  query: string;
  snippet: string;
  score: number;
  discoveredAt: string;
}

export class Stage1Discovery implements IPipelineStage<DiscoveryContext, CandidateURL[]> {
  /**
   * Executes Stage 1: Registry-Driven Opportunity Discovery
   */
  async execute(
    context: DiscoveryContext,
    _options?: { skipSearch?: boolean },
  ): Promise<CandidateURL[]> {
    console.log('[Stage 1] Initializing registry-driven opportunity discovery...');

    const runMode = (context as any).runMode || 'due';
    const runCategory = (context as any).runCategory;
    const runCustomDomains: string[] = parseDiscoveryInput((context as any).runCustomDomains);
    let targets: CrawlTarget[] = [];

    const { sourceRegistryService } = await import('../sources/source-registry.service');

    const filterQuery: Record<string, any> = {};

    if (runMode === 'high-priority') {
      filterQuery.priority = { $in: ['critical', 'high'] };
    } else if (runMode === 'category' && runCategory) {
      if (runCategory === 'STARTUP_INTERNSHIPS') {
        filterQuery.$or = [
          { category: 'STARTUP_INTERNSHIPS' },
          {
            category: 'INTERNSHIPS',
            ecosystemType: { $in: ['STARTUP', 'INCUBATOR'] },
          },
        ];
      } else {
        filterQuery.category = runCategory;
      }
    } else if (runMode === 'active') {
      filterQuery.bypassDueCheck = true;
    } else if (runMode === 'custom' && runCustomDomains.length > 0) {
      const cleanDomains = runCustomDomains.map((d: string) => d.toLowerCase().trim());
      filterQuery.domain = { $in: cleanDomains };
    }

    const maxTargets = (_options as any)?.maxTargets || 50;

    if (runMode === 'custom' && runCustomDomains.length > 0) {
      targets = runCustomDomains.map((d: string) => {
        const trimmed = d.trim();
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
      const sources = await sourceRegistryService.getDueSourcesWithCursor(maxTargets, filterQuery);
      targets = sources.map((s: any) => ({
        domain: s.domain,
        organization: s.organization,
        homepage: s.homepage,
        strategy: s.strategy,
        defaultTags: s.defaultTags,
        trustScore: s.trustScore,
        priority: s.priority,
        nextCrawlAt: s.nextCrawlAt,
      }));
    }

    if (targets.length === 0) {
      console.warn(`[Stage 1] No sources found matching filter criteria (Mode: ${runMode}).`);
      return [];
    }

    console.log(
      `[Stage 1] Completed. Sources scheduled: ${targets.length}. Candidate URLs generated: ${targets.length}.`,
    );
    return this.resolveCandidatesForTargets(targets, context);
  }

  /**
   * Resolves candidate URLs specifically for a provided batch of ISourceRegistryEntry targets.
   */
  async executeForSources(
    sources: ISourceRegistryEntry[],
    context: DiscoveryContext,
  ): Promise<CandidateURL[]> {
    const targets: CrawlTarget[] = sources.map((s: any) => ({
      domain: s.domain,
      organization: s.organization,
      homepage: s.homepage,
      strategy: s.strategy,
      defaultTags: s.defaultTags,
      trustScore: s.trustScore,
      priority: s.priority,
      nextCrawlAt: s.nextCrawlAt,
    }));

    return this.resolveCandidatesForTargets(targets, context);
  }

  /**
   * Helper to resolve candidate URLs for a set of CrawlTargets.
   */
  private async resolveCandidatesForTargets(
    targets: CrawlTarget[],
    context: DiscoveryContext,
  ): Promise<CandidateURL[]> {
    const allCandidates: CandidateURL[] = [];
    const tavilyClient = new TavilyClient();
    const processedUrls = new Set<string>();

    const isCustomMode = (context as any).runMode === 'custom';

    // 2. Per-source strategy resolution
    for (const target of targets) {
      const now = new Date().toISOString();

      if (isCustomMode) {
        const fullUrl = target.homepage;
        const normalized = normalizeUrl(fullUrl);
        if (!processedUrls.has(normalized)) {
          processedUrls.add(normalized);
          allCandidates.push({
            url: fullUrl,
            source: target.organization,
            domain: target.domain,
            query: `custom:${target.domain}`,
            snippet: '',
            score: target.trustScore / 10,
            discoveredAt: now,
          });
        }
        continue;
      }

      switch (target.strategy) {
        case 'direct': {
          // Add homepage and deep career paths as candidate targets
          const base = target.homepage.replace(/\/$/, '');
          const paths = [
            '',
            '/careers',
            '/jobs',
            '/careers/openings',
            '/work-with-us',
            '/join-us',
            '/careers/internships',
          ];

          for (const p of paths) {
            const fullUrl = `${base}${p}`;
            const normalized = normalizeUrl(fullUrl);
            if (!processedUrls.has(normalized)) {
              processedUrls.add(normalized);
              allCandidates.push({
                url: fullUrl,
                source: target.organization,
                domain: target.domain,
                query: `direct:${target.domain}${p}`,
                snippet: '',
                score: target.trustScore / 10,
                discoveredAt: now,
              });
            }
          }
          break;
        }

        case 'search': {
          const { OpportunityQueryPlanner } =
            await import('../query-engine/opportunity-query-planner');
          const { redis: redisConf } = await import('../../config/redis');
          const redisClient = redisConf.getClient();

          const { queries, tier } = await OpportunityQueryPlanner.plan(target.domain, target);
          console.log(
            `[Stage 1] [${target.organization}] Running ${queries.length} recruiter-quality query-engine searches (Tier: ${tier})...`,
          );

          let goodJobUrlsCount = 0;
          const TARGET_GOOD_URLS = 15;

          // Track skipped queries for dashboard metrics
          let queriesSkipped = 0;

          for (const q of queries) {
            // Early stopping condition
            if (goodJobUrlsCount >= TARGET_GOOD_URLS) {
              console.log(
                `[Stage 1] [${target.organization}] Early stopping triggered: Found ${goodJobUrlsCount} good job URLs.`,
              );
              queriesSkipped += queries.length - queries.indexOf(q);
              break;
            }

            const query = q.query;
            const cacheKey = `tavily:search:${Buffer.from(query).toString('base64')}`;
            let resultsList: any[] = [];

            // A. Check Redis Cache for queries run within the last 24 hours
            try {
              const cached = await redisClient.get(cacheKey);
              if (cached) {
                resultsList = JSON.parse(cached);
              }
            } catch (err: any) {
              console.warn(`[Stage 1] Redis search cache read failed: ${err.message}`);
            }

            // B. Call Tavily if not cached
            if (resultsList.length === 0) {
              try {
                const response = await tavilyClient.search(query, 5);
                resultsList = response.results || [];
                if (resultsList.length > 0) {
                  await redisClient.setex(cacheKey, 86400, JSON.stringify(resultsList)); // Cache for 1 day
                }
              } catch (err: any) {
                console.error(`[Stage 1] Tavily search failed for "${query}": ${err.message}`);
                continue;
              }
            } else {
              // Track saved queries
              DashboardStateInstance.updateState({
                ...({
                  searchBudgetSaved: (DashboardStateInstance.getState() as any).searchBudgetSaved
                    ? (DashboardStateInstance.getState() as any).searchBudgetSaved + 1
                    : 1,
                } as any),
              });
            }

            // C. Filter results by Hard URL pattern preference
            for (const result of resultsList) {
              const url = result.url.toLowerCase();

              // Penalize and skip low-value subpaths
              const hasPenalizedPattern =
                url.includes('/blog/') ||
                url.includes('/blogs/') ||
                url.includes('/news/') ||
                url.includes('/press/') ||
                url.includes('/about/') ||
                url.includes('/privacy/') ||
                url.includes('/events/') ||
                url.includes('/docs/') ||
                url.includes('/documentation/');

              if (hasPenalizedPattern) continue;

              const normalized = normalizeUrl(result.url);
              if (processedUrls.has(normalized)) continue;
              processedUrls.add(normalized);

              // Detect if it is an ATS or career path
              const isATS =
                url.includes('greenhouse.io') ||
                url.includes('lever.co') ||
                url.includes('ashbyhq.com') ||
                url.includes('workable.com');

              const isDirectJob =
                url.includes('/jobs/') ||
                url.includes('/careers/') ||
                url.includes('/intern/') ||
                url.includes('/internship/');

              if (isATS || isDirectJob) {
                goodJobUrlsCount++;
              }

              // Update dashboard stats
              DashboardStateInstance.updateState({
                ...({
                  atsUrlsFound: (DashboardStateInstance.getState() as any).atsUrlsFound
                    ? (DashboardStateInstance.getState() as any).atsUrlsFound + (isATS ? 1 : 0)
                    : isATS
                      ? 1
                      : 0,
                  directUrlsFound: (DashboardStateInstance.getState() as any).directUrlsFound
                    ? (DashboardStateInstance.getState() as any).directUrlsFound +
                      (isDirectJob ? 1 : 0)
                    : isDirectJob
                      ? 1
                      : 0,
                } as any),
              });

              allCandidates.push({
                url: result.url,
                source: target.organization,
                domain: target.domain,
                query,
                snippet: result.content || '',
                score: target.trustScore / 10,
                discoveredAt: now,
              });
            }
          }

          if (queriesSkipped > 0) {
            DashboardStateInstance.updateState({
              ...({
                queriesSkipped: (DashboardStateInstance.getState() as any).queriesSkipped
                  ? (DashboardStateInstance.getState() as any).queriesSkipped + queriesSkipped
                  : queriesSkipped,
              } as any),
            });
          }
          break;
        }

        case 'sitemap': {
          // Use the sitemap URL as a candidate — Stage 2/Firecrawl handles parsing
          const sitemapUrl = `${target.homepage.replace(/\/$/, '')}/sitemap.xml`;
          const normalized = normalizeUrl(sitemapUrl);
          if (!processedUrls.has(normalized)) {
            processedUrls.add(normalized);
            allCandidates.push({
              url: sitemapUrl,
              source: target.organization,
              domain: target.domain,
              query: `sitemap:${target.domain}`,
              snippet: '',
              score: target.trustScore / 10,
              discoveredAt: now,
            });
          }
          break;
        }

        case 'rss': {
          // Use the RSS feed URL as a candidate
          const feedUrl = `${target.homepage.replace(/\/$/, '')}/feed`;
          const normalized = normalizeUrl(feedUrl);
          if (!processedUrls.has(normalized)) {
            processedUrls.add(normalized);
            allCandidates.push({
              url: feedUrl,
              source: target.organization,
              domain: target.domain,
              query: `rss:${target.domain}`,
              snippet: '',
              score: target.trustScore / 10,
              discoveredAt: now,
            });
          }
          break;
        }
      }
    }

    console.log(
      `[Stage 1] Completed. Sources scheduled: ${targets.length}. ` +
        `Candidate URLs generated: ${allCandidates.length}.`,
    );

    return allCandidates;
  }
}
