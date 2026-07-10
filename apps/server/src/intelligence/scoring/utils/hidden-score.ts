import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';
import { SCORING_CONFIG } from '../config/scoring.config';
import { ScoreResult } from '../types/scoring.types';
import { cleanText } from '../../enrichment/utils/text';

/**
 * Computes the hidden opportunity score (0-100).
 * Surfacess highly-trustworthy, low-visibility/niche opportunities.
 */
export function calculateHiddenScore(
  opp: Opportunity,
  trustScore: number,
  popularityScore: number,
): ScoreResult {
  const factors: Record<string, number> = {};
  let score = SCORING_CONFIG.hiddenBoosts.baseScore;
  factors['base'] = score;

  // 1. Low Popularity Reward: lower popularity = higher hidden score
  const popularityBonus = Math.round(
    (100 - popularityScore) * SCORING_CONFIG.hiddenBoosts.lowPopularityMultiplier,
  );
  factors['lowPopularityBonus'] = popularityBonus;
  score += popularityBonus;

  // 2. High Trust Boost: We only reward hidden opportunities if they are trustworthy
  if (trustScore >= 70) {
    const trustBonus = Math.round((trustScore - 70) * 0.5);
    if (trustBonus > 0) {
      factors['highTrustBonus'] = trustBonus;
      score += trustBonus;
    }
  }

  // 3. Women-Focused Boost
  const category = opp.category || '';
  const title = opp.title || '';
  const isWomenFocused =
    category === 'Women Empowerment' ||
    cleanText(title).includes('women') ||
    cleanText(title).includes('female') ||
    cleanText(title).includes('girl');

  if (isWomenFocused) {
    factors['womenFocusedBoost'] = SCORING_CONFIG.hiddenBoosts.womenFocusedBoost;
    score += SCORING_CONFIG.hiddenBoosts.womenFocusedBoost;
  }

  // 4. Government Scheme Boost
  if (opp.sourceType === 'GOVERNMENT') {
    factors['governmentSchemeBoost'] = SCORING_CONFIG.hiddenBoosts.governmentSchemeBoost;
    score += SCORING_CONFIG.hiddenBoosts.governmentSchemeBoost;
  }

  // 5. NGO Boost
  if (opp.sourceType === 'NGO') {
    factors['ngoBoost'] = SCORING_CONFIG.hiddenBoosts.ngoBoost;
    score += SCORING_CONFIG.hiddenBoosts.ngoBoost;
  }

  // 6. Scholarship/Fellowship Boost
  if (opp.opportunityType === 'SCHOLARSHIP' || opp.opportunityType === 'FELLOWSHIP') {
    factors['scholarshipBoost'] = SCORING_CONFIG.hiddenBoosts.scholarshipBoost;
    score += SCORING_CONFIG.hiddenBoosts.scholarshipBoost;
  }

  // 7. Big Tech/Popular Corporate Penalty (e.g. Google, Microsoft, Amazon, Meta, Apple)
  const orgName = opp.intelligence?.normalizedOrganization || opp.organization || '';
  for (const [techCompany, penalty] of Object.entries(SCORING_CONFIG.hiddenBoosts.bigTechPenalty)) {
    if (cleanText(orgName).includes(cleanText(techCompany))) {
      factors['popularCorporatePenalty'] = -penalty;
      score -= penalty;
      break;
    }
  }

  // Ensure score is bounded between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    factors,
  };
}
