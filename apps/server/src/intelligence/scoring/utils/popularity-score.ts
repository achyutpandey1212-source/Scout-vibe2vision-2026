import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';
import { SCORING_CONFIG } from '../config/scoring.config';
import { ScoreResult } from '../types/scoring.types';
import { cleanText } from '../../enrichment/utils/text';

/**
 * Computes a popularity score estimate between 0 and 100.
 * A high score indicates many applicants/high visibility, which lowers the hidden score.
 */
export function calculatePopularityScore(opp: Opportunity): ScoreResult {
  const factors: Record<string, number> = {};
  let score = SCORING_CONFIG.popularityWeights.baseScore;
  factors['base'] = score;

  // 1. Organization popularity
  const orgName = opp.intelligence?.normalizedOrganization || opp.organization || '';
  for (const [popularOrg, weight] of Object.entries(SCORING_CONFIG.popularityWeights.orgWeights)) {
    if (cleanText(orgName).includes(cleanText(popularOrg))) {
      factors['popularOrganizationBonus'] = weight;
      score += weight;
      break;
    }
  }

  // 2. Source Type popularity
  const typeWeight = SCORING_CONFIG.popularityWeights.domainTypeWeights[opp.sourceType] || 20;
  factors['sourceTypePopularity'] = typeWeight;
  score += typeWeight;

  // 3. Application URL popularity hints (e.g. if it includes "careers", "jobs", "linkedin", "internshala")
  const url = cleanText(opp.applicationUrl || '');
  if (url.includes('careers') || url.includes('jobs')) {
    factors['careersPortalKeywordBonus'] = 10;
    score += 10;
  }
  if (url.includes('linkedin.com') || url.includes('internshala.com')) {
    factors['majorAggregatorUrlBonus'] = 15;
    score += 15;
  }

  // Ensure score is bounded between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    factors,
  };
}
