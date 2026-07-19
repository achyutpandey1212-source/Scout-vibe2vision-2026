import { RecommendationPackModel } from '../schemas/recommendation-pack.schema';
import { RecommendationConfig } from '../config/recommendation-config';

export interface IRecommendationHealthReport {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  cacheHitRate: number;
  generationSuccess: number;
  fallbackRate: number;
  averageLatency: number;
  qualityScore: number;
}

export class RecommendationMetricsService {
  /**
   * Evaluates the health status of the recommendation engine using recent pack records.
   * Compares latency and error fallback rates against thresholds.
   */
  static async getRecommendationHealth(): Promise<IRecommendationHealthReport> {
    const recentPacks = await RecommendationPackModel.find()
      .sort({ generatedAt: -1 })
      .limit(50)
      .exec();

    if (recentPacks.length === 0) {
      return {
        status: 'HEALTHY',
        cacheHitRate: 100,
        generationSuccess: 100,
        fallbackRate: 0,
        averageLatency: 0,
        qualityScore: 100,
      };
    }

    const total = recentPacks.length;
    const readyPacks = recentPacks.filter((p) => p.status === 'READY');
    const failedPacks = recentPacks.filter((p) => p.status === 'FAILED');
    const successRate =
      total > 0 ? readyPacks.length / (readyPacks.length + failedPacks.length || 1) : 1;

    const cacheHits = recentPacks.filter((p) => p.metadata?.cacheHit === true).length;
    const cacheHitRate = Math.round((cacheHits / total) * 100);

    const fallbacks = readyPacks.filter((p) => p.metadata?.fallbackUsed === true).length;
    const fallbackRate = readyPacks.length > 0 ? fallbacks / readyPacks.length : 0;

    const latencies = readyPacks.map((p) => p.metadata?.generationTimeMs || 0);
    const averageLatency =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0;

    const qualities = readyPacks.map((p) => p.metadata?.qualityScore || 0);
    const averageQualityScore =
      qualities.length > 0
        ? Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length)
        : 80;

    const thresholds = RecommendationConfig.getThresholds();

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';

    if (successRate < thresholds.minSuccessRate || fallbackRate > thresholds.maxFallbackRate * 2) {
      status = 'CRITICAL';
    } else if (
      averageLatency > thresholds.maxAverageLatencyMs ||
      fallbackRate > thresholds.maxFallbackRate
    ) {
      status = 'WARNING';
    }

    return {
      status,
      cacheHitRate,
      generationSuccess: Math.round(successRate * 100),
      fallbackRate: Math.round(fallbackRate * 100),
      averageLatency,
      qualityScore: averageQualityScore,
    };
  }
}
