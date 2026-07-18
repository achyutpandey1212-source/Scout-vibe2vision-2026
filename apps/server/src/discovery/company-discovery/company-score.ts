import { CompanyRecord, ConfidenceSource, PrioritySignals } from './company.types';

/**
 * Deterministic company priority scoring (0-100).
 *
 * Every signal is derived from curated registry data, not AI. The score decides
 * how much crawl budget a company receives inside the discovery pipeline.
 */

export const SCORE_WEIGHTS = {
  knownAccelerator: 14,
  knownUnicorn: 16,
  engineeringCompany: 10,
  aiCompany: 12,
  developerTools: 12,
  india: 8,
  hiringHistory: 6,
  internshipHistory: 8,
  atsDetected: 10,
  careerPageFound: 8,
};

/**
 * Derives scoring signals from a company record using deterministic rules.
 */
export function deriveSignals(record: CompanyRecord): PrioritySignals {
  const type = record.type || 'UNKNOWN';
  const eco = record.ecosystem;

  return {
    knownAccelerator: eco === 'STARTUP_ACCELERATOR',
    knownUnicorn: record.stage === 'UNICORN' || eco === 'UNICORN',
    engineeringCompany:
      type === 'DEVELOPER_TOOLS' ||
      type === 'AI_LAB' ||
      type === 'BIG_TECH' ||
      type === 'STARTUP' ||
      type === 'ACCELERATED_STARTUP',
    aiCompany: type === 'AI_LAB',
    developerTools: type === 'DEVELOPER_TOOLS',
    india: record.country === 'India',
    hiringHistory: record.confidence === 'HIGH',
    internshipHistory: record.confidence === 'HIGH' && record.careersUrl !== undefined,
    atsDetected: record.ats !== 'UNKNOWN',
    careerPageFound: record.careersUrl !== undefined,
    ecosystemStrength: 1,
  };
}

/**
 * Computes a 0-100 priority score from signals. Deterministic and monotonic.
 */
export function computePriority(signals: PrioritySignals): number {
  let score = 0;
  if (signals.knownAccelerator) score += SCORE_WEIGHTS.knownAccelerator;
  if (signals.knownUnicorn) score += SCORE_WEIGHTS.knownUnicorn;
  if (signals.engineeringCompany) score += SCORE_WEIGHTS.engineeringCompany;
  if (signals.aiCompany) score += SCORE_WEIGHTS.aiCompany;
  if (signals.developerTools) score += SCORE_WEIGHTS.developerTools;
  if (signals.india) score += SCORE_WEIGHTS.india;
  if (signals.hiringHistory) score += SCORE_WEIGHTS.hiringHistory;
  if (signals.internshipHistory) score += SCORE_WEIGHTS.internshipHistory;
  if (signals.atsDetected) score += SCORE_WEIGHTS.atsDetected;
  if (signals.careerPageFound) score += SCORE_WEIGHTS.careerPageFound;
  return Math.min(100, Math.max(0, score));
}

/**
 * Convenience: score a record end-to-end.
 */
export function scoreCompany(record: CompanyRecord): number {
  return computePriority(deriveSignals(record));
}

/**
 * Deterministic confidence points by source. Higher points = more trustworthy
 * provenance for the company record. Mirrors the Module 2.5 spec.
 */
export const CONFIDENCE_POINTS: Record<ConfidenceSource, number> = {
  OFFICIAL_DOMAIN: 100,
  KNOWN_ATS: 95,
  Y_COMBINATOR: 95,
  TECHSTARS: 95,
  STARTUP_INDIA: 90,
  GOVERNMENT_REGISTRY: 90,
  OFFICIAL_LINKEDIN: 85,
  CRUNCHBASE: 80,
  GITHUB_ORG: 75,
  DEVELOPER_DIRECTORY: 60,
  BLOG: 30,
  UNKNOWN: 20,
};

/**
 * Maps a discovery source / ecosystem label to a deterministic confidence source.
 */
export function confidenceSourceFor(
  record: Pick<CompanyRecord, 'source' | 'ecosystem' | 'ecosystemLabel' | 'ats'>,
): ConfidenceSource {
  const label = (record.ecosystemLabel || '').toLowerCase();
  const source = record.source;

  if (source === 'STARTUP_ACCELERATOR' || record.ecosystem === 'STARTUP_ACCELERATOR') {
    if (label.includes('y combinator') || label === 'yc') return 'Y_COMBINATOR';
    if (label.includes('techstars')) return 'TECHSTARS';
    return 'Y_COMBINATOR'; // accelerators are high-trust by default
  }
  if (label.includes('startup india') || source === 'INDIAN_STARTUP_ECOSYSTEM') {
    return 'STARTUP_INDIA';
  }
  if (record.ats && record.ats !== 'UNKNOWN') return 'KNOWN_ATS';
  if (label.includes('unicorn') || source === 'UNICORN_REGISTRY') return 'GOVERNMENT_REGISTRY';
  if (source === 'DEVELOPER_REGISTRY') return 'DEVELOPER_DIRECTORY';
  if (source === 'AI_REGISTRY') return 'DEVELOPER_DIRECTORY';
  if (source === 'BIG_TECH_REGISTRY') return 'OFFICIAL_DOMAIN';
  if (source === 'PORTFOLIO_DISCOVERY') return 'DEVELOPER_DIRECTORY';
  if (source === 'CAREERS_DISCOVERY') return 'OFFICIAL_DOMAIN';
  return 'UNKNOWN';
}

/**
 * Computes the deterministic 0-100 company confidence from its provenance.
 */
export function computeConfidence(
  record: Pick<CompanyRecord, 'source' | 'ecosystem' | 'ecosystemLabel' | 'ats'>,
): number {
  const source = confidenceSourceFor(record);
  return CONFIDENCE_POINTS[source];
}

/**
 * Final crawl-ordering priority: a deterministic blend of desirability (score)
 * and provenance (confidence). Rounded to 0-100.
 */
export function computeCompanyPriority(companyScore: number, companyConfidence: number): number {
  const blended = companyScore * 0.7 + companyConfidence * 0.3;
  return Math.min(100, Math.max(0, Math.round(blended)));
}

/**
 * Computes the full 0-100 scoring triple for a record: score, confidence,
 * priority.
 */
export function computeCompanyMetrics(record: CompanyRecord): {
  companyScore: number;
  companyConfidence: number;
  companyPriority: number;
} {
  const companyScore = scoreCompany(record);
  const companyConfidence = computeConfidence(record);
  const companyPriority = computeCompanyPriority(companyScore, companyConfidence);
  return { companyScore, companyConfidence, companyPriority };
}
