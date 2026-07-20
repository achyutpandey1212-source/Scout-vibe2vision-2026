import { IPipelineStage } from './pipeline-stage.interface';
import { DiscoveryContext } from '../types/query.types';
import { crawlSchedulerService } from '../sources/crawl-scheduler.service';
import { TavilyClient } from '../search/tavily.client';
import { normalizeUrl } from '../search/search-orchestrator';
import { CrawlTarget, ISourceRegistryEntry } from '../sources/source-registry.types';
import { generateQueries } from '../query-engine/query-generator';

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
    const runCustomDomains = (context as any).runCustomDomains || [];
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
    } else if (runMode === 'custom' && runCustomDomains.length > 0) {
      const cleanDomains = runCustomDomains.map((d: string) => d.toLowerCase().trim());
      filterQuery.domain = { $in: cleanDomains };
    }

    const maxTargets = (_options as any)?.maxTargets || 50;
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

    if (targets.length === 0) {
      console.warn(`[Stage 1] No sources found matching filter criteria (Mode: ${runMode}).`);
      return [];
    }

    console.log(`[Stage 1] ${targets.length} sources resolved for crawl (Mode: ${runMode}).`);
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

    // 2. Per-source strategy resolution
    for (const target of targets) {
      const now = new Date().toISOString();

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
          // Generate persona-driven, ranked queries using the new query-engine
          const rankedQueries = await generateQueries(target.domain);
          const queries = rankedQueries.map((q) => q.query);
          console.log(
            `[Stage 1] [${target.organization}] Running ${queries.length} recruiter-quality query-engine searches...`,
          );

          for (const query of queries) {
            try {
              const response = await tavilyClient.search(query, 5);
              for (const result of response.results) {
                const normalized = normalizeUrl(result.url);
                if (processedUrls.has(normalized)) continue;
                processedUrls.add(normalized);

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
            } catch (err: any) {
              console.error(`[Stage 1] Tavily search failed for "${query}": ${err.message}`);
            }
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
