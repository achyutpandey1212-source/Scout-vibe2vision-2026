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
    console.log(`
----------------------------------------
[Recommendation Engine] Cache Evaluation
Saved Fingerprint:   ${pack?.profileHash || 'NONE'}
Current Fingerprint: ${currentProfileHash}
Pack Status:         ${pack?.status || 'NO_PACK'}
----------------------------------------
`);

    // 1. No recommendation pack exists
    if (!pack) {
      console.log(
        '[Recommendation Engine] Cache Miss: No recommendation pack found. (Reason: LOGIN)',
      );
      return { shouldGenerate: true, reason: 'LOGIN' };
    }

    // 2. Previous generation failed
    if (pack.status === 'FAILED') {
      console.log(
        '[Recommendation Engine] Cache Miss: Previous generation failed. Retrying. (Reason: LOGIN)',
      );
      return { shouldGenerate: true, reason: 'LOGIN' };
    }

    // 3. Pack expired
    const now = new Date();
    if (pack.expiresAt && pack.expiresAt.getTime() < now.getTime()) {
      console.log('[Recommendation Engine] Cache Miss: Pack expired. (Reason: CACHE_EXPIRED)');
      return { shouldGenerate: true, reason: 'CACHE_EXPIRED' };
    }

    // 4. Recommendation Fingerprint mismatch (Profile or Resume data changed)
    if (pack.profileHash !== currentProfileHash) {
      console.log(
        `[Recommendation Engine] Fingerprint Mismatch. Reason: Profile data changed. Saved: ${pack.profileHash.substring(0, 8)}... Current: ${currentProfileHash.substring(0, 8)}... (Reason: PROFILE_UPDATED)`,
      );
      return { shouldGenerate: true, reason: 'PROFILE_UPDATED' };
    }

    // 5. Version mismatch
    if (pack.recommendationVersion && pack.recommendationVersion !== RECOMMENDATION_VERSION) {
      console.log(
        '[Recommendation Engine] Cache Miss: Engine version updated. (Reason: VERSION_CHANGED)',
      );
      return { shouldGenerate: true, reason: 'VERSION_CHANGED' };
    }

    console.log(`
----------------------------------------
[Recommendation Engine] Cache Status
Fingerprint: MATCH
Cache:       VALID
Using cached recommendations.
----------------------------------------
`);
    return { shouldGenerate: false };
  }
}
