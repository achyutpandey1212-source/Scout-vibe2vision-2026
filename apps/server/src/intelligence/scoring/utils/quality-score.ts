import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';
import { SCORING_CONFIG } from '../config/scoring.config';
import { ScoreResult } from '../types/scoring.types';

/**
 * Computes a quality score between 0 and 100.
 * Rewards data completeness, student eligibility, freshness, and official student opportunity types.
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

  // === V2 QUALITY SCORES (STUDENT-FIRST ALIGNMENT) ===
  const audience = opp.audiencePersonas || [];
  const hasStudentAudience = audience.some((p) =>
    ['college-student', 'fresher', 'graduate'].includes(p),
  );
  if (hasStudentAudience) {
    factors['studentEligibilityBonus'] = 15;
    score += 15;
  }

  const isOfficial =
    opp.sourceType === 'GOVERNMENT' ||
    opp.sourceType === 'UNIVERSITY' ||
    opp.organizationType === 'GOVERNMENT' ||
    opp.organizationType === 'UNIVERSITY';
  if (isOfficial) {
    factors['officialOrganizationBonus'] = 15;
    score += 15;
  }

  // Freshness (e.g. if deadline is active and has days remaining or is recently discovered)
  const isFresh = opp.intelligence?.daysRemaining && opp.intelligence.daysRemaining > 0;
  if (isFresh) {
    factors['freshnessBonus'] = 10;
    score += 10;
  }

  // Specific student opportunity type
  const isStudentType =
    ['INTERNSHIP', 'SCHOLARSHIP', 'COMPETITION'].includes(opp.opportunityType || '') ||
    [
      'Government Internship',
      'Research Internship',
      'Student Competition',
      'Summer School',
      'Bootcamp',
      'Open Source Program',
    ].includes(opp.category || '');
  if (isStudentType) {
    factors['studentOpportunityTypeBonus'] = 15;
    score += 15;
  }

  // Government internship specific bonus
  const isGovInternship =
    (opp.sourceType === 'GOVERNMENT' || opp.organizationType === 'GOVERNMENT') &&
    (opp.opportunityType === 'INTERNSHIP' || opp.category?.includes('Internship'));
  if (isGovInternship) {
    factors['governmentInternshipBonus'] = 15;
    score += 15;
  }

  // === PENALTIES ===
  // Mid-level jobs or senior hiring
  const isMidSenior =
    opp.experienceRequired === 'EXPERIENCED' ||
    (opp.experienceLevel && /mid|senior|experienced|lead/i.test(opp.experienceLevel)) ||
    /mid|senior|experienced|lead/i.test(opp.title || '');
  if (isMidSenior) {
    factors['midSeniorPenalty'] = -25;
    score -= 25;
  }

  // Generic recruitment or walk-in interviews
  const titleAndDesc = ((opp.title || '') + ' ' + (opp.description || '')).toLowerCase();
  const isGenericWalkin =
    titleAndDesc.includes('walk-in') ||
    titleAndDesc.includes('walkin') ||
    titleAndDesc.includes('recruitment drive') ||
    titleAndDesc.includes('mass hiring');
  if (isGenericWalkin) {
    factors['genericRecruitmentPenalty'] = -15;
    score -= 15;
  }

  // Non-engineering opportunities
  const hasNonEngineeringKeywords = /tailoring|sewing|beautician|makeup|nursing/i.test(
    titleAndDesc,
  );
  if (hasNonEngineeringKeywords) {
    factors['nonEngineeringPenalty'] = -25;
    score -= 25;
  }

  // Ensure score is bounded between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    factors,
  };
}
