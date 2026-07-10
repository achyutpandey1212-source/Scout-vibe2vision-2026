import { Opportunity } from '../../discovery/extraction/types/opportunity.types';

export interface ValidationResult {
  success: boolean;
  errors: string[];
}

/**
 * Validates the scoring and normalization fields of an enriched opportunity.
 * Returns success boolean and list of errors.
 */
export function validateOpportunity(opp: Opportunity, expectedVersion: string): ValidationResult {
  const errors: string[] = [];

  const intel = opp.intelligence;
  if (!intel) {
    errors.push('Opportunity lacks intelligence object');
    return { success: false, errors };
  }

  // 1. Verify basic flags
  if (!intel.enriched) {
    errors.push('Enriched flag is false');
  }

  if (intel.version !== expectedVersion) {
    errors.push(`Version mismatch. Expected ${expectedVersion}, got ${intel.version}`);
  }

  // 2. Verify score ranges
  const scores = intel.scores;
  if (!scores) {
    errors.push('Scores object is missing');
  } else {
    const list = [
      { name: 'trust', val: scores.trust },
      { name: 'popularity', val: scores.popularity },
      { name: 'hidden', val: scores.hidden },
      { name: 'quality', val: scores.quality },
    ];
    for (const item of list) {
      if (typeof item.val !== 'number' || isNaN(item.val)) {
        errors.push(`${item.name} score is not a number`);
      } else if (item.val < 0 || item.val > 100) {
        errors.push(`${item.name} score is out of bounds (0-100): ${item.val}`);
      }
    }
  }

  // 3. Verify breakdowns exist
  if (!intel.scoreBreakdown) {
    errors.push('Score breakdowns are missing');
  } else {
    if (!intel.scoreBreakdown.trustFactors) errors.push('Trust factors breakdown is missing');
    if (!intel.scoreBreakdown.popularityFactors)
      errors.push('Popularity factors breakdown is missing');
    if (!intel.scoreBreakdown.hiddenFactors) errors.push('Hidden factors breakdown is missing');
    if (!intel.scoreBreakdown.qualityFactors) errors.push('Quality factors breakdown is missing');
  }

  // 4. Verify tags have no duplicates
  if (opp.tags && Array.isArray(opp.tags)) {
    const uniqTags = new Set(opp.tags);
    if (uniqTags.size !== opp.tags.length) {
      errors.push('Opportunity tags list contains duplicate entries');
    }
  }

  // 5. Verify URL structures are not malformed
  const checkUrl = (url: string | null, name: string) => {
    if (!url) return;
    try {
      new URL(url);
    } catch {
      errors.push(`Malformed URL in ${name}: "${url}"`);
    }
  };
  checkUrl(opp.sourceURL, 'sourceURL');
  checkUrl(opp.applicationUrl, 'applicationUrl');
  checkUrl(opp.officialWebsite, 'officialWebsite');

  return {
    success: errors.length === 0,
    errors,
  };
}
