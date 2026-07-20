import { QueryYieldModel } from '../query-engine/query-yield.model';
import { SourceRegistryModel } from '../sources/source-registry.model';

export interface YieldAggregationResult {
  pagesCrawled: number;
  acceptedCount: number;
  savedCount: number;
}

export class YieldEngine {
  /**
   * Aggregates and updates rolling yield conversion metrics for queries and sources post-crawl.
   */
  static async recordRunYield(
    domain: string,
    queryMetrics: Map<string, YieldAggregationResult>,
  ): Promise<void> {
    try {
      const dbOps: any[] = [];
      let totalAccepted = 0;
      let totalCrawled = 0;

      for (const [query, stats] of queryMetrics.entries()) {
        totalAccepted += stats.acceptedCount;
        totalCrawled += stats.pagesCrawled;

        dbOps.push({
          updateOne: {
            filter: { query },
            update: {
              $inc: {
                runs: 1,
                opportunitiesAccepted: stats.acceptedCount,
                pagesCrawled: stats.pagesCrawled,
              },
              $set: { lastRunAt: new Date() },
            },
            upsert: true,
          },
        });
      }

      // Update Queries Yield in MongoDB in bulk
      if (dbOps.length > 0) {
        await QueryYieldModel.bulkWrite(dbOps);
      }

      // Update Source Registry yield stats
      const domainLower = domain.toLowerCase().trim();
      const registryEntry = await SourceRegistryModel.findOne({ domain: domainLower });

      if (registryEntry) {
        const acceptedCount = (registryEntry.acceptedCount || 0) + totalAccepted;
        const totalRuns = (registryEntry.totalRuns || 0) + 1;
        const totalPages = (registryEntry.totalPagesCrawled || 0) + totalCrawled;

        const yieldScore = totalRuns > 0 ? Math.round((acceptedCount / totalRuns) * 10) : 0;

        await SourceRegistryModel.updateOne(
          { domain: domainLower },
          {
            $inc: {
              totalRuns: 1,
              totalPagesCrawled: totalCrawled,
              totalOpportunitiesFound: totalAccepted,
              acceptedCount: totalAccepted,
            },
            $set: {
              yieldScore: Math.min(100, yieldScore),
              lastCrawledAt: new Date(),
            },
          },
        );
      }
    } catch (err: any) {
      console.error(`[Yield Engine] Failed to record query and source run yield: ${err.message}`);
    }
  }
}
export default YieldEngine;
