import { RecommendationService } from '../service/recommendation.service';
import { IRecommendationPack, RecommendationGenerationReason } from '../types/recommendation.types';

export class GenerateRecommendationsUseCase {
  /**
   * Executes the recommendation generation flow.
   * If regeneration is needed, starts it in the background and returns a placeholder PENDING status.
   * Otherwise, returns the latest ready pack.
   */
  static async execute(
    userId: string,
    forcedReason?: RecommendationGenerationReason,
  ): Promise<{ status: 'PENDING' | 'READY'; pack: IRecommendationPack | null }> {
    const latestPack = await RecommendationService.getLatestPack(userId);

    // If there is a pack currently generating, return PENDING
    if (latestPack && latestPack.status === 'GENERATING') {
      return { status: 'PENDING', pack: latestPack };
    }

    const { shouldGenerate, reason, currentHash } =
      await RecommendationService.shouldGenerate(userId);

    if (shouldGenerate || forcedReason) {
      // Start generating
      const generatingPack = await RecommendationService.createGeneratingPack(
        userId,
        currentHash,
        forcedReason || reason || 'LOGIN',
      );

      // Trigger async placeholder generation in background (Phase 1 behavior)
      this.runBackgroundPlaceholderGeneration(generatingPack._id.toString());

      return { status: 'PENDING', pack: generatingPack };
    }

    return { status: 'READY', pack: latestPack };
  }

  /**
   * Simulates asynchronous generation in the background.
   */
  private static runBackgroundPlaceholderGeneration(packId: string): void {
    setTimeout(async () => {
      try {
        // In later phases, this will run candidate retrieval, scoring, and AI.
        // For Phase 1, we just update the status to READY after a small delay.
        await RecommendationService.markReady(packId, {
          todayMission: 'Complete onboarding fully and bookmark two high-value startups.',
          perfectMatch: {
            personalizedReason: 'Matches your core skills and career goals.',
            whyNow: 'Applications are closing soon.',
            missingSkills: ['Git', 'Docker'],
            firstAction: 'Refine your project README.',
            score: 95,
          },
          aiSummary: 'This placeholder pack has been generated successfully.',
        });
      } catch (error) {
        console.error(`[Recommendation] Background generation failed for pack ${packId}:`, error);
        await RecommendationService.markFailed(packId).catch(() => {});
      }
    }, 1000); // 1-second delay to simulate network/AI operations
  }
}
