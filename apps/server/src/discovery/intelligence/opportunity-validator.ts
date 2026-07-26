import { Opportunity } from '../extraction/types/opportunity.types';
import { EligibilityFilter } from '../query-engine/eligibility-filter';
import { FreshnessFilter } from '../query-engine/freshness-filter';
import { OpportunityScorer } from './opportunity-score';
import { GoldOpportunityDetector } from './gold-opportunity-detector';

export interface ValidationResult {
  accepted: boolean;
  review: boolean;
  score: number;
  reasons: string[];
  rejectionReasonCode:
    'NON_INDIA' | 'EXPIRED' | 'LOW_QUALITY' | 'NO_APPLICATION_URL' | 'NOT_ENGINEERING' | 'none';
  signals: any;
  companyTier: number;
  isGold: boolean;
}

export class OpportunityValidator {
  /**
   * Orchestrates the complete validation pipeline for an extracted opportunity candidate.
   * Runs geo-eligibility, freshness date-checks, scoring, and returns consolidated results.
   */
  static validate(opp: Opportunity): ValidationResult {
    const reasons: string[] = [];

    // 1. Check Application URL presence
    if (!opp.applicationUrl) {
      return {
        accepted: false,
        review: false,
        score: 0,
        reasons: ['Missing application link URL'],
        rejectionReasonCode: 'NO_APPLICATION_URL',
        signals: {},
        companyTier: 3,
        isGold: false,
      };
    }

    // 2. Eligibility geographical checks
    const combinedText = `
      ${opp.title || ''}
      ${opp.description || ''}
      ${opp.eligibility || ''}
      ${opp.minimumQualification || ''}
      ${opp.benefits || ''}
    `;
    const eligibility = EligibilityFilter.isEligible(combinedText);
    if (!eligibility.eligible) {
      return {
        accepted: false,
        review: false,
        score: 0,
        reasons: [eligibility.reason || 'Failed geographical filters'],
        rejectionReasonCode: 'NON_INDIA',
        signals: {},
        companyTier: 3,
        isGold: false,
      };
    }

    // 3. Freshness checks
    const freshness = FreshnessFilter.isFresh(combinedText, opp.deadline);
    if (!freshness.fresh) {
      return {
        accepted: false,
        review: false,
        score: 0,
        reasons: [freshness.reason || 'Failed freshness check'],
        rejectionReasonCode: 'EXPIRED',
        signals: {},
        companyTier: 3,
        isGold: false,
      };
    }

    // 4. Gold Company identification
    const goldDetection = GoldOpportunityDetector.detect(
      opp.organization || '',
      opp.sourceDomain || '',
    );

    // 5. Scorer valuation
    const scoringResult = OpportunityScorer.score(opp, goldDetection.tier);

    // 6. Engineering role validity check
    const lowerTitle = opp.title.toLowerCase();
    const isEngineering =
      lowerTitle.includes('intern') ||
      lowerTitle.includes('sde') ||
      lowerTitle.includes('developer') ||
      lowerTitle.includes('engineer') ||
      lowerTitle.includes('analyst') ||
      lowerTitle.includes('hackathon') ||
      lowerTitle.includes('competition') ||
      lowerTitle.includes('challenge') ||
      lowerTitle.includes('athon') ||
      lowerTitle.includes('code') ||
      ['HACKATHON', 'COMPETITION', 'OPEN_SOURCE_PROGRAM', 'CAMPUS_AMBASSADOR'].includes(
        String(opp.opportunityType).toUpperCase(),
      ) ||
      opp.professionalDomains?.some((d) =>
        ['SOFTWARE', 'DATA_SCIENCE', 'AI_ML', 'INFRASTRUCTURE'].includes(String(d).toUpperCase()),
      );

    if (!isEngineering) {
      return {
        accepted: false,
        review: false,
        score: scoringResult.overall,
        reasons: ['Title does not match standard engineering roles'],
        rejectionReasonCode: 'NOT_ENGINEERING',
        signals: scoringResult.signals,
        companyTier: goldDetection.tier,
        isGold: goldDetection.isGold,
      };
    }

    // 7. Low quality cutoff check
    if (scoringResult.overall < 45) {
      return {
        accepted: false,
        review: false,
        score: scoringResult.overall,
        reasons: [`Low quality quality score: ${scoringResult.overall}`],
        rejectionReasonCode: 'LOW_QUALITY',
        signals: scoringResult.signals,
        companyTier: goldDetection.tier,
        isGold: goldDetection.isGold,
      };
    }

    // 8. Decide accepted vs review criteria
    const accepted = scoringResult.overall >= 60;
    const review = !accepted;

    return {
      accepted,
      review,
      score: scoringResult.overall,
      reasons,
      rejectionReasonCode: 'none',
      signals: scoringResult.signals,
      companyTier: goldDetection.tier,
      isGold: goldDetection.isGold,
    };
  }
}
export default OpportunityValidator;
