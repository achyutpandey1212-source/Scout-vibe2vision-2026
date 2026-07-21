import { RecommendationService } from '../service/recommendation.service';
import { BackgroundGenerationService } from '../generation/background-generation.service';
import { IRecommendationPack, RecommendationGenerationReason } from '../types/recommendation.types';
import { RecommendationSchedulerService } from '../scheduler/recommendation-scheduler.service';
import { OnboardingGuard } from '../guard/onboarding-guard';

export class GenerateRecommendationsUseCase {
  /**
   * Thin orchestrator determining onboarding gating, lifecycle state, caching status, trigger locks, and enqueuing background tasks.
   */
  static async execute(
    userId: string,
    forcedReason?: RecommendationGenerationReason,
  ): Promise<{
    status: 'PENDING' | 'READY' | 'FAILED' | 'ONBOARDING_REQUIRED' | 'STALE';
    pack: IRecommendationPack | null;
  }> {
    // 0. Onboarding Gating Guard: verify onboarding is completed before queueing or generating
    const isCompleted = await OnboardingGuard.isOnboardingCompleted(userId);
    if (!isCompleted) {
      console.log(
        `[Recommendation Engine] Generation Skipped. Reason: Onboarding incomplete for user ${userId}`,
      );
      return { status: 'ONBOARDING_REQUIRED', pack: null };
    }

    const latestPack = await RecommendationService.getLatestPack(userId);

    // 1. If currently generating, return PENDING immediately (never launch duplicate worker)
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
          `[Recommendation Engine] Generation lock active for user ${userId}. Returning existing job.`,
        );
        return { status: latestPack ? 'READY' : 'PENDING', pack: latestPack };
      }

      console.log(
        `[Recommendation Engine] Cache invalid or fingerprint updated. Enqueuing background task (Reason: ${triggerReason}).`,
      );

      // Trigger background generation asynchronously (non-blocking)
      BackgroundGenerationService.trigger(
        userId,
        currentHash,
        triggerReason as RecommendationGenerationReason,
      );

      // If an existing ready pack exists, serve it immediately as STALE while regenerating in background
      if (latestPack && latestPack.status === 'READY') {
        return { status: 'STALE', pack: latestPack };
      }

      // Return status PENDING for first-time generations
      return { status: 'PENDING', pack: latestPack };
    }

    if (latestPack && latestPack.status === 'FAILED') {
      return { status: 'FAILED', pack: latestPack };
    }

    // 3. Cache hit: Return READY
    return { status: 'READY', pack: latestPack };
  }
}
