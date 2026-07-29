import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { AuthService } from '../services/auth.service';
import { db } from '../../config/db';
import { firebase } from '../../config';

import { UserIntelligenceRepository } from '../../profile/repository/user-intelligence.repository';
import { UserRepository } from '../repository/user.repository';

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

      // Update lastVisitedAt (throttled inside the repository)
      const updatedUser = await UserRepository.updateLastVisited(req.dbUser.firebaseUid);
      const userObj = updatedUser || req.dbUser;

      return res.json({
        success: true,
        data: {
          ...userObj.toJSON(),
          onboardingCompleted: intelligence.onboarding.completed,
          onboardingStep: intelligence.onboarding.currentStep,
        },
      });
    } catch (error: unknown) {
      console.error('[AUTH] Unable to retrieve current user.');
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
      console.error('[AUTH] Unable to sync authenticated user.');
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
