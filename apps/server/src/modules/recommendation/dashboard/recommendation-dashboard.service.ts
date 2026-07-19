import { RecommendationRepository } from '../repository/recommendation.repository';
import { RecommendationDto } from '../api/recommendation.dto';
import { IRecommendationPack } from '../types/recommendation.types';

export class RecommendationDashboardService {
  /**
   * Retrieves the dashboard response for a user, formatting READY packs using DTO.
   */
  static async getDashboardData(userId: string): Promise<{
    status: 'READY' | 'GENERATING' | 'FAILED' | 'NO_PACK';
    pack: any | null;
  }> {
    const latestPack = await RecommendationRepository.findLatestByUser(userId);

    if (!latestPack) {
      return { status: 'NO_PACK', pack: null };
    }

    if (latestPack.status === 'GENERATING') {
      return { status: 'GENERATING', pack: null };
    }

    if (latestPack.status === 'FAILED') {
      return { status: 'FAILED', pack: null };
    }

    // Format ready pack
    const formatted = RecommendationDto.toDto(latestPack);
    return {
      status: 'READY',
      pack: formatted,
    };
  }
}
