import { IRankedCandidate } from '../types/scoring.types';

export class DiversificationEngine {
  /**
   * Diversifies a ranked candidate list to select the top 5 candidates.
   * Keeps the highest-scoring candidate, and penalizes duplicates across categories,
   * organizations, domains, and work modes to select the next four, without mutating original scores.
   */
  static diversify(candidates: IRankedCandidate[], targetCount = 5): IRankedCandidate[] {
    if (candidates.length <= targetCount) {
      return [...candidates];
    }

    const selected: IRankedCandidate[] = [];
    const pool = [...candidates];

    // 1. Always select the absolute highest ranked candidate first
    const first = pool.shift();
    if (first) {
      selected.push(first);
    }

    // 2. Iteratively select remaining candidates with penalty calculation
    while (selected.length < targetCount && pool.length > 0) {
      let bestIndex = -1;
      let highestSelectionScore = -Infinity;

      for (let i = 0; i < pool.length; i++) {
        const candidate = pool[i];
        let penalty = 0;

        // Calculate penalty based on overlap with already selected items
        for (const sel of selected) {
          if (
            sel.diversificationTags.organization !== 'Unknown' &&
            sel.diversificationTags.organization === candidate.diversificationTags.organization
          ) {
            penalty += 20; // High penalty for same company
          }
          if (sel.diversificationTags.category === candidate.diversificationTags.category) {
            penalty += 12; // Moderate penalty for same opportunity type/category
          }
          if (sel.diversificationTags.domain === candidate.diversificationTags.domain) {
            penalty += 10; // Moderate penalty for same domain
          }
          if (sel.diversificationTags.workMode === candidate.diversificationTags.workMode) {
            penalty += 5; // Light penalty for same work mode
          }
        }

        const selectionScore = candidate.finalScore - penalty;
        if (selectionScore > highestSelectionScore) {
          highestSelectionScore = selectionScore;
          bestIndex = i;
        }
      }

      if (bestIndex !== -1) {
        const chosen = pool.splice(bestIndex, 1)[0];
        selected.push(chosen);
      } else {
        break;
      }
    }

    // Re-rank the selected top 5 elements based on their order of selection
    return selected.map((cand, idx) => {
      cand.rank = idx + 1;
      return cand;
    });
  }
}
