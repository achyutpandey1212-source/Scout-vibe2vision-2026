import { OpportunityType, SourceType } from '../types/opportunity.types';

/**
 * Converts empty strings to null, trims whitespace, and standardizes formats.
 */
export function normalizeString(val: string | null | undefined): string | null {
  if (val === undefined || val === null) return null;
  const trimmed = val.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Standardizes country names (e.g. "india" -> "India").
 */
export function normalizeCountry(val: string | null | undefined): string | null {
  const norm = normalizeString(val);
  if (!norm) return null;
  const lower = norm.toLowerCase();
  if (lower === 'india' || lower === 'in') return 'India';
  return norm.charAt(0).toUpperCase() + norm.slice(1);
}

/**
 * Trims, filters out empty elements, and deduplicates lists (skills, tags).
 */
export function normalizeArray(list: string[] | null | undefined): string[] {
  if (!list || !Array.isArray(list)) return [];
  const unique = new Set<string>();
  for (const item of list) {
    const trimmed = item.trim();
    if (trimmed.length > 0) {
      unique.add(trimmed);
    }
  }
  return Array.from(unique);
}

/**
 * Helper to normalize date formats to YYYY-MM-DD when possible.
 */
export function normalizeDate(val: string | null | undefined): string | null {
  const dateStr = normalizeString(val);
  if (!dateStr) return null;

  try {
    const timestamp = Date.parse(dateStr);
    if (!isNaN(timestamp)) {
      return new Date(timestamp).toISOString().split('T')[0];
    }
  } catch {
    // Return original string if standard parsing fails, as it might be descriptive
  }
  return dateStr;
}

/**
 * Executes a full normalizer pass on the extracted opportunity details.
 */
export function normalizeOpportunity(opp: any): any {
  return {
    ...opp,
    title: opp.title?.trim() || 'Untitled Opportunity',
    description: opp.description?.trim() || '',
    summary: opp.summary?.trim() || '',
    organization: opp.organization?.trim() || 'Unknown Organization',
    opportunityType: (opp.opportunityType || 'OTHER').toUpperCase() as OpportunityType,
    category: opp.category?.trim() || 'General',
    country: normalizeCountry(opp.country),
    state: normalizeString(opp.state),
    city: normalizeString(opp.city),
    remote: !!opp.remote,
    applicationUrl: normalizeString(opp.applicationUrl),
    officialWebsite: normalizeString(opp.officialWebsite),
    deadline: normalizeDate(opp.deadline),
    startDate: normalizeDate(opp.startDate),
    endDate: normalizeDate(opp.endDate),
    salary: typeof opp.salary === 'number' ? opp.salary : null,
    stipend: typeof opp.stipend === 'number' ? opp.stipend : null,
    currency: normalizeString(opp.currency),
    duration: normalizeString(opp.duration),
    eligibility: normalizeString(opp.eligibility),
    minimumQualification: normalizeString(opp.minimumQualification),
    skills: normalizeArray(opp.skills),
    experienceLevel: normalizeString(opp.experienceLevel),
    ageLimit: typeof opp.ageLimit === 'number' ? opp.ageLimit : null,
    genderEligibility: opp.genderEligibility ? opp.genderEligibility.toUpperCase() : null,
    documentsRequired: normalizeArray(opp.documentsRequired),
    selectionProcess: normalizeString(opp.selectionProcess),
    benefits: normalizeString(opp.benefits),
    tags: normalizeArray(opp.tags),
    sourceURL: normalizeString(opp.sourceURL),
    sourceDomain: normalizeString(opp.sourceDomain),
    sourceType: (opp.sourceType || 'OTHER').toUpperCase() as SourceType,
    confidence: typeof opp.confidence === 'number' ? opp.confidence : 0.5,
  };
}
