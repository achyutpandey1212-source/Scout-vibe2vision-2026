import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../../auth/types/auth.types';
import { requireAuth } from '../../../middleware/auth';
import { UserIntelligenceRepository } from '../../../profile/repository/user-intelligence.repository';
import { OpportunityModel } from '../../../discovery/extraction/models/opportunity.model';
import { RecommendationEngine } from '../engine/recommendation-engine';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.dbUser) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authenticated user identity context missing.',
      },
    });
  }

  try {
    const userId = req.dbUser._id.toString();
    const userIntelligence = await UserIntelligenceRepository.findByUserId(userId);

    if (!userIntelligence) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User Intelligence profile not found. Please complete onboarding first.',
        },
      });
    }

    // Load active opportunities (not expired, or deadline in the future)
    const now = new Date();
    const opportunities = await OpportunityModel.find({
      $and: [
        { 'intelligence.expired': { $ne: true } },
        {
          $or: [{ deadline: null }, { deadline: { $gt: now } }],
        },
      ],
    });

    // Score all opportunities
    const scoredList = opportunities.map((op) => {
      const evaluation = RecommendationEngine.evaluate(userIntelligence, op);
      return {
        opportunity: op,
        recommendationScore: evaluation.score,
        matchedFactors: evaluation.matchedFactors,
        missingFactors: evaluation.missingFactors,
        explanation: evaluation.explanation,
      };
    });

    // Sort by recommendationScore descending
    scoredList.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Return Top 20 recommendations
    const topRecommendations = scoredList.slice(0, 20);

    return res.json({
      success: true,
      data: topRecommendations,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[RECOMMENDATIONS] API error:', errMsg);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate personalized recommendation feed.',
      },
    });
  }
});

export const recommendationRouter = router;
export default recommendationRouter;
