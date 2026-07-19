import { RecommendationService } from '../service/recommendation.service';
import { BackgroundGenerationService } from '../generation/background-generation.service';
import { IRecommendationPack, RecommendationGenerationReason } from '../types/recommendation.types';
import { RecommendationSchedulerService } from '../scheduler/recommendation-scheduler.service';

export class GenerateRecommendationsUseCase {
  /**
   * Thin orchestrator determining caching status, trigger locks, and enqueuing background tasks.
   */
  static async execute(
    userId: string,
    forcedReason?: RecommendationGenerationReason,
  ): Promise<{ status: 'PENDING' | 'READY' | 'FAILED'; pack: IRecommendationPack | null }> {
    const latestPack = await RecommendationService.getLatestPack(userId);

    // 1. If currently generating, return PENDING immediately
    if (latestPack && latestPack.status === 'GENERATING') {
      return { status: 'PENDING', pack: latestPack };
    }

    // 2. Evaluate if regeneration is required (expiration or hash change)
    const { shouldGenerate, reason, currentHash } =
      await RecommendationService.shouldGenerate(userId);

    const isExpired = RecommendationSchedulerService.shouldRegenerate(latestPack);
    const needGeneration = shouldGenerate || isExpired || forcedReason;

    if (needGeneration) {
      const triggerReason = forcedReason || reason || (isExpired ? 'CACHE_EXPIRED' : 'LOGIN');

      // Check lock to prevent multiple concurrent triggers
      if (BackgroundGenerationService.isGenerating(userId)) {
        console.log(
          `[Recommendation] Generation lock is active for user ${userId}. Returning PENDING.`,
        );
        return { status: 'PENDING', pack: latestPack };
      }

      // Print startup log matching Discovery logs format
      console.log(
        `[Recommendation] Cache invalid or missing. Enqueuing background task (Reason: ${triggerReason}).`,
      );

      // Trigger background generation asynchronously (non-blocking)
      BackgroundGenerationService.trigger(userId, currentHash, triggerReason);

      // Return status PENDING
      return { status: 'PENDING', pack: latestPack };
    }

    if (latestPack && latestPack.status === 'FAILED') {
      return { status: 'FAILED', pack: latestPack };
    }

    // 3. Cache hit: Return READY
    return { status: 'READY', pack: latestPack };
  }
}
