import { sourceRegistryService } from './source-registry.service';
import { CrawlTarget } from './source-registry.types';

/**
 * CrawlSchedulerService
 *
 * Thin facade over SourceRegistryService.getDueSources().
 * Stage 1 calls this to get today's crawl targets without coupling to
 * the underlying MongoDB schema.
 */
class CrawlSchedulerService {
  /**
   * Returns the list of sources due for crawling today.
   * Ordered by: priority (critical → low) → trustScore DESC → nextCrawlAt ASC.
   *
   * @param limit Maximum number of sources to return (default: 50)
   */
  async getTargetsForToday(limit = 50): Promise<CrawlTarget[]> {
    const sources = await sourceRegistryService.getDueSources(limit);

    return sources.map((s) => ({
      domain: s.domain,
      organization: s.organization,
      homepage: s.homepage,
      strategy: s.strategy,
      defaultTags: s.defaultTags,
      trustScore: s.trustScore,
      priority: s.priority,
    }));
  }
}

export const crawlSchedulerService = new CrawlSchedulerService();
