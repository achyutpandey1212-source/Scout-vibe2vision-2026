import { Opportunity } from '../extraction/types/opportunity.types';
import { TRUSTED_SOURCES } from '../sources/registry';

export interface QualityScorerResult {
  score: number;
  breakdown: {
    officialSource: boolean;
    deadlinePresent: boolean;
    applicationLink: boolean;
    womenFocused: boolean;
    descriptionComplete: boolean;
  };
  shouldReject: boolean;
}

export class QualityScorer {
  /**
   * Calculates opportunity quality score between 0 and 100.
   * Criterias:
   * - Base points: 30
   * - Official Source match: +15
   * - Deadline present: +15
   * - Valid application link: +20
   * - Complete description (>100 chars): +15
   * - Women focused (Bonus): +20
   * Cap total at 100. Rejects if score < 60.
   */
  static evaluate(opp: Partial<Opportunity>): QualityScorerResult {
    const breakdown = {
      officialSource: false,
      deadlinePresent: false,
      applicationLink: false,
      womenFocused: false,
      descriptionComplete: false,
    };

    // 1. Official Source check
    const matchedSource = TRUSTED_SOURCES.find(
      (src) =>
        opp.organization?.toLowerCase() === src.organization.toLowerCase() ||
        opp.sourceDomain?.toLowerCase().includes(src.organization.toLowerCase()),
    );
    if (matchedSource && matchedSource.trustScore >= 90) {
      breakdown.officialSource = true;
    }

    // 2. Deadline check
    if (opp.deadline && opp.deadline.trim() !== '' && opp.deadline.toLowerCase() !== 'flexible') {
      breakdown.deadlinePresent = true;
    }

    // 3. Application Link check
    if (
      opp.applicationUrl &&
      opp.applicationUrl.trim() !== '' &&
      opp.applicationUrl.startsWith('http')
    ) {
      breakdown.applicationLink = true;
    }

    // 4. Women-focused check
    const genderElig = opp.genderEligibility?.toUpperCase();
    const isWomenFocused =
      genderElig === 'FEMALE' ||
      opp.genderEligibility?.toLowerCase().includes('women') ||
      opp.tags?.some(
        (t) => t.toLowerCase().includes('women') || t.toLowerCase().includes('female'),
      ) ||
      opp.title?.toLowerCase().includes('women') ||
      opp.title?.toLowerCase().includes('girl');
    if (isWomenFocused) {
      breakdown.womenFocused = true;
    }

    // 5. Description completeness check
    if (opp.description && opp.description.trim().length > 100) {
      breakdown.descriptionComplete = true;
    }

    // Score Calculation
    let score = 30; // base points
    if (breakdown.officialSource) score += 15;
    if (breakdown.deadlinePresent) score += 15;
    if (breakdown.applicationLink) score += 20;
    if (breakdown.descriptionComplete) score += 15;
    if (breakdown.womenFocused) score += 20;

    const finalScore = Math.min(score, 100);
    const shouldReject = finalScore < 60;

    return {
      score: finalScore,
      breakdown,
      shouldReject,
    };
  }
}
