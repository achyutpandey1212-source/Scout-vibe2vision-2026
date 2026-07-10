import { ENRICHMENT_CONFIG } from '../config/enrichment.config';
import { containsAny } from './text';

/**
 * Deterministically categorizes an opportunity using keyword matching on the title, description, and tags.
 * Falls back to 'General' if no category matches.
 */
export function categorizeOpportunity(
  title: string,
  description: string,
  tags: string[] = [],
): string {
  const combinedText = `${title} ${description} ${tags.join(' ')}`;

  // Iterate categories in the configured order
  for (const mapping of ENRICHMENT_CONFIG.categoryKeywords) {
    if (containsAny(combinedText, mapping.keywords, true)) {
      return mapping.category;
    }
  }

  return 'General';
}
