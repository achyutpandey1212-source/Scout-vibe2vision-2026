import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';
import { SCORING_CONFIG } from '../config/scoring.config';
import { ScoreResult } from '../types/scoring.types';
import { cleanText } from '../../enrichment/utils/text';

/**
 * Computes the hidden opportunity score (0-100).
 * Surfaces highly-trustworthy, low-visibility/niche opportunities for students.
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
    category === 'WOMEN_IN_TECH' ||
    opp.womenFocused === true ||
    cleanText(title).includes('women') ||
    cleanText(title).includes('female') ||
    cleanText(title).includes('girl');

  if (isWomenFocused) {
    factors['womenFocusedBoost'] = SCORING_CONFIG.hiddenBoosts.womenFocusedBoost;
    score += SCORING_CONFIG.hiddenBoosts.womenFocusedBoost;
  }

  // === V2 HIDDEN GEM SCORING RULES ===

  // 1. Official verification
  const isOfficial =
    opp.sourceType === 'GOVERNMENT' ||
    opp.sourceType === 'UNIVERSITY' ||
    opp.organizationType === 'GOVERNMENT' ||
    opp.organizationType === 'UNIVERSITY';
  if (isOfficial) {
    factors['officialSourceBoost'] = 15;
    score += 15;
  }

  // 2. Less widely known (non-MNC and low/medium competition)
  const orgName = opp.intelligence?.normalizedOrganization || opp.organization || '';
  const cleanOrg = cleanText(orgName);
  const isBigTech = ['google', 'microsoft', 'amazon', 'meta', 'apple'].some((tech) =>
    cleanOrg.includes(tech),
  );
  const isLowMedCompetition =
    opp.estimatedCompetition === 'LOW' || opp.estimatedCompetition === 'MEDIUM';
  if (!isBigTech && isLowMedCompetition) {
    factors['hiddenGemOrganizationBoost'] = 15;
    score += 15;
  }

  // 3. Student-focused
  const audience = opp.audiencePersonas || [];
  const isStudentFocused = audience.some((p) => ['college-student', 'fresher'].includes(p));
  if (isStudentFocused) {
    factors['studentFocusedBoost'] = 15;
    score += 15;
  }

  // 4. High Quality Boost
  if (opp.qualityScore && opp.qualityScore >= 70) {
    factors['highQualityBoost'] = 15;
    score += 15;
  }

  // 5. Freshness/Recentness
  const daysRemaining = opp.intelligence?.daysRemaining;
  const isRecent = daysRemaining !== null && daysRemaining !== undefined && daysRemaining > 0;
  if (isRecent) {
    factors['recentOpportunityBoost'] = 15;
    score += 15;
  }

  // 6. Government internship / University research internship high score boost
  const isGovOrUniInternship =
    isOfficial &&
    (opp.opportunityType === 'INTERNSHIP' ||
      opp.category?.includes('Internship') ||
      opp.category?.includes('Research'));
  if (isGovOrUniInternship) {
    factors['govOrUniResearchInternshipBoost'] = 15;
    score += 15;
  }

  // 7. Mass-market job listings penalty
  const isMassMarket =
    cleanOrg.includes('indeed') ||
    cleanOrg.includes('naukri') ||
    cleanOrg.includes('monster') ||
    cleanOrg.includes('internshala') ||
    cleanOrg.includes('linkedin');
  if (isMassMarket) {
    factors['massMarketJobListingPenalty'] = -20;
    score -= 20;
  }

  // 8. Big Tech Penalty
  for (const [techCompany, penalty] of Object.entries(SCORING_CONFIG.hiddenBoosts.bigTechPenalty)) {
    if (cleanOrg.includes(cleanText(techCompany))) {
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
