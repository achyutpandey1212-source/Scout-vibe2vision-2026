import { Response } from 'express';
import { AuthenticatedRequest } from '../../auth/types/auth.types';
import { UserIntelligenceRepository } from '../repository/user-intelligence.repository';

export class ProfileController {
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.dbUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User identity not found in database.',
        },
      });
    }

    try {
      const userId = req.dbUser._id.toString();
      const profile = await UserIntelligenceRepository.findOrCreateByUserId(userId);
      return res.json({
        success: true,
        data: profile,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[PROFILE] Error fetching/creating profile:', errMsg);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve profile metadata.',
        },
      });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.dbUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User identity not found in database.',
        },
      });
    }

    try {
      const userId = req.dbUser._id.toString();
      const profile = await UserIntelligenceRepository.upsertProfile(userId, req.body);
      return res.json({
        success: true,
        data: profile,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[PROFILE] Error updating profile:', errMsg);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile details.',
        },
      });
    }
  }

  static async completeOnboarding(req: AuthenticatedRequest, res: Response) {
    if (!req.dbUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User identity not found in database.',
        },
      });
    }

    try {
      const userId = req.dbUser._id.toString();
      const profile = await UserIntelligenceRepository.completeOnboarding(userId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User Intelligence profile not found.',
          },
        });
      }

      // Trigger Recommendation Generation ONCE now that onboarding is complete!
      const { BackgroundGenerationService } =
        await import('../../modules/recommendation/generation/background-generation.service');
      BackgroundGenerationService.trigger(userId, undefined, 'ONBOARDING_COMPLETE' as any);

      return res.json({
        success: true,
        data: profile,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[PROFILE] Error completing onboarding:', errMsg);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to complete onboarding milestones.',
        },
      });
    }
  }
}
