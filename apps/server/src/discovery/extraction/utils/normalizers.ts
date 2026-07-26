import { ExperienceRequired } from '../types/opportunity.types';

// Deterministic organization mapping for known domain blocks
const KNOWN_ORGANIZATIONS: Record<string, string> = {
  'google.com': 'Google',
  'buildyourfuture.withgoogle.com': 'Google',
  'microsoft.com': 'Microsoft',
  'careers.microsoft.com': 'Microsoft',
  'amazon.jobs': 'Amazon',
  'amazon.com': 'Amazon',
  'nvidia.com': 'NVIDIA',
  'anitab.org': 'AnitaB.org',
  'ghc.anitab.org': 'Grace Hopper Celebration',
  'womentechmakers.com': 'Women Techmakers',
  'womenwhocode.com': 'Women Who Code',
  'devfolio.co': 'Devfolio',
  'mlh.io': 'MLH',
  'unstop.com': 'Unstop',
  'cern.ch': 'CERN',
  'careers.cern': 'CERN',
  'isro.gov.in': 'ISRO',
  'daad.de': 'DAAD',
  'erasmus-plus.ec.europa.eu': 'Erasmus+',
  'obamaorg.org': 'Obama Foundation',
  'obamafoundation.org': 'Obama Foundation',
  'foundation.mozilla.org': 'Mozilla Foundation',
  'mozilla.org': 'Mozilla Foundation',
};

// Common organization suffixes to strip out.
// NOTE: We intentionally do NOT strip Private, Limited, Pvt — these are part of
// Indian company names like "Skillsflick Private Limited" and must be preserved.
const CORPORATE_SUFFIXES = [
  /\bLLC\b/gi,
  /\bInc\.?$/gi,
  /\bCorp\.?$/gi,
  /\bCorporation\b/gi,
  /\bCareers\b/gi,
  /\bJobs\b/gi,
  /\bRecruitment\b/gi,
  /\bPortal\b/gi,
];

const OPPORTUNITY_TYPE_TO_CATEGORY: Record<string, string> = {
  INTERNSHIP: 'INTERNSHIPS',
  STARTUP_INTERNSHIP: 'STARTUP_INTERNSHIPS',
  GOVERNMENT_INTERNSHIP: 'GOVERNMENT_INTERNSHIP',
  RESEARCH_INTERNSHIP: 'RESEARCH_INTERNSHIP',
  HACKATHON: 'HACKATHONS',
  COMPETITION: 'HACKATHONS',
  OPEN_SOURCE_PROGRAM: 'OPEN_SOURCE_PROGRAM',
  CAMPUS_AMBASSADOR: 'CAMPUS_AMBASSADOR',
  SCHOLARSHIP: 'SCHOLARSHIPS',
  SUMMER_SCHOOL: 'SUMMER_SCHOOL',
  BOOTCAMP: 'BOOTCAMP',
  FELLOWSHIP: 'FELLOWSHIPS',
  WOMEN_IN_TECH: 'WOMEN_IN_TECH',
};

function deriveCategory(opportunityType: string): string {
  return OPPORTUNITY_TYPE_TO_CATEGORY[opportunityType] || 'INTERNSHIPS';
}

/**
 * Recursively cleans raw JSON extracted from LLM model output.
 * Normalizes string literals "null", "NULL", "None", "N/A", "na", "", "undefined" to actual null.
 */
export function cleanRawExtractedJson(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    const lower = trimmed.toLowerCase();
    if (
      trimmed.length === 0 ||
      lower === 'null' ||
      lower === 'none' ||
      lower === 'n/a' ||
      lower === 'na' ||
      lower === 'undefined'
    ) {
      return null;
    }
    return trimmed;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanRawExtractedJson).filter((item) => item !== null);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, val] of Object.entries(obj)) {
      cleaned[key] = cleanRawExtractedJson(val);
    }
    return cleaned;
  }
  return obj;
}

/**
 * Converts empty strings, "null", "N/A", "None" to null, trims whitespace, and standardizes formats safely.
 */
export function normalizeString(val: any): string | null {
  if (val === undefined || val === null) return null;
  if (typeof val !== 'string') {
    try {
      const converted = String(val).trim();
      const lower = converted.toLowerCase();
      if (
        converted.length === 0 ||
        lower === 'null' ||
        lower === 'none' ||
        lower === 'n/a' ||
        lower === 'na' ||
        lower === 'undefined'
      ) {
        return null;
      }
      return converted;
    } catch {
      return null;
    }
  }
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  if (
    trimmed.length === 0 ||
    lower === 'null' ||
    lower === 'none' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'undefined'
  ) {
    return null;
  }
  return trimmed;
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
 * Helper to normalize date formats to YYYY-MM-DD or standard placeholders (Rolling, etc.)
 */
export function normalizeDate(val: any): string | null {
  const dateStr = normalizeString(val);
  if (!dateStr) return null;

  const lower = dateStr.toLowerCase().trim();

  // Recognized rolling/status placeholders
  if (lower.includes('rolling') || lower.includes('always open') || lower.includes('ongoing')) {
    return 'Rolling';
  }
  if (lower.includes('filled') || lower.includes('open until filled')) {
    return 'Open until filled';
  }
  if (lower.includes('not announced') || lower.includes('tba') || lower.includes('tbd')) {
    return 'Deadline not announced';
  }

  try {
    // Force UTC timezone context for non-ISO textual strings to avoid local timezone offset shifts
    let cleanStr = dateStr;
    if (!dateStr.includes('T') && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // Append GMT suffix if not already present
      if (!/gmt|utc/i.test(dateStr)) {
        cleanStr = `${dateStr} GMT`;
      }
    }
    const timestamp = Date.parse(cleanStr);
    if (!isNaN(timestamp)) {
      const d = new Date(timestamp);
      // Format as YYYY-MM-DD using UTC values to avoid local timezone offset shifting the day
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fail-through
  }

  // Regex fallback: try parsing formats like "30 Aug", "30 August 2026", "Aug 30, 2026"
  try {
    const currentYear = new Date().getFullYear();
    // Parse "DD Month YYYY" or "DD Month" (e.g., 30 August, 30th Aug 2026)
    const match = dateStr.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?/i);
    if (match) {
      const dayNum = parseInt(match[1], 10);
      const monthStr = match[2];
      const yearNum = match[3] ? parseInt(match[3], 10) : currentYear;

      const testDateStr = `${monthStr} ${dayNum}, ${yearNum} GMT`;
      const ts = Date.parse(testDateStr);
      if (!isNaN(ts)) {
        const d = new Date(ts);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  } catch {
    // Silently fall through
  }

  // If not standard parseable and not a status placeholder, return null to clear dirty formats
  return null;
}

/**
 * Deterministically normalizes organization names by domain and stripping corporate suffixes.
 */
export function normalizeOrganization(org: any, domain: string | null): string {
  const orgStr = normalizeString(org);
  const cleanDomain = domain
    ? domain
        .toLowerCase()
        .replace(/^www\./, '')
        .trim()
    : '';

  if (cleanDomain && KNOWN_ORGANIZATIONS[cleanDomain]) {
    return KNOWN_ORGANIZATIONS[cleanDomain];
  }

  // Only use job board domain name as organization fallback if the parsed organization is empty or invalid
  const hasValidOrg =
    orgStr && orgStr.toLowerCase() !== 'unknown' && orgStr.toLowerCase() !== 'unknown organization';

  if (!hasValidOrg) {
    return 'Unknown Organization';
  }

  let cleanOrg = orgStr;

  // 2. Strip common corporate suffixes — only when suffix is at the end and short
  for (const regex of CORPORATE_SUFFIXES) {
    const stripped = cleanOrg.replace(regex, '').replace(/\s+/g, ' ').trim();
    // Only apply stripping if the result is non-trivially shorter (not empty or <3 chars)
    if (stripped && stripped.length >= 3) {
      cleanOrg = stripped;
    }
  }

  // Standardize spacing and trim
  cleanOrg = cleanOrg.replace(/\s+/g, ' ').trim();

  // 3. Fallback: if suffix removal left nothing meaningful, return original
  if (!cleanOrg || cleanOrg.length < 2) {
    return orgStr;
  }

  return cleanOrg;
}

/**
 * Standardizes dynamic enum variations to canonical representations.
 */
export function normalizeEnum<T extends string>(val: any, allowedValues: T[], defaultValue: T): T {
  const str = normalizeString(val);
  if (!str) return defaultValue;

  const upper = str
    .toUpperCase()
    .trim()
    .replace(/[-\s]+/g, '_');

  // Try matching directly
  if (allowedValues.includes(upper as any)) {
    return upper as any;
  }

  // Try partial mapping/cleaning (e.g. "SCHOLARSHIPS" -> "SCHOLARSHIP")
  const stripped = upper.replace(/S$/, ''); // Remove plural suffix
  if (allowedValues.includes(stripped as any)) {
    return stripped as any;
  }

  // Find prefix/fuzzy match
  for (const allowed of allowedValues) {
    if (allowed.startsWith(upper) || upper.startsWith(allowed)) {
      return allowed;
    }
  }

  return defaultValue;
}

/**
 * Executes a full normalizer pass on the extracted opportunity details.
 */
export function normalizeOpportunity(opp: any): any {
  if (!opp || typeof opp !== 'object') {
    opp = {};
  }

  // ── Task 1: Provider Alias Mapping Layer ──
  const normalizationChangesApplied: string[] = [];
  const aliasMap: Record<string, string> = {
    // Title mappings
    opportunityName: 'title',
    oppName: 'title',
    name: 'title',
    headline: 'title',
    // Deadline mappings
    applicationDeadline: 'deadline',
    applyBy: 'deadline',
    lastDate: 'deadline',
    // Salary/Stipend mappings
    stipend: 'salary',
    compensation: 'salary',
    payment: 'salary',
    // Selection process / application details
    applicationProcess: 'selectionProcess',
    howToApply: 'selectionProcess',
    applicationSteps: 'selectionProcess',
    // Confidence score mappings
    confidenceEstimator: 'confidence',
    confidenceScore: 'confidence',
    score: 'confidence',
    // Link mappings
    officialWeb: 'officialWebsite',
    webpage: 'officialWebsite',
    link: 'officialWebsite',
    applicationUrl: 'applicationUrl',
  };

  // Convert aliases to canonical keys if not explicitly defined on the canonical key
  // 0. Clean raw extracted JSON to turn "null", "N/A", "None" strings into actual null values
  opp = cleanRawExtractedJson(opp) || {};

  for (const aliasKey in aliasMap) {
    const canonicalKey = aliasMap[aliasKey];
    if (aliasKey in opp && opp[aliasKey] !== undefined && opp[aliasKey] !== null) {
      if (opp[canonicalKey] === undefined || opp[canonicalKey] === null) {
        opp[canonicalKey] = opp[aliasKey];
        normalizationChangesApplied.push(
          `Mapped alias property [${aliasKey}] to canonical key [${canonicalKey}]`,
        );
      }
    }
  }

  // Store changes directly as a transient array for diagnostics checks
  opp._normalizationChanges = normalizationChangesApplied;

  // Eliminate "Untitled Opportunity" or placeholder titles by returning empty string (fails Zod schema validation)
  const rawTitle = normalizeString(opp.title) || '';
  const isPlaceholderTitle =
    rawTitle.toLowerCase().trim() === 'untitled' ||
    rawTitle.toLowerCase().trim() === 'unknown' ||
    rawTitle.toLowerCase().trim() === 'n/a' ||
    rawTitle.toLowerCase().trim() === 'placeholder' ||
    rawTitle.toLowerCase().trim() === 'empty' ||
    rawTitle.toLowerCase().trim() === 'untitled opportunity';

  const title = isPlaceholderTitle ? '' : rawTitle;

  const domain =
    normalizeString(opp.sourceDomain) || (opp.sourceURL ? new URL(opp.sourceURL).hostname : '');
  const organization = normalizeOrganization(opp.organization, domain);

  // Normalize enums canonically
  const opportunityType = normalizeEnum(
    opp.opportunityType,
    [
      'INTERNSHIP',
      'STARTUP_INTERNSHIP',
      'GOVERNMENT_INTERNSHIP',
      'RESEARCH_INTERNSHIP',
      'HACKATHON',
      'COMPETITION',
      'OPEN_SOURCE_PROGRAM',
      'CAMPUS_AMBASSADOR',
      'SCHOLARSHIP',
      'SUMMER_SCHOOL',
      'BOOTCAMP',
      'FELLOWSHIP',
      'WOMEN_IN_TECH',
    ],
    'INTERNSHIP',
  );

  const category = normalizeString(opp.category) || deriveCategory(opportunityType);

  const sourceType = normalizeEnum(
    opp.sourceType,
    ['GOVERNMENT', 'COMPANY', 'UNIVERSITY', 'NGO', 'FOUNDATION', 'COMMUNITY', 'OTHER'],
    'OTHER',
  );

  const experienceRequired = opp.experienceRequired
    ? normalizeEnum(opp.experienceRequired, ['NONE', 'SOME', 'EXPERIENCED'], 'NONE')
    : 'NONE';

  const fundingType = opp.fundingType
    ? normalizeEnum(opp.fundingType, ['FULLY_FUNDED', 'PARTIALLY_FUNDED', 'PAID', 'UNPAID'], 'PAID')
    : null;

  const estimatedCompetition = opp.estimatedCompetition
    ? normalizeEnum(opp.estimatedCompetition, ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'], 'UNKNOWN')
    : null;

  const organizationType = opp.organizationType
    ? normalizeEnum(
        opp.organizationType,
        ['GOVERNMENT', 'MNC', 'STARTUP', 'NGO', 'UNIVERSITY', 'FOUNDATION', 'COMMUNITY', 'OTHER'],
        'OTHER',
      )
    : null;

  const applicationDifficulty = opp.applicationDifficulty
    ? normalizeEnum(
        opp.applicationDifficulty,
        ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'UNKNOWN'],
        'UNKNOWN',
      )
    : null;

  const genderEligibility = opp.genderEligibility
    ? normalizeEnum(opp.genderEligibility, ['FEMALE', 'ALL', 'OTHER'], null as any)
    : null;

  const audiencePersonas = normalizeArray(opp.audiencePersonas)
    .map((item) => item.toLowerCase().trim())
    .filter((item: string) =>
      ['college-student', 'postgraduate', 'fresher'].includes(item),
    ) as any[];

  const educationEligibility = normalizeArray(opp.educationEligibility);
  const professionalDomains = normalizeArray(opp.professionalDomains).map((item) =>
    item.toLowerCase().trim(),
  );

  return {
    ...opp,
    title,
    description: normalizeString(opp.description) || '',
    summary: normalizeString(opp.summary) || '',
    organization,
    opportunityType,
    category,
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
    genderEligibility,
    documentsRequired: normalizeArray(opp.documentsRequired),
    selectionProcess: normalizeString(opp.selectionProcess),
    benefits: normalizeString(opp.benefits),
    tags: normalizeArray(opp.tags),
    sourceURL: normalizeString(opp.sourceURL),
    sourceDomain: domain,
    sourceType,
    confidence: typeof opp.confidence === 'number' ? opp.confidence : 0.5,

    audiencePersonas,
    educationEligibility,
    professionalDomains,
    experienceRequired,
    fundingType,
    estimatedCompetition,
    organizationType,
    applicationDifficulty,
  };
}
