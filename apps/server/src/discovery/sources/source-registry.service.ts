import { SourceRegistryModel } from './source-registry.model';
import { TRUSTED_SOURCES } from './registry';
import {
  ISourceRegistryEntry,
  CrawlTarget,
  RegistryStats,
  SourceCategory,
  SourcePriority,
  SourceType,
  CrawlFrequency,
} from './source-registry.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calculates the next crawl timestamp based on frequency.
 */
function calculateNextCrawlAt(frequency: CrawlFrequency): Date {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Derives priority from trustScore for seed sources that have no AI evaluation.
 */
function derivePriorityFromTrustScore(trustScore: number): SourcePriority {
  if (trustScore >= 95) return 'critical';
  if (trustScore >= 85) return 'high';
  if (trustScore >= 70) return 'medium';
  return 'low';
}

/**
 * Extracts the domain from a URL string.
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    return hostname;
  } catch {
    return url
      .toLowerCase()
      .replace(/^https?:\/\/(www\.)?/, '')
      .split('/')[0];
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

class SourceRegistryService {
  /**
   * Returns all sources due for crawling today.
   * Ordered by: priority (critical → low), then trustScore DESC, then nextCrawlAt ASC.
   */
  async getDueSources(limit = 50): Promise<ISourceRegistryEntry[]> {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    const sources = await SourceRegistryModel.find({
      isActive: true,
      nextCrawlAt: { $lte: new Date() },
    })
      .sort({ trustScore: -1, nextCrawlAt: 1 })
      .limit(limit)
      .lean();

    // Sort by priority in memory (MongoDB doesn't natively sort by custom enum order)
    return sources.sort(
      (a, b) =>
        (priorityOrder[a.priority as SourcePriority] ?? 3) -
          (priorityOrder[b.priority as SourcePriority] ?? 3) || b.trustScore - a.trustScore,
    ) as unknown as ISourceRegistryEntry[];
  }

  /**
   * Records a successful crawl: updates timestamps and accumulates analytics.
   */
  async markCrawled(
    domain: string,
    stats: { pagesCrawled: number; opportunitiesFound: number },
  ): Promise<void> {
    const now = new Date();

    const source = await SourceRegistryModel.findOne({ domain });
    if (!source) {
      console.warn(`[SourceRegistry] markCrawled: domain not found — ${domain}`);
      return;
    }

    const newPagesCrawled = source.totalPagesCrawled + stats.pagesCrawled;
    const newOppsFound = source.totalOpportunitiesFound + stats.opportunitiesFound;
    const newDensity = newPagesCrawled > 0 ? newOppsFound / newPagesCrawled : 0;

    await SourceRegistryModel.updateOne(
      { domain },
      {
        $set: {
          lastCrawledAt: now,
          nextCrawlAt: calculateNextCrawlAt(source.crawlFrequency),
          consecutiveFailures: 0,
          totalPagesCrawled: newPagesCrawled,
          totalOpportunitiesFound: newOppsFound,
          opportunityDensity: Math.round(newDensity * 1000) / 1000, // 3 decimal places
        },
        $inc: { totalRuns: 1 },
      },
    );
  }

  /**
   * Records a failed crawl. Deactivates the source after 5 consecutive failures.
   */
  async markFailed(domain: string): Promise<void> {
    const source = await SourceRegistryModel.findOne({ domain });
    if (!source) return;

    const newFailureCount = source.consecutiveFailures + 1;
    const shouldDeactivate = newFailureCount >= 5;

    await SourceRegistryModel.updateOne(
      { domain },
      {
        $set: {
          consecutiveFailures: newFailureCount,
          isActive: shouldDeactivate ? false : source.isActive,
        },
      },
    );

    if (shouldDeactivate) {
      console.warn(`[SourceRegistry] Source deactivated after 5 consecutive failures: ${domain}`);
    }
  }

  /**
   * Upserts a source entry. Used by both the weekly engine and affiliate extractor.
   * Returns { isNew: true } if a new source was inserted.
   */
  async upsertSource(entry: Partial<ISourceRegistryEntry>): Promise<{ isNew: boolean }> {
    if (!entry.domain) {
      throw new Error('[SourceRegistry] upsertSource requires a domain');
    }

    const existing = await SourceRegistryModel.findOne({ domain: entry.domain });

    if (existing) {
      // Update verification fields and metadata but preserve analytics
      await SourceRegistryModel.updateOne(
        { domain: entry.domain },
        {
          $set: {
            ...entry,
            // Preserve cumulative analytics — never overwrite with partial data
            totalRuns: existing.totalRuns,
            totalPagesCrawled: existing.totalPagesCrawled,
            totalOpportunitiesFound: existing.totalOpportunitiesFound,
            opportunityDensity: existing.opportunityDensity,
            lastVerifiedAt: new Date(),
          },
        },
      );
      return { isNew: false };
    }

    await SourceRegistryModel.create({
      ...entry,
      discoveredAt: new Date(),
      nextCrawlAt: new Date(), // due immediately on first insert
      consecutiveFailures: 0,
      totalRuns: 0,
      totalPagesCrawled: 0,
      totalOpportunitiesFound: 0,
      opportunityDensity: 0,
    });
    return { isNew: true };
  }

  /**
   * Returns true if a domain is already registered.
   */
  async domainExists(domain: string): Promise<boolean> {
    const count = await SourceRegistryModel.countDocuments({ domain: domain.toLowerCase() });
    return count > 0;
  }

  /**
   * Seeds the registry from TRUSTED_SOURCES if the collection is empty.
   * Returns the number of sources seeded.
   */
  async seedIfEmpty(): Promise<number> {
    const existingCount = await SourceRegistryModel.countDocuments();
    if (existingCount > 0) {
      console.log(
        `[SourceRegistry] Registry already contains ${existingCount} sources. Skipping seed.`,
      );
      return 0;
    }

    console.log(
      `[SourceRegistry] Registry is empty. Seeding ${TRUSTED_SOURCES.length} pre-vetted sources...`,
    );

    let seeded = 0;
    for (const source of TRUSTED_SOURCES) {
      try {
        const domain = extractDomain(source.homepage);
        const priority = derivePriorityFromTrustScore(source.trustScore);

        await SourceRegistryModel.create({
          domain,
          organization: source.organization,
          homepage: source.homepage,
          sourceType: 'Organization' as SourceType,
          // Map refreshFrequency → crawlFrequency
          crawlFrequency:
            source.refreshFrequency === 'low'
              ? 'monthly'
              : source.refreshFrequency === 'medium'
                ? 'weekly'
                : 'daily',
          strategy: source.strategy,
          trustScore: source.trustScore,
          priority,
          confidence: 85, // pre-vetted seeds are high-confidence
          reason: 'Pre-vetted seed source from static TRUSTED_SOURCES registry',
          discoveredBy: 'seed',
          discoveredAt: new Date(),
          nextCrawlAt: new Date(), // due immediately
          defaultTags: source.defaultTags,
          isActive: true,
          consecutiveFailures: 0,
          totalRuns: 0,
          totalPagesCrawled: 0,
          totalOpportunitiesFound: 0,
          opportunityDensity: 0,
          verifiedByAIAt: null,
          lastVerifiedAt: null,
          lastCrawledAt: null,
          // Category inference from tags
          category: inferCategoryFromTags(source.defaultTags),
        });
        seeded++;
      } catch (err: any) {
        console.error(
          `[SourceRegistry] Failed to seed source ${source.organization}: ${err.message}`,
        );
      }
    }

    console.log(`[SourceRegistry] Successfully seeded ${seeded} sources.`);
    return seeded;
  }

  /**
   * Paginated list with optional filters.
   */
  async listSources(filters: {
    category?: SourceCategory;
    priority?: SourcePriority;
    sourceType?: SourceType;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ sources: ISourceRegistryEntry[]; total: number }> {
    const query: Record<string, any> = {};
    if (filters.category) query.category = filters.category;
    if (filters.priority) query.priority = filters.priority;
    if (filters.sourceType) query.sourceType = filters.sourceType;
    if (typeof filters.isActive === 'boolean') query.isActive = filters.isActive;

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const [sources, total] = await Promise.all([
      SourceRegistryModel.find(query).sort({ trustScore: -1 }).skip(skip).limit(limit).lean(),
      SourceRegistryModel.countDocuments(query),
    ]);

    return { sources: sources as unknown as ISourceRegistryEntry[], total };
  }

  /**
   * Aggregated stats for the admin dashboard.
   */
  async getRegistryStats(): Promise<RegistryStats> {
    const [
      total,
      active,
      byCategoryRaw,
      byPriorityRaw,
      bySourceTypeRaw,
      topSources,
      densityResult,
    ] = await Promise.all([
      SourceRegistryModel.countDocuments(),
      SourceRegistryModel.countDocuments({ isActive: true }),
      SourceRegistryModel.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      SourceRegistryModel.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      SourceRegistryModel.aggregate([{ $group: { _id: '$sourceType', count: { $sum: 1 } } }]),
      SourceRegistryModel.find({ isActive: true })
        .sort({ opportunityDensity: -1 })
        .limit(5)
        .select('domain organization trustScore opportunityDensity totalOpportunitiesFound')
        .lean(),
      SourceRegistryModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, avg: { $avg: '$opportunityDensity' } } },
      ]),
    ]);

    const toRecord = (arr: { _id: string; count: number }[]) =>
      Object.fromEntries(arr.map((e) => [e._id, e.count]));

    return {
      total,
      active,
      byCategory: toRecord(byCategoryRaw),
      byPriority: toRecord(byPriorityRaw),
      bySourceType: toRecord(bySourceTypeRaw),
      avgOpportunityDensity:
        densityResult.length > 0 ? Math.round((densityResult[0].avg ?? 0) * 1000) / 1000 : 0,
      topSources: topSources as any,
    };
  }

  /**
   * Returns the count of currently active sources.
   */
  async getActiveCount(): Promise<number> {
    return SourceRegistryModel.countDocuments({ isActive: true });
  }
}

// ─── Category inference from tags (for seed sources) ─────────────────────────

function inferCategoryFromTags(tags: string[]): SourceCategory {
  const tagStr = tags.join(' ').toLowerCase();
  if (tagStr.includes('women-in-tech') || tagStr.includes('women-focused')) return 'WOMEN_IN_TECH';
  if (tagStr.includes('hackathon') || tagStr.includes('competition')) return 'HACKATHONS';
  if (tagStr.includes('scholarship')) return 'SCHOLARSHIPS';
  if (tagStr.includes('fellowship')) return 'FELLOWSHIPS';
  if (tagStr.includes('government') || tagStr.includes('gov')) return 'GOVERNMENT';
  if (tagStr.includes('research') || tagStr.includes('scientific')) return 'RESEARCH';
  if (tagStr.includes('entrepreneurship') || tagStr.includes('startup')) return 'ENTREPRENEURSHIP';
  if (tagStr.includes('skill') || tagStr.includes('training')) return 'SKILL_DEVELOPMENT';
  if (tagStr.includes('technology') || tagStr.includes('tech')) return 'TECH_CAREERS';
  return 'GENERAL';
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const sourceRegistryService = new SourceRegistryService();
