import { OpportunityType, SourceType } from '../types/opportunity.types';

/**
 * Converts empty strings to null, trims whitespace, and standardizes formats safely.
 */
export function normalizeString(val: any): string | null {
  if (val === undefined || val === null) return null;
  if (typeof val !== 'string') {
    try {
      const converted = String(val).trim();
      return converted.length === 0 ? null : converted;
    } catch {
      return null;
    }
  }
  const trimmed = val.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Standardizes country names (e.g. "india" -> "India").
 */
export function normalizeCountry(val: any): string | null {
  const norm = normalizeString(val);
  if (!norm) return null;
  const lower = norm.toLowerCase();
  if (lower === 'india' || lower === 'in') return 'India';
  return norm.charAt(0).toUpperCase() + norm.slice(1);
}

/**
 * Trims, filters out empty elements, and deduplicates lists (skills, tags) safely.
 */
export function normalizeArray(list: any): string[] {
  if (!list) return [];

  let arrayToProcess: any[] = [];
  if (Array.isArray(list)) {
    arrayToProcess = list;
  } else if (typeof list === 'string') {
    // If it's a comma-separated string, split it
    arrayToProcess = list.split(',').map((s) => s.trim());
  } else {
    try {
      arrayToProcess = [String(list)];
    } catch {
      return [];
    }
  }

  const unique = new Set<string>();
  for (const item of arrayToProcess) {
    const norm = normalizeString(item);
    if (norm) {
      unique.add(norm);
    }
  }
  return Array.from(unique);
}

/**
 * Helper to normalize date formats to YYYY-MM-DD when possible.
 */
export function normalizeDate(val: any): string | null {
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
  if (!opp || typeof opp !== 'object') {
    opp = {};
  }

  // Normalize audience and intelligence lists
  const audiencePersonas = normalizeArray(opp.audiencePersonas).map((item) =>
    item.toLowerCase().trim(),
  ) as any[];

  const educationEligibility = normalizeArray(opp.educationEligibility);
  const professionalDomains = normalizeArray(opp.professionalDomains).map((item) =>
    item.toLowerCase().trim(),
  );

  const expRequiredRaw = normalizeString(opp.experienceRequired);
  const experienceRequired = expRequiredRaw ? (expRequiredRaw.toUpperCase().trim() as any) : null;

  const fundTypeRaw = normalizeString(opp.fundingType);
  const fundingType = fundTypeRaw ? (fundTypeRaw.toUpperCase().trim() as any) : null;

  const estCompRaw = normalizeString(opp.estimatedCompetition);
  const estimatedCompetition = estCompRaw ? (estCompRaw.toUpperCase().trim() as any) : null;

  const orgTypeRaw = normalizeString(opp.organizationType);
  const organizationType = orgTypeRaw ? (orgTypeRaw.toUpperCase().trim() as any) : null;

  const searchCategory = normalizeString(opp.searchCategory);

  const oppVertRaw = normalizeString(opp.opportunityVertical);
  const opportunityVertical = oppVertRaw ? (oppVertRaw.toUpperCase().trim() as any) : null;

  const appDiffRaw = normalizeString(opp.applicationDifficulty);
  const applicationDifficulty = appDiffRaw ? (appDiffRaw.toUpperCase().trim() as any) : null;

  const opportunityTypeRaw = normalizeString(opp.opportunityType);
  const opportunityType = (opportunityTypeRaw || 'OTHER').toUpperCase() as OpportunityType;

  const sourceTypeRaw = normalizeString(opp.sourceType);
  const sourceType = (sourceTypeRaw || 'OTHER').toUpperCase() as SourceType;

  return {
    ...opp,
    title: normalizeString(opp.title) || 'Untitled Opportunity',
    description: normalizeString(opp.description) || '',
    summary: normalizeString(opp.summary) || '',
    organization: normalizeString(opp.organization) || 'Unknown Organization',
    opportunityType,
    category: normalizeString(opp.category) || 'General',
    country: normalizeCountry(opp.country),
    state: normalizeString(opp.state),
    city: normalizeString(opp.city),
    remote: opp.remote === true || String(opp.remote).toLowerCase() === 'true',
    applicationUrl: normalizeString(opp.applicationUrl),
    officialWebsite: normalizeString(opp.officialWebsite),
    deadline: normalizeDate(opp.deadline),
    startDate: normalizeDate(opp.startDate),
    endDate: normalizeDate(opp.endDate),
    salary:
      typeof opp.salary === 'number'
        ? opp.salary
        : isNaN(Number(opp.salary))
          ? null
          : Number(opp.salary),
    stipend:
      typeof opp.stipend === 'number'
        ? opp.stipend
        : isNaN(Number(opp.stipend))
          ? null
          : Number(opp.stipend),
    currency: normalizeString(opp.currency),
    duration: normalizeString(opp.duration),
    eligibility: normalizeString(opp.eligibility),
    minimumQualification: normalizeString(opp.minimumQualification),
    skills: normalizeArray(opp.skills),
    experienceLevel: normalizeString(opp.experienceLevel),
    ageLimit:
      typeof opp.ageLimit === 'number'
        ? opp.ageLimit
        : isNaN(Number(opp.ageLimit))
          ? null
          : Number(opp.ageLimit),
    genderEligibility: opp.genderEligibility ? String(opp.genderEligibility).toUpperCase() : null,
    documentsRequired: normalizeArray(opp.documentsRequired),
    selectionProcess: normalizeString(opp.selectionProcess),
    benefits: normalizeString(opp.benefits),
    tags: normalizeArray(opp.tags),
    sourceURL: normalizeString(opp.sourceURL),
    sourceDomain: normalizeString(opp.sourceDomain),
    sourceType,
    confidence: typeof opp.confidence === 'number' ? opp.confidence : 0.5,

    // Classifications normalized
    audiencePersonas,
    educationEligibility,
    professionalDomains,
    experienceRequired,
    fundingType,
    estimatedCompetition,
    organizationType,
    searchCategory,
    opportunityVertical,
    applicationDifficulty,
  };
}
