import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';
import { ENRICHMENT_CONFIG } from '../config/enrichment.config';
import { containsAny } from './text';

export interface EnrichedMetadata {
  country: string | null;
  state: string | null;
  city: string | null;
  isGovernment: boolean;
  isRemote: boolean;
  isPaid: boolean;
  hasDeadline: boolean;
  requiresResume: boolean;
  requiresPortfolio: boolean;
  requiresExperience: boolean;
  requiresDegree: boolean;
}

/**
 * Deterministically generates derived metadata for an opportunity based on text patterns and URLs.
 */
export function generateMetadata(
  opp: Opportunity,
  parsedDeadline: string | null,
): EnrichedMetadata {
  const title = opp.title || '';
  const desc = opp.description || '';
  const bodyText = `${title} ${desc} ${opp.eligibility || ''} ${opp.benefits || ''} ${opp.tags.join(' ')}`;
  const urlText = `${opp.sourceURL || ''} ${opp.applicationUrl || ''} ${opp.officialWebsite || ''}`;

  // 1. Detect Country
  let country: string | null = opp.country || null;
  if (!country) {
    const textToSearch = `${bodyText} ${urlText}`.toLowerCase();
    for (const [countryName, keywords] of Object.entries(
      ENRICHMENT_CONFIG.metadataKeywords.countries,
    )) {
      if (containsAny(textToSearch, keywords, true)) {
        country = countryName;
        break;
      }
    }
  }

  // 2. Government status
  const isGovDomain = urlText.includes('.gov') || urlText.includes('.nic.in');
  const hasGovKeywords = containsAny(bodyText, ENRICHMENT_CONFIG.metadataKeywords.government, true);
  const isGovernment = isGovDomain || hasGovKeywords || opp.sourceType === 'GOVERNMENT';

  // 3. Remote status
  const hasRemoteKeywords = containsAny(bodyText, ENRICHMENT_CONFIG.metadataKeywords.remote, true);
  const isRemote = opp.remote === true || hasRemoteKeywords;

  // 4. Paid status
  const hasSalaryOrStipend =
    (opp.salary !== null && opp.salary > 0) || (opp.stipend !== null && opp.stipend > 0);
  const hasPaidKeywords = containsAny(
    bodyText,
    ENRICHMENT_CONFIG.metadataKeywords.paidStipend,
    true,
  );
  const isPaid = hasSalaryOrStipend || hasPaidKeywords;

  // 5. Has deadline
  const hasDeadline = parsedDeadline !== null;

  // 6. Resume, Portfolio, Experience, Degree requirements
  const requiresResume = containsAny(bodyText, ENRICHMENT_CONFIG.metadataKeywords.resume, true);
  const requiresPortfolio = containsAny(
    bodyText,
    ENRICHMENT_CONFIG.metadataKeywords.portfolio,
    true,
  );
  const requiresExperience = containsAny(
    bodyText,
    ENRICHMENT_CONFIG.metadataKeywords.experience,
    true,
  );
  const requiresDegree = containsAny(bodyText, ENRICHMENT_CONFIG.metadataKeywords.degree, true);

  return {
    country,
    state: opp.state || null,
    city: opp.city || null,
    isGovernment,
    isRemote,
    isPaid,
    hasDeadline,
    requiresResume,
    requiresPortfolio,
    requiresExperience,
    requiresDegree,
  };
}
