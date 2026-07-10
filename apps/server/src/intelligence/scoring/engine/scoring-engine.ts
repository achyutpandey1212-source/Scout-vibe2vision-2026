import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';
import { calculateTrustScore } from '../utils/trust-score';
import { calculatePopularityScore } from '../utils/popularity-score';
import { calculateHiddenScore } from '../utils/hidden-score';
import { calculateQualityScore } from '../utils/quality-score';

/**
 * Evaluates an opportunity deterministically, calculating Trust, Popularity,
 * Hidden, and Quality scores, alongside explainable breakdowns.
 */
export function scoreOpportunity(opportunity: Opportunity): Opportunity {
  // Ensure the intelligence object exists before appending scores
  const intelligence = opportunity.intelligence || {
    normalizedOrganization: opportunity.organization || null,
    normalizedDeadline: null,
    daysRemaining: null,
    expired: false,
    metadata: null,
    version: '1.0',
    enriched: false,
    lastEnrichedAt: null,
  };

  // 1. Calculate Trust
  const trustResult = calculateTrustScore(opportunity);

  // 2. Calculate Popularity
  const popularityResult = calculatePopularityScore(opportunity);

  // 3. Calculate Hidden
  const hiddenResult = calculateHiddenScore(opportunity, trustResult.score, popularityResult.score);

  // 4. Calculate Quality
  const qualityResult = calculateQualityScore(opportunity);

  // 5. Build modified opportunity
  return {
    ...opportunity,
    intelligence: {
      ...intelligence,
      scores: {
        trust: trustResult.score,
        popularity: popularityResult.score,
        hidden: hiddenResult.score,
        quality: qualityResult.score,
      },
      scoreBreakdown: {
        trustFactors: trustResult.factors,
        popularityFactors: popularityResult.factors,
        hiddenFactors: hiddenResult.factors,
        qualityFactors: qualityResult.factors,
      },
    },
  };
}

/**
 * Evaluates multiple opportunities in batch.
 */
export function scoreOpportunities(opportunities: Opportunity[]): Opportunity[] {
  return opportunities.map((opp) => scoreOpportunity(opp));
}
