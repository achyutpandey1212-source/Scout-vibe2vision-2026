import { IRankedCandidate } from '../types/scoring.types';
import { IAIPersonalizationResponse } from './ai.types';

export class FallbackPersonalization {
  /**
   * Generates a smart, deterministic fallback personalization response
   * derived from candidate scoring profiles.
   */
  static generate(top5: IRankedCandidate[]): IAIPersonalizationResponse {
    const slotNames = ['perfectMatch', 'hiddenGem', 'stretchGoal', 'quickWin', 'confidenceBuilder'];
    const recommendationsBySlot: Record<string, any> = {};

    top5.forEach((cand, idx) => {
      const slot = slotNames[idx] || `match_${idx}`;

      const reasons = cand.recommendationExplanations.map((e) => e.message);
      const reasonStr =
        reasons.length > 0
          ? reasons.join('. ') + '.'
          : `This opportunity matches your profile with a match score of ${cand.finalScore}.`;

      recommendationsBySlot[slot] = {
        personalizedReason: reasonStr.slice(0, 300),
        missingSkills: [],
        firstAction: 'Read the official application page.',
        confidenceMessage: 'You appear to meet the basic eligibility.',
      };
    });

    return {
      todayMission: "Review today's personalized recommendations.",
      aiSummary:
        'Scout selected these recommendations using your profile and deterministic ranking scoring factors.',
      recommendationsBySlot,
    };
  }
}
