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
   * Returns sources due for crawling using a persistent round-robin cursor + nextCrawlAt filter.
   * Guarantees fair progression across the registry without starving lower-ranked sources.
   */
  async getDueSourcesWithCursor(
    limit = 50,
    customQuery: Record<string, any> = {},
  ): Promise<ISourceRegistryEntry[]> {
    const { SchedulerCursorModel } = await import('./scheduler-cursor.model');

    // 1. Fetch persistent cursor document
    let cursorDoc = await SchedulerCursorModel.findOne({ key: 'discovery_crawl_cursor' });
    if (!cursorDoc) {
      cursorDoc = await SchedulerCursorModel.create({
        key: 'discovery_crawl_cursor',
        cursorIndex: 0,
      });
    }

    // 2. Fetch all active sources matching custom filter criteria sorted deterministically
    const mongoQuery = { ...customQuery };
    const bypassDue = mongoQuery.bypassDueCheck;
    delete mongoQuery.bypassDueCheck;

    const baseQuery = { isActive: true, ...mongoQuery };
    const allActiveSources = await SourceRegistryModel.find(baseQuery).sort({ domain: 1 }).lean();

    if (allActiveSources.length === 0) {
      return [];
    }

    const total = allActiveSources.length;
    let startIdx = (cursorDoc.cursorIndex || 0) % total;
    if (startIdx < 0) startIdx = 0;

    const selected: ISourceRegistryEntry[] = [];
    const now = new Date();
    let scanned = 0;
    let currentIdx = startIdx;
    let lastEvaluatedSourceId = cursorDoc.lastProcessedSourceId;

    // 3. Scan round-robin starting at startIdx
    while (scanned < total && selected.length < limit) {
      const source = allActiveSources[currentIdx];

      // Check nextCrawlAt <= now
      const isDue = !source.nextCrawlAt || new Date(source.nextCrawlAt) <= now;
      if (isDue || bypassDue) {
        selected.push(source as unknown as ISourceRegistryEntry);
      }

      lastEvaluatedSourceId = source._id;
      scanned++;
      currentIdx = (currentIdx + 1) % total;
    }

    // 4. Update and persist cursor index immediately
    const nextCursorIndex = currentIdx;
    await SchedulerCursorModel.updateOne(
      { key: 'discovery_crawl_cursor' },
      {
        $set: {
          cursorIndex: nextCursorIndex,
          lastProcessedSourceId: lastEvaluatedSourceId,
          updatedAt: now,
        },
      },
    );

    console.log(
      `[Scheduler Cursor] Scanned ${scanned}/${total} active sources starting at index ${startIdx}. ` +
        `Selected ${selected.length}/${limit} due sources. Next cursor index: ${nextCursorIndex}.`,
    );

    return selected;
  }

  /**
   * Legacy wrapper delegating to getDueSourcesWithCursor for daily crawl targets.
   */
  async getDueSources(limit = 50): Promise<ISourceRegistryEntry[]> {
    return this.getDueSourcesWithCursor(limit);
  }

  /**
   * Records a successful crawl immediately: updates timestamps and accumulates analytics.
   */
  async markCrawled(
    domain: string,
    stats: { pagesCrawled: number; opportunitiesFound: number },
  ): Promise<void> {
    const now = new Date();
    const cleanDomain = domain.toLowerCase().trim();

    const source = await SourceRegistryModel.findOne({ domain: cleanDomain });
    if (!source) {
      console.warn(`[SourceRegistry] markCrawled: domain not found — ${cleanDomain}`);
      return;
    }

    const newPagesCrawled = (source.totalPagesCrawled || 0) + stats.pagesCrawled;
    const newOppsFound = (source.totalOpportunitiesFound || 0) + stats.opportunitiesFound;
    const newDensity = newPagesCrawled > 0 ? newOppsFound / newPagesCrawled : 0;
    const nextCrawl = calculateNextCrawlAt(source.crawlFrequency);

    await SourceRegistryModel.updateOne(
      { domain: cleanDomain },
      {
        $set: {
          lastCrawledAt: now,
          nextCrawlAt: nextCrawl,
          consecutiveFailures: 0,
          totalPagesCrawled: newPagesCrawled,
          totalOpportunitiesFound: newOppsFound,
          opportunityDensity: Math.round(newDensity * 1000) / 1000,
        },
        $inc: { totalRuns: 1 },
      },
    );

    console.log(
      `[SourceRegistry] Immediate markCrawled for ${cleanDomain}: nextCrawlAt set to ${nextCrawl.toISOString()}`,
    );
  }

  /**
   * Records a failed crawl immediately. Deactivates the source after 5 consecutive failures.
   */
  async markFailed(domain: string): Promise<void> {
    const cleanDomain = domain.toLowerCase().trim();
    const source = await SourceRegistryModel.findOne({ domain: cleanDomain });
    if (!source) return;

    const newFailureCount = (source.consecutiveFailures || 0) + 1;
    const shouldDeactivate = newFailureCount >= 5;

    await SourceRegistryModel.updateOne(
      { domain: cleanDomain },
      {
        $set: {
          consecutiveFailures: newFailureCount,
          isActive: shouldDeactivate ? false : source.isActive,
        },
      },
    );

    if (shouldDeactivate) {
      console.warn(
        `[SourceRegistry] Source deactivated after 5 consecutive failures: ${cleanDomain}`,
      );
    }
  }

  /**
   * Records the yield outcome of a crawl run for a specific source domain (Phase K).
   * Automatically deprioritizes domains with >= 3 consecutive empty runs,
   * while boosting proven high-yielding domains.
   */
  async recordRunOutcome(domain: string, yieldCount: number): Promise<void> {
    const cleanDomain = domain.toLowerCase().trim();
    const source = await SourceRegistryModel.findOne({ domain: cleanDomain });
    if (!source) return;

    if (yieldCount > 0) {
      const newTotal = (source.totalOpportunitiesFound || 0) + yieldCount;
      const updates: any = {
        consecutiveEmptyRuns: 0,
        totalOpportunitiesFound: newTotal,
      };

      // Boost high-yielding sources
      if (yieldCount >= 2 && source.priority !== 'critical') {
        updates.priority = 'high';
        updates.trustScore = Math.min(100, source.trustScore + 5);
      }

      await SourceRegistryModel.updateOne({ domain: cleanDomain }, { $set: updates });
    } else {
      const newEmptyCount = (source.consecutiveEmptyRuns || 0) + 1;
      const updates: any = { consecutiveEmptyRuns: newEmptyCount };

      const totalAccepted = source.totalOpportunitiesFound || 0;
      const avgQuality = source.averageOpportunityQuality || 0;
      const discoveryVal = source.discoveryValue || 50;

      if (newEmptyCount >= 5) {
        const hasHighHistoricalValue = totalAccepted > 10 || avgQuality > 75 || discoveryVal > 70;

        if (hasHighHistoricalValue) {
          if (source.priority === 'critical') {
            updates.priority = 'high';
          } else if (source.priority === 'high') {
            updates.priority = 'medium';
          } else {
            updates.priority = 'low';
          }
          updates.crawlFrequency = 'monthly';
          console.log(
            `[SourceRegistry] Source deprioritized: ${cleanDomain}. Reason: High historical value but temporary low yield. (${newEmptyCount} empty runs)`,
          );
        } else {
          updates.priority = 'low';
          updates.crawlFrequency = 'monthly';
          updates.isActive = false;
          console.warn(
            `[SourceRegistry] Source deactivated: ${cleanDomain}. Reason: Low historical yield and consecutive failures. (${newEmptyCount} empty runs)`,
          );
        }
      } else if (newEmptyCount >= 3) {
        if (source.priority === 'critical') {
          updates.priority = 'high';
        } else {
          updates.priority = 'low';
        }
        updates.crawlFrequency = 'monthly';
      }

      await SourceRegistryModel.updateOne({ domain: cleanDomain }, { $set: updates });
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
      tierACount,
      tierBCount,
      tierCCount,
      governmentSources,
      startupSources,
      researchSources,
      communitySources,
      inactiveSources,
      averagesResult,
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
      SourceRegistryModel.countDocuments({ sourceTier: 'A' }),
      SourceRegistryModel.countDocuments({ sourceTier: 'B' }),
      SourceRegistryModel.countDocuments({ sourceTier: 'C' }),
      SourceRegistryModel.countDocuments({ ecosystemType: 'GOVERNMENT' }),
      SourceRegistryModel.countDocuments({ ecosystemType: 'STARTUP' }),
      SourceRegistryModel.countDocuments({ ecosystemType: 'RESEARCH' }),
      SourceRegistryModel.countDocuments({ ecosystemType: 'COMMUNITY' }),
      SourceRegistryModel.countDocuments({ isActive: false }),
      SourceRegistryModel.aggregate([
        {
          $group: {
            _id: null,
            avgTrust: { $avg: '$trustScore' },
            avgDV: { $avg: '$discoveryValue' },
            avgSR: { $avg: '$studentRelevance' },
            avgFreshness: { $avg: '$freshnessScore' },
          },
        },
      ]),
    ]);

    const toRecord = (arr: { _id: string; count: number }[]) =>
      Object.fromEntries(arr.map((e) => [e._id, e.count]));

    const averages = averagesResult[0] || { avgTrust: 0, avgDV: 0, avgSR: 0, avgFreshness: 0 };

    return {
      total,
      active,
      byCategory: toRecord(byCategoryRaw),
      byPriority: toRecord(byPriorityRaw),
      bySourceType: toRecord(bySourceTypeRaw),
      avgOpportunityDensity:
        densityResult.length > 0 ? Math.round((densityResult[0].avg ?? 0) * 1000) / 1000 : 0,
      topSources: topSources as any,
      tierACount,
      tierBCount,
      tierCCount,
      governmentSources,
      startupSources,
      researchSources,
      communitySources,
      avgTrustScore: Math.round(averages.avgTrust || 0),
      avgDiscoveryValue: Math.round(averages.avgDV || 0),
      avgStudentRelevance: Math.round(averages.avgSR || 0),
      avgFreshness: Math.round(averages.avgFreshness || 0),
      inactiveSources,
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
  if (tagStr.includes('government') && tagStr.includes('internship'))
    return 'GOVERNMENT_INTERNSHIP';
  if (tagStr.includes('research') && tagStr.includes('internship')) return 'RESEARCH_INTERNSHIP';
  if (tagStr.includes('open-source') || tagStr.includes('open source'))
    return 'OPEN_SOURCE_PROGRAM';
  if (tagStr.includes('ambassador')) return 'CAMPUS_AMBASSADOR';
  if (tagStr.includes('bootcamp')) return 'BOOTCAMP';
  if (tagStr.includes('hackathon') || tagStr.includes('competition')) return 'HACKATHONS';
  if (tagStr.includes('scholarship')) return 'SCHOLARSHIPS';
  if (tagStr.includes('fellowship')) return 'FELLOWSHIPS';
  if (tagStr.includes('government') || tagStr.includes('gov')) return 'GOVERNMENT_INTERNSHIP';
  if (tagStr.includes('research') || tagStr.includes('scientific')) return 'RESEARCH_INTERNSHIP';
  if (tagStr.includes('entrepreneurship') || tagStr.includes('startup'))
    return 'STARTUP_INTERNSHIPS';
  if (tagStr.includes('skill') || tagStr.includes('training')) return 'BOOTCAMP';
  if (tagStr.includes('technology') || tagStr.includes('tech')) return 'INTERNSHIPS';
  return 'INTERNSHIPS';
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const sourceRegistryService = new SourceRegistryService();
