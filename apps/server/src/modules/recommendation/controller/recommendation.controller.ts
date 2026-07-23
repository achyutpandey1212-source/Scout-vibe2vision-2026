import { Response } from 'express';
import { AuthenticatedRequest } from '../../../auth/types/auth.types';
import { GenerateRecommendationsUseCase } from '../use-cases/generate-recommendations.use-case';
import { RecommendationDashboardService } from '../dashboard/recommendation-dashboard.service';
import { RecommendationConfig } from '../config/recommendation-config';
import { RecommendationMetricsService } from '../metrics/recommendation-metrics.service';
import { RecommendationExplainabilityService } from '../explainability/recommendation-explainability.service';
import { BackgroundGenerationService } from '../generation/background-generation.service';
import { RecommendationPackModel } from '../schemas/recommendation-pack.schema';
import {
  RecommendationEventModel,
  RecommendationAnalyticsService,
} from '../analytics/recommendation-analytics.service';
import { UserModel } from '../../../auth/models/user.model';
import mongoose from 'mongoose';

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

      // Check Maintenance Mode
      const { mode } = RecommendationConfig.getMode();
      if (mode === 'MAINTENANCE') {
        return res.status(503).json({
          success: false,
          error: { code: 'MAINTENANCE', message: 'Recommendations temporarily unavailable.' },
        });
      }

      const userId = req.dbUser._id.toString();

      // Ensure we run the use-case first to check if cache invalidation/generation is needed
      const triggerRes = await GenerateRecommendationsUseCase.execute(userId);

      if (triggerRes.status === 'ONBOARDING_REQUIRED') {
        return res.status(200).json({
          success: true,
          status: 'ONBOARDING_REQUIRED',
          data: null,
          message: 'Complete onboarding to receive personalized recommendations.',
        });
      }

      // Retrieve Dashboard formatted DTO
      const result = await RecommendationDashboardService.getDashboardData(userId);

      if (result.status === 'GENERATING' || triggerRes.status === 'PENDING') {
        const latestPack = await RecommendationPackModel.findOne({
          userId: new mongoose.Types.ObjectId(userId),
        })
          .sort({ generatedAt: -1 })
          .exec();
        return res.status(200).json({
          success: true,
          status: 'GENERATING',
          progressPhase: latestPack ? latestPack.progressPhase : 'RETRIEVING',
          data: null,
        });
      }

      if (result.status === 'FAILED' || triggerRes.status === 'FAILED') {
        return res.status(200).json({
          success: true,
          status: 'FAILED',
          data: null,
        });
      }

      // Record a VIEWED conversion event using the active packId
      const activePackId =
        result.pack?.packId ||
        result.pack?.id ||
        (result.pack?._id ? result.pack._id.toString() : '');
      if (activePackId) {
        RecommendationAnalyticsService.recordEvent('VIEWED', userId, activePackId).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        status: 'READY',
        packId: activePackId,
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
        success: true,
        status: 'GENERATING',
        data: null,
      });
    } catch (error: any) {
      console.error('[Recommendation] Failed to trigger refresh:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message },
      });
    }
  }

  // ==========================================
  // ADMINISTRATIVE / OPERATIONS CENTER API
  // ==========================================

  /**
   * GET /api/v1/recommendations/admin/health
   */
  static async getHealth(req: any, res: Response) {
    try {
      const health = await RecommendationMetricsService.getRecommendationHealth();
      return res.status(200).json({
        success: true,
        data: health,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * GET /api/v1/recommendations/admin/config
   */
  static async getConfig(req: any, res: Response) {
    try {
      return res.status(200).json({
        success: true,
        data: {
          flags: RecommendationConfig.getFlags(),
          weightsA: RecommendationConfig.getWeights('A'),
          weightsB: RecommendationConfig.getWeights('B'),
          thresholds: RecommendationConfig.getThresholds(),
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * POST /api/v1/recommendations/admin/config
   */
  static async updateConfig(req: any, res: Response) {
    try {
      const { flags, weightsA, weightsB } = req.body;
      if (flags) {
        RecommendationConfig.setFlags(flags);
      }
      if (weightsA) {
        RecommendationConfig.setWeights('A', weightsA);
      }
      if (weightsB) {
        RecommendationConfig.setWeights('B', weightsB);
      }
      return res.status(200).json({
        success: true,
        message: 'Recommendation configuration updated successfully.',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * GET /api/v1/recommendations/admin/mode
   */
  static async getMode(req: any, res: Response) {
    try {
      return res.status(200).json({
        success: true,
        data: RecommendationConfig.getMode(),
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * POST /api/v1/recommendations/admin/mode
   */
  static async updateMode(req: any, res: Response) {
    try {
      const { mode, operator } = req.body;
      if (!mode || !['PRODUCTION', 'DEVELOPMENT', 'MAINTENANCE'].includes(mode)) {
        return res.status(400).json({ success: false, error: { message: 'Invalid engine mode.' } });
      }
      RecommendationConfig.setMode(mode, operator || 'Admin');
      return res.status(200).json({
        success: true,
        data: RecommendationConfig.getMode(),
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * GET /api/v1/recommendations/admin/explain
   */
  static async getExplain(req: any, res: Response) {
    try {
      const { userId, packId } = req.query;
      let pack: any = null;

      if (packId) {
        pack = await RecommendationPackModel.findById(packId)
          .populate(
            'perfectMatch.opportunityId hiddenGem.opportunityId stretchGoal.opportunityId quickWin.opportunityId confidenceBuilder.opportunityId',
          )
          .exec();
      } else if (userId) {
        // Resolve user if not a valid ObjectId (search by email or name)
        let resolvedUserId = userId;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          const userObj = await UserModel.findOne({
            $or: [{ email: userId }, { name: userId }],
          }).exec();
          if (userObj) resolvedUserId = userObj._id.toString();
        }

        pack = await RecommendationPackModel.findOne({
          userId: new mongoose.Types.ObjectId(resolvedUserId),
        })
          .sort({ generatedAt: -1 })
          .populate(
            'perfectMatch.opportunityId hiddenGem.opportunityId stretchGoal.opportunityId quickWin.opportunityId confidenceBuilder.opportunityId',
          )
          .exec();
      }

      if (!pack) {
        return res
          .status(404)
          .json({ success: false, error: { message: 'No recommendation pack found.' } });
      }

      const explanation = RecommendationExplainabilityService.explainPack(pack);
      return res.status(200).json({
        success: true,
        data: explanation,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * POST /api/v1/recommendations/admin/generate
   */
  static async generate(req: any, res: Response) {
    try {
      const { userId, bypassCache, dryRun, stage, weights } = req.body;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, error: { message: 'Missing userId parameter.' } });
      }

      // Resolve user if searching by username or email
      let resolvedUserId = userId;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        const userObj = await UserModel.findOne({
          $or: [{ email: userId }, { name: userId }],
        }).exec();
        if (!userObj) {
          return res
            .status(404)
            .json({ success: false, error: { message: 'User not found by email or name.' } });
        }
        resolvedUserId = userObj._id.toString();
      }

      if (dryRun) {
        const result = await BackgroundGenerationService.runDryRun(resolvedUserId, stage, weights);
        return res.status(200).json({
          success: true,
          dryRun: true,
          data: result,
        });
      }

      // Trigger full async/sync generation depending on bypassCache config
      await GenerateRecommendationsUseCase.execute(resolvedUserId, 'ADMIN_FORCE');

      return res.status(200).json({
        success: true,
        message: 'Generation task enqueued successfully.',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * GET /api/v1/recommendations/admin/logs
   */
  static async getLogs(req: any, res: Response) {
    try {
      const logs = await RecommendationEventModel.find().sort({ timestamp: -1 }).limit(100).exec();
      return res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
}
