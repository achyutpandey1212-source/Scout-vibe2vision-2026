import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { AuthService } from '../services/auth.service';
import { db } from '../../config/db';
import { firebase } from '../../config';

import { UserIntelligenceRepository } from '../../profile/repository/user-intelligence.repository';

export class AuthController {
  static async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    if (!req.dbUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User does not exist in database. Please sync identity first.',
        },
      });
    }

    try {
      const userId = req.dbUser._id.toString();
      const intelligence = await UserIntelligenceRepository.findOrCreateByUserId(userId);
      return res.json({
        success: true,
        data: {
          ...req.dbUser.toJSON(),
          onboardingCompleted: intelligence.onboarding.completed,
          onboardingStep: intelligence.onboarding.currentStep,
        },
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[AUTH] Get current user error:', errMsg);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve authenticated user details.',
        },
      });
    }
  }

  static async syncUser(req: AuthenticatedRequest, res: Response) {
    if (!req.auth) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authenticated session credentials available to sync.',
        },
      });
    }

    try {
      const user = await AuthService.syncUser(req.auth);
      const userId = user._id.toString();
      const intelligence = await UserIntelligenceRepository.findOrCreateByUserId(userId);
      return res.json({
        success: true,
        data: {
          ...user.toJSON(),
          onboardingCompleted: intelligence.onboarding.completed,
          onboardingStep: intelligence.onboarding.currentStep,
        },
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[AUTH] Sync error:', errMsg);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync user identity.',
        },
      });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response) {
    const uid = req.auth?.uid;
    console.log(
      `[AUTH] User Logged Out | UID: ${uid || 'anonymous'} | Timestamp: ${new Date().toISOString()}`,
    );
    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  static async getHealth(req: AuthenticatedRequest, res: Response) {
    const mongoStatus = db.getHealth();
    const firebaseStatus = firebase.isInitialized() ? 'configured' : 'error';
    const isHealthy = mongoStatus === 'ok' && firebaseStatus === 'configured';

    return res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      services: {
        mongodb: mongoStatus,
        firebase: firebaseStatus,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
