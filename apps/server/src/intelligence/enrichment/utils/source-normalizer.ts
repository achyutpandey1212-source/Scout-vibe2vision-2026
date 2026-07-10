import { SourceType } from '../../../discovery/extraction/types/opportunity.types';
import { ENRICHMENT_CONFIG } from '../config/enrichment.config';
import { cleanText } from './text';

/**
 * Deterministically normalizes a domain name and returns the matched SourceType.
 * If no suffixes match, falls back to the original source type or 'COMPANY'.
 */
export function normalizeSourceType(
  sourceDomain: string | null,
  sourceURL: string | null,
  fallbackType: SourceType = 'COMPANY',
): SourceType {
  const domain = cleanText(sourceDomain || '');
  const url = cleanText(sourceURL || '');

  // 1. Search mappings by domain or url match
  for (const mapping of ENRICHMENT_CONFIG.domainSourceMappings) {
    for (const suffix of mapping.suffixes) {
      if (domain.endsWith(suffix) || domain.includes(suffix) || url.includes(suffix)) {
        return mapping.sourceType;
      }
    }
  }

  // 2. Fallbacks based on common domain prefixes or keywords
  if (domain.includes('gov') || url.includes('.gov')) {
    return 'GOVERNMENT';
  }
  if (
    domain.includes('edu') ||
    domain.includes('.ac') ||
    url.includes('.edu') ||
    url.includes('.ac.')
  ) {
    return 'UNIVERSITY';
  }
  if (domain.includes('org') || url.includes('.org')) {
    return 'NGO';
  }

  return fallbackType;
}
