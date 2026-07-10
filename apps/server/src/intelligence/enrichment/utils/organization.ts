import { ENRICHMENT_CONFIG } from '../config/enrichment.config';
import { cleanText, normalizeWhitespace } from './text';

/**
 * Normalizes and standardizes organization names based on config aliases
 * and generic corporate suffix cleaning.
 */
export function normalizeOrganizationName(orgName: string | null): string | null {
  if (!orgName) return null;

  const cleanedInput = cleanText(orgName);

  // 1. Check mapped aliases
  for (const mapping of ENRICHMENT_CONFIG.organizationAliases) {
    for (const alias of mapping.aliases) {
      if (cleanText(alias) === cleanedInput) {
        return mapping.standardName;
      }
    }
  }

  // 2. Fallback: Generic corporate suffix cleanups
  // Matches "Inc.", "LLC", "Ltd", "Corp", etc., at the end of the string
  let cleaned = orgName
    .replace(/\b(llc|inc|corp|co|ltd|limited|corporation|careers|india|global)\b\.?/gi, '')
    .trim();

  // Remove trailing commas, dots, dashes
  cleaned = cleaned.replace(/[,.\-\s]+$/, '').trim();
  cleaned = normalizeWhitespace(cleaned);

  return cleaned || orgName;
}
