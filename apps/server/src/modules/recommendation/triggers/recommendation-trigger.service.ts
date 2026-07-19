import { IRecommendationPack, RecommendationGenerationReason } from '../types/recommendation.types';
import { RECOMMENDATION_VERSION } from '../constants';

export class RecommendationTriggerService {
  /**
   * Decides whether recommendations need regeneration.
   * Returns an object indicating if it should generate and the reason why.
   */
  static shouldGenerateRecommendation(
    pack: IRecommendationPack | null,
    currentProfileHash: string,
  ): { shouldGenerate: boolean; reason?: RecommendationGenerationReason } {
    console.log('[Recommendation] Checking cache...');

    // 1. No recommendation pack exists
    if (!pack) {
      console.log('[Recommendation] Cache miss: No pack exists');
      return { shouldGenerate: true, reason: 'LOGIN' };
    }

    // If the pack status is FAILED or GENERATING, we may want to regenerate
    if (pack.status === 'FAILED') {
      console.log('[Recommendation] Cache miss: Previous generation failed');
      return { shouldGenerate: true, reason: 'LOGIN' };
    }

    // 2. Pack expired
    const now = new Date();
    if (pack.expiresAt.getTime() < now.getTime()) {
      console.log('[Recommendation] Pack expired');
      return { shouldGenerate: true, reason: 'CACHE_EXPIRED' };
    }

    // 3. Profile hash changed
    if (pack.profileHash !== currentProfileHash) {
      console.log('[Recommendation] Profile changed');
      return { shouldGenerate: true, reason: 'PROFILE_UPDATED' };
    }

    // 4. Recommendation version changed
    if (pack.recommendationVersion !== RECOMMENDATION_VERSION) {
      console.log('[Recommendation] Version mismatch');
      return { shouldGenerate: true, reason: 'VERSION_CHANGED' };
    }

    console.log('[Recommendation] Cache hit');
    return { shouldGenerate: false };
  }
}
