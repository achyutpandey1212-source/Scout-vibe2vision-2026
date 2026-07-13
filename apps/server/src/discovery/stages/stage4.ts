import { IPipelineStage } from './pipeline-stage.interface';
import { Opportunity } from '../extraction/types/opportunity.types';
import { TRUSTED_SOURCES } from '../sources/registry';
import { DISCOVERY_CONFIG } from '../config/discovery.config';

export interface QualityEvaluatedOpportunity extends Opportunity {
  qualityScore: number;
  decision: 'ACCEPT' | 'REVIEW' | 'REJECT';
  positiveReasons: string[];
  penalties: string[];
  qualityBreakdown: {
    officialSource: boolean;
    deadlinePresent: boolean;
    applicationLink: boolean;
    richDescription: boolean;
    benefitsPresent: boolean;
    stipendPresent: boolean;
  };
}

export class Stage4QualityAcceptance implements IPipelineStage<
  Opportunity[],
  QualityEvaluatedOpportunity[]
> {
  /**
   * Evaluates validation, scores quality, decides acceptance, and compiles detailed analytics.
   */
  async execute(
    opportunities: Opportunity[],
    options?: any,
  ): Promise<QualityEvaluatedOpportunity[]> {
    console.log(
      `[Stage 4] Evaluating ${opportunities.length} opportunities for quality and validity...`,
    );
    const evaluated: QualityEvaluatedOpportunity[] = [];

    // Analytics accumulator structures
    let acceptedCount = 0;
    let reviewCount = 0;
    let rejectedCount = 0;

    let totalScore = 0;
    let maxScore = 0;
    let minScore = 100;

    const signalDistribution: Record<string, number> = {
      trustedDomain: 0,
      deadlinePresent: 0,
      applicationLink: 0,
      richDescription: 0,
      benefitsPresent: 0,
      stipendPresent: 0,
    };

    const penaltyDistribution: Record<string, number> = {
      missingTitle: 0,
      missingOrg: 0,
      missingDescription: 0,
      invalidApplicationUrl: 0,
      poorDescription: 0,
      noStipend: 0,
      unknownSource: 0,
    };

    const acceptThreshold = DISCOVERY_CONFIG.QUALITY.ACCEPT_THRESHOLD;
    const reviewThreshold = DISCOVERY_CONFIG.QUALITY.REVIEW_THRESHOLD;

    for (const opp of opportunities) {
      const positiveReasons: string[] = [];
      const penalties: string[] = [];

      // 1. Validation Track
      let isDataValid = true;
      if (!opp.title || opp.title.trim().length < 3) {
        isDataValid = false;
        penalties.push('Invalid title (too short or missing)');
        penaltyDistribution.missingTitle++;
      }
      if (!opp.organization || opp.organization.trim().length < 2) {
        isDataValid = false;
        penalties.push('Missing organization name');
        penaltyDistribution.missingOrg++;
      }
      if (!opp.description || opp.description.trim().length < 15) {
        isDataValid = false;
        penalties.push('Missing or extremely short description');
        penaltyDistribution.missingDescription++;
      }
      if (!opp.applicationUrl || !opp.applicationUrl.startsWith('http')) {
        isDataValid = false;
        penalties.push('Invalid or missing application URL path');
        penaltyDistribution.invalidApplicationUrl++;
      }

      // 2. Scoring Track (Capped between 0 and 100)
      const breakdown = {
        officialSource: false,
        deadlinePresent: false,
        applicationLink: false,
        richDescription: false,
        benefitsPresent: false,
        stipendPresent: false,
      };

      let score = 30; // base score

      // Check trusted sources registry
      const isTrusted = TRUSTED_SOURCES.some(
        (src) =>
          opp.organization?.toLowerCase() === src.organization.toLowerCase() ||
          opp.sourceDomain?.toLowerCase().includes(src.organization.toLowerCase()),
      );
      if (isTrusted) {
        score += 20;
        breakdown.officialSource = true;
        positiveReasons.push('Trusted organization domain verified');
        signalDistribution.trustedDomain++;
      } else {
        penalties.push('Unknown or untrusted source domain');
        penaltyDistribution.unknownSource++;
      }

      // Check deadline
      if (opp.deadline && opp.deadline.trim() !== '' && opp.deadline.toLowerCase() !== 'flexible') {
        score += 15;
        breakdown.deadlinePresent = true;
        positiveReasons.push('Explicit application deadline specified');
        signalDistribution.deadlinePresent++;
      }

      // Check application link
      if (opp.applicationUrl && opp.applicationUrl.startsWith('http')) {
        score += 20;
        breakdown.applicationLink = true;
        positiveReasons.push('Valid external application link extracted');
        signalDistribution.applicationLink++;
      }

      // Check rich description
      if (opp.description && opp.description.length > 100) {
        score += 15;
        breakdown.richDescription = true;
        positiveReasons.push('Rich detailed description available');
        signalDistribution.richDescription++;
      } else if (opp.description && opp.description.length <= 100) {
        penalties.push('Brief or low-detail description (<= 100 characters)');
        penaltyDistribution.poorDescription++;
      }

      // Check benefits/eligibility
      if (opp.eligibility || (opp.tags && opp.tags.length > 0)) {
        score += 10;
        breakdown.benefitsPresent = true;
        positiveReasons.push('Extracted structured eligibility or tags');
        signalDistribution.benefitsPresent++;
      }

      // Check stipend presence
      if (opp.stipend !== undefined && opp.stipend !== null && opp.stipend > 0) {
        score += 10;
        breakdown.stipendPresent = true;
        positiveReasons.push('Financial stipend/compensation information available');
        signalDistribution.stipendPresent++;
      } else {
        penaltyDistribution.noStipend++;
      }

      const finalScore = Math.min(100, Math.max(0, score));

      // 3. Decision Engine Track
      let decision: 'ACCEPT' | 'REVIEW' | 'REJECT' = 'REJECT';
      if (!isDataValid) {
        decision = 'REJECT';
        rejectedCount++;
      } else if (finalScore >= acceptThreshold) {
        decision = 'ACCEPT';
        acceptedCount++;
      } else if (finalScore >= reviewThreshold) {
        decision = 'REVIEW';
        reviewCount++;
      } else {
        decision = 'REJECT';
        rejectedCount++;
      }

      // Track metric stats
      totalScore += finalScore;
      maxScore = Math.max(maxScore, finalScore);
      minScore = Math.min(minScore, finalScore);

      evaluated.push({
        ...opp,
        qualityScore: finalScore,
        decision,
        positiveReasons,
        penalties,
        qualityBreakdown: breakdown,
      });
    }

    const processed = opportunities.length;
    const avgScore = processed > 0 ? Math.round((totalScore / processed) * 10) / 10 : 0;
    const acceptRate = processed > 0 ? Math.round((acceptedCount / processed) * 1000) / 10 : 0;

    console.log(`
===========================================
               QUALITY REPORT              
===========================================
Processed:              ${processed}
Accepted:               ${acceptedCount}
Review:                 ${reviewCount}
Rejected:               ${rejectedCount}

Acceptance Rate:        ${acceptRate}%
Average Score:          ${avgScore}
Highest Score:          ${processed > 0 ? maxScore : 0}
Lowest Score:           ${processed > 0 ? minScore : 0}

-------------------------------------------
Top Rejection Penalties & Warnings:
-------------------------------------------
- Unknown source organization:   ${penaltyDistribution.unknownSource}
- Invalid/short title:          ${penaltyDistribution.missingTitle}
- Invalid application URL:       ${penaltyDistribution.invalidApplicationUrl}
- Poor description length:      ${penaltyDistribution.poorDescription}
- Missing description detail:   ${penaltyDistribution.missingDescription}
- Lacks stipend details:        ${penaltyDistribution.noStipend}

-------------------------------------------
Top Positive Quality Signals:
-------------------------------------------
- Trusted domain verification:   ${signalDistribution.trustedDomain}
- Deadline date present:        ${signalDistribution.deadlinePresent}
- Direct application URL:       ${signalDistribution.applicationLink}
- Rich description detailed:     ${signalDistribution.richDescription}
- Eligibility/benefits tags:     ${signalDistribution.benefitsPresent}
- Compensated stipend detail:    ${signalDistribution.stipendPresent}
===========================================`);

    return evaluated;
  }
}
