import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';
import { SCORING_CONFIG } from '../config/scoring.config';
import { ScoreResult } from '../types/scoring.types';

/**
 * Computes a quality score between 0 and 100.
 * Rewards data completeness, deadline availability, and detailed opportunity descriptions.
 */
export function calculateQualityScore(opp: Opportunity): ScoreResult {
  const factors: Record<string, number> = {};
  let score = SCORING_CONFIG.qualityWeights.baseScore;
  factors['base'] = score;

  // 1. Has application url
  if (opp.applicationUrl) {
    factors['hasApplicationUrlBonus'] = SCORING_CONFIG.qualityWeights.hasApplicationUrl;
    score += SCORING_CONFIG.qualityWeights.hasApplicationUrl;
  }

  // 2. Has deadline
  if (opp.deadline || opp.intelligence?.normalizedDeadline) {
    factors['hasDeadlineBonus'] = SCORING_CONFIG.qualityWeights.hasDeadline;
    score += SCORING_CONFIG.qualityWeights.hasDeadline;
  }

  // 3. Has eligibility
  if (opp.eligibility && opp.eligibility.trim().length > 15) {
    factors['hasEligibilityBonus'] = SCORING_CONFIG.qualityWeights.hasEligibility;
    score += SCORING_CONFIG.qualityWeights.hasEligibility;
  }

  // 4. Has benefits
  if (opp.benefits && opp.benefits.trim().length > 15) {
    factors['hasBenefitsBonus'] = SCORING_CONFIG.qualityWeights.hasBenefits;
    score += SCORING_CONFIG.qualityWeights.hasBenefits;
  }

  // 5. Has salary or stipend
  const hasSalary = opp.salary !== null && opp.salary > 0;
  const hasStipend = opp.stipend !== null && opp.stipend > 0;
  if (hasSalary || hasStipend) {
    factors['hasCompensationBonus'] = SCORING_CONFIG.qualityWeights.hasSalaryOrStipend;
    score += SCORING_CONFIG.qualityWeights.hasSalaryOrStipend;
  }

  // 6. Has official website
  if (opp.officialWebsite) {
    factors['hasOfficialWebsiteBonus'] = SCORING_CONFIG.qualityWeights.hasOfficialWebsite;
    score += SCORING_CONFIG.qualityWeights.hasOfficialWebsite;
  }

  // 7. Long description bonus
  if (opp.description && opp.description.trim().length > 300) {
    factors['descriptionLengthBonus'] = SCORING_CONFIG.qualityWeights.descriptionLengthBonus;
    score += SCORING_CONFIG.qualityWeights.descriptionLengthBonus;
  }

  // Ensure score is bounded between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    factors,
  };
}
