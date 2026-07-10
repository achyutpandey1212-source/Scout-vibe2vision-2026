import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';
import { SCORING_CONFIG } from '../config/scoring.config';
import { ScoreResult } from '../types/scoring.types';
import { cleanText } from '../../enrichment/utils/text';

/**
 * Computes a deterministic trust score between 0 and 100.
 */
export function calculateTrustScore(opp: Opportunity): ScoreResult {
  const factors: Record<string, number> = {};
  const domain = cleanText(opp.sourceDomain || '');
  const url = cleanText(opp.sourceURL || '');

  let score = SCORING_CONFIG.trustWeights.baseScore;
  factors['base'] = score;

  // 1. Direct Trusted Domain Match
  let isDirectMatch = false;
  for (const [trustedDomain, weight] of Object.entries(
    SCORING_CONFIG.trustWeights.trustedDomains,
  )) {
    if (domain === trustedDomain || domain.endsWith('.' + trustedDomain)) {
      const diff = weight - score;
      factors['officialDomainBonus'] = diff;
      score = weight;
      isDirectMatch = true;
      break;
    }
  }

  if (!isDirectMatch) {
    // 2. Government suffix check
    const isGov =
      SCORING_CONFIG.trustWeights.governmentSuffixes.some(
        (suffix) => domain.endsWith(suffix) || url.includes(suffix),
      ) || opp.sourceType === 'GOVERNMENT';

    if (isGov) {
      const diff = 100 - score;
      factors['governmentDomainBonus'] = diff;
      score = 100;
    } else {
      // 3. University suffix check
      const isUni =
        SCORING_CONFIG.trustWeights.universitySuffixes.some(
          (suffix) => domain.endsWith(suffix) || url.includes(suffix),
        ) || opp.sourceType === 'UNIVERSITY';

      if (isUni) {
        const diff = 95 - score;
        factors['universityDomainBonus'] = diff;
        score = 95;
      } else {
        // 4. Trusted Aggregators check
        const isAggregator = SCORING_CONFIG.trustWeights.trustedAggregators.some(
          (agg) => domain.includes(agg) || url.includes(agg),
        );

        if (isAggregator) {
          const diff = 85 - score;
          factors['trustedPlatformBonus'] = diff;
          score = 85;
        } else {
          // 5. NGO check
          const isNgo =
            SCORING_CONFIG.trustWeights.ngoSuffixes.some(
              (suffix) => domain.endsWith(suffix) || url.includes(suffix),
            ) || opp.sourceType === 'NGO';

          if (isNgo) {
            const diff = 80 - score;
            factors['ngoBonus'] = diff;
            score = 80;
          }
        }
      }
    }

    // 6. Penalties for blogs and untrusted domains
    const isUntrusted = SCORING_CONFIG.trustWeights.untrustedDomains.some(
      (untrusted) => domain.includes(untrusted) || url.includes(untrusted),
    );
    if (isUntrusted) {
      const penalty = -35;
      factors['untrustedDomainPenalty'] = penalty;
      score += penalty;
    } else {
      const isBlog = SCORING_CONFIG.trustWeights.blogDomains.some(
        (blog) => domain.endsWith(blog) || url.includes(blog),
      );
      if (isBlog) {
        const penalty = -25;
        factors['blogDomainPenalty'] = penalty;
        score += penalty;
      }
    }
  }

  // Ensure score is bounded between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    factors,
  };
}
