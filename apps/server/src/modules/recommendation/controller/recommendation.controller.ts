import { Response } from 'express';
import { AuthenticatedRequest } from '../../../auth/types/auth.types';
import { GenerateRecommendationsUseCase } from '../use-cases/generate-recommendations.use-case';
import { RecommendationDashboardService } from '../dashboard/recommendation-dashboard.service';

export class RecommendationController {
  /**
   * GET /api/v1/recommendations
   */
  static async getRecommendations(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.dbUser) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User authentication details missing' },
        });
      }

      const userId = req.dbUser._id.toString();

      // Ensure we run the use-case first to check if cache invalidation/generation is needed
      const triggerRes = await GenerateRecommendationsUseCase.execute(userId);

      // Retrieve Dashboard formatted DTO
      const result = await RecommendationDashboardService.getDashboardData(userId);

      if (result.status === 'GENERATING' || triggerRes.status === 'PENDING') {
        return res.status(200).json({
          status: 'GENERATING',
        });
      }

      if (result.status === 'FAILED' || triggerRes.status === 'FAILED') {
        return res.status(200).json({
          status: 'FAILED',
        });
      }

      return res.status(200).json({
        status: 'READY',
        pack: result.pack,
      });
    } catch (error: any) {
      console.error('[Recommendation] Failed to get recommendations:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message },
      });
    }
  }

  /**
   * POST /api/v1/recommendations/refresh
   */
  static async refresh(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.dbUser) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User authentication details missing' },
        });
      }

      const userId = req.dbUser._id.toString();

      // Trigger forced generation immediately in the background
      await GenerateRecommendationsUseCase.execute(userId, 'MANUAL_REFRESH');

      return res.status(200).json({
        status: 'GENERATING',
      });
    } catch (error: any) {
      console.error('[Recommendation] Failed to trigger refresh:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message },
      });
    }
  }
}
