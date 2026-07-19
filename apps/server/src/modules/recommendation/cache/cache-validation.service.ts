import { IRecommendationPack } from '../types/recommendation.types';
import { RECOMMENDATION_VERSION } from '../constants';

export class CacheValidationService {
  /**
   * Validates if a recommendation pack cache is still fresh and valid.
   */
  static isValid(pack: IRecommendationPack, currentProfileHash: string): boolean {
    if (!pack) return false;

    // Check status is READY
    if (pack.status !== 'READY') return false;

    // Check version mismatch
    if (pack.recommendationVersion !== RECOMMENDATION_VERSION) {
      console.log('[Recommendation] Version mismatch');
      return false;
    }

    // Check profile hash mismatch
    if (pack.profileHash !== currentProfileHash) {
      console.log('[Recommendation] Profile changed');
      return false;
    }

    // Check daily expiry
    const now = new Date();
    if (pack.expiresAt.getTime() < now.getTime()) {
      console.log('[Recommendation] Pack expired');
      return false;
    }

    console.log('[Recommendation] Cache hit');
    return true;
  }
}
