import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';
import { normalizeOrganizationName } from '../utils/organization';
import { normalizeSourceType } from '../utils/source-normalizer';
import { categorizeOpportunity } from '../utils/categorizer';
import { computeDeadlineStatus } from '../utils/deadline';
import { generateMetadata } from '../utils/metadata';

export const ENRICHMENT_VERSION = '1.0';

/**
 * Enriches a single raw Opportunity with deterministic, derived intelligence data.
 * Always produces identical output for the same input parameters (idempotent).
 *
 * @param opportunity The raw/scraped opportunity object.
 * @param referenceDateStr Optional baseline date for testing (defaults to system date).
 */
export function enrichOpportunity(
  opportunity: Opportunity,
  referenceDateStr?: string,
): Opportunity {
  // 1. Normalize Organization Name
  const normalizedOrganization = normalizeOrganizationName(opportunity.organization);

  // 2. Normalize Source Type
  const sourceType = normalizeSourceType(
    opportunity.sourceDomain,
    opportunity.sourceURL,
    opportunity.sourceType,
  );

  // 3. Categorize Opportunity
  const category = categorizeOpportunity(
    opportunity.title,
    opportunity.description,
    opportunity.tags,
  );

  // 4. Parse Deadline and compute daysRemaining / expired
  const { normalizedDeadline, daysRemaining, expired } = computeDeadlineStatus(
    opportunity.deadline,
    referenceDateStr,
  );

  // 5. Generate Metadata Object
  const metadata = generateMetadata(opportunity, normalizedDeadline);

  // 6. Return copy of Opportunity with nested intelligence
  return {
    ...opportunity,
    sourceType,
    category,
    intelligence: {
      normalizedOrganization,
      normalizedDeadline,
      daysRemaining,
      expired,
      metadata,
      version: ENRICHMENT_VERSION,
      enriched: true,
      lastEnrichedAt: new Date(),
    },
  };
}

/**
 * Enriches multiple opportunities in batch.
 */
export function enrichOpportunities(
  opportunities: Opportunity[],
  referenceDateStr?: string,
): Opportunity[] {
  return opportunities.map((opp) => enrichOpportunity(opp, referenceDateStr));
}
