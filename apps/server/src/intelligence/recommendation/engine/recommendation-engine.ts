import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';
import { IUserIntelligence } from '../../../profile/models/user-intelligence.model';
import { RECOMMENDATION_CONFIG } from '../config/scoring.config';
import { matchInterests } from '../utils/interest-match';
import { matchOpportunityType } from '../utils/opportunity-match';
import { matchWorkPreference } from '../utils/work-preference-match';
import { matchEducation } from '../utils/education-match';
import { matchObstacles } from '../utils/obstacle-match';
import { buildExplanation } from '../utils/explanation-builder';
import { RecommendationResult } from '../types/recommendation.types';

export class RecommendationEngine {
  /**
   * Generates a personalized recommendation score and explanation
   * matching an opportunity against a user's intelligence profile.
   */
  static evaluate(user: IUserIntelligence, opportunity: Opportunity): RecommendationResult {
    // 1. Interest Match (25%)
    const interestMatch = matchInterests(user.timeLossActivities, opportunity);

    // 2. Opportunity Type Match (25%)
    const typeMatch = matchOpportunityType(user.opportunityExcitement, opportunity);

    // 3. Work Preference Match (15%)
    const workMatch = matchWorkPreference(user.workPreferences, opportunity);

    // 4. Education Match (Part of Readiness, let's merge into Education/Obstacle)
    const eduMatch = matchEducation(user.educationDetail?.qualification, opportunity);

    // 5. Readiness Level Fit (15%)
    let readinessScore = 100;
    const isBeginner = (user.readinessIllustrativeLevel || 3) <= 2;
    const title = opportunity.title.toLowerCase();
    const desc = (opportunity.description || '').toLowerCase();
    const matchedReadiness: string[] = [];
    const missingReadiness: string[] = [];

    if (isBeginner) {
      const isSenior =
        title.includes('senior') ||
        title.includes('lead') ||
        title.includes('expert') ||
        title.includes('manager') ||
        desc.includes('years of experience required') ||
        desc.includes('years experience required');

      if (isSenior) {
        readinessScore = 50;
        missingReadiness.push('Opportunity requires senior/advanced leadership experience');
      } else {
        matchedReadiness.push('Beginner friendly');
      }
    } else {
      matchedReadiness.push('Readiness levels matched');
    }

    // 6. Availability Fit (10%)
    let availabilityScore = 100;
    const userHours = user.availability?.hoursPerWeek || 10;
    const isFullTimeOp =
      title.includes('full time') ||
      title.includes('full-time') ||
      desc.includes('full time') ||
      desc.includes('full-time') ||
      desc.includes('40 hours/week') ||
      desc.includes('40 hrs/week');

    const matchedAvailability: string[] = [];
    const missingAvailability: string[] = [];

    if (isFullTimeOp && userHours < 30) {
      availabilityScore = 50;
      missingAvailability.push('Opportunity requires full-time availability (40 hours/week)');
    } else {
      matchedAvailability.push('Fits availability');
    }

    // 7. Obstacle & Constraint Match (10%)
    const obstacleMatch = matchObstacles(user.biggestObstacles, opportunity);

    // Calculate final weighted score
    const { weights } = RECOMMENDATION_CONFIG;
    const finalScore =
      interestMatch.score * (weights.interestMatch / 100) +
      typeMatch.score * (weights.opportunityTypeMatch / 100) +
      workMatch.score * (weights.workPreference / 100) +
      readinessScore * (weights.readiness / 100) +
      availabilityScore * (weights.availability / 100) +
      obstacleMatch.score * (weights.obstacle / 100);

    // Compile factors list
    const matchedFactors: string[] = [
      ...interestMatch.matched,
      ...typeMatch.matched,
      ...workMatch.matched,
      ...eduMatch.matched,
      ...matchedReadiness,
      ...matchedAvailability,
      ...obstacleMatch.matched,
    ];

    const missingFactors: string[] = [
      ...interestMatch.missing,
      ...typeMatch.missing,
      ...workMatch.missing,
      ...eduMatch.missing,
      ...missingReadiness,
      ...missingAvailability,
      ...obstacleMatch.missing,
    ];

    // Build structured explanations list
    const explanation = buildExplanation(opportunity, {
      interests: interestMatch.matched,
      types: typeMatch.matched,
      work: workMatch.matched,
      education: eduMatch.matched,
      obstacles: obstacleMatch.matched,
    });

    // Emphasize target goals in explanations if matched
    if (user.magicOneProblem) {
      const matchKeywords = user.magicOneProblem.toLowerCase().split(' ');
      const titleMatches = matchKeywords.some((word) => title.includes(word));
      if (titleMatches) {
        explanation.unshift(`✓ Solves your target goal: "${user.magicOneProblem}"`);
      }
    }

    return {
      score: Math.min(Math.max(Math.round(finalScore), 0), 100),
      matchedFactors,
      missingFactors,
      explanation,
    };
  }
}
