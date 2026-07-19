import { Response } from 'express';
import { AuthenticatedRequest } from '../../../auth/types/auth.types';
import { GenerateRecommendationsUseCase } from '../use-cases/generate-recommendations.use-case';

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
      const result = await GenerateRecommendationsUseCase.execute(userId);

      if (result.status === 'PENDING') {
        return res.status(200).json({
          success: true,
          status: 'PENDING',
        });
      }

      return res.status(200).json({
        success: true,
        status: 'READY',
        data: result.pack,
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
   * POST /api/v1/recommendations/regenerate
   */
  static async regenerate(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.dbUser) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User authentication details missing' },
        });
      }

      const userId = req.dbUser._id.toString();
      await GenerateRecommendationsUseCase.execute(userId, 'MANUAL_REFRESH');

      return res.status(200).json({
        success: true,
        status: 'PENDING',
      });
    } catch (error: any) {
      console.error('[Recommendation] Failed to trigger regeneration:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message },
      });
    }
  }
}
