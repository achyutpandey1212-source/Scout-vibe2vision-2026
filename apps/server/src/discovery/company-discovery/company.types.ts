/**
 * Company Discovery Engine — Core Type Definitions
 *
 * Deterministic, LLM-free module for discovering companies, their career
 * infrastructure, and ATS providers before internship discovery.
 */

export type EcosystemCategory =
  | 'STARTUP_ACCELERATOR'
  | 'INDIAN_STARTUP_ECOSYSTEM'
  | 'UNICORN'
  | 'DEVELOPER_COMPANY'
  | 'AI_COMPANY'
  | 'BIG_TECH';

export type CompanyStage =
  | 'SEED'
  | 'EARLY'
  | 'SERIES_A'
  | 'SERIES_B'
  | 'GROWTH'
  | 'SCALEUP'
  | 'ENTERPRISE'
  | 'UNICORN'
  | 'PUBLIC'
  | 'UNKNOWN';

export type CompanyType =
  | 'STARTUP'
  | 'ACCELERATED_STARTUP'
  | 'UNICORN'
  | 'DEVELOPER_TOOLS'
  | 'AI_LAB'
  | 'BIG_TECH'
  | 'INCUBATOR'
  | 'UNKNOWN';

export type ATSProvider =
  | 'Greenhouse'
  | 'Lever'
  | 'Ashby'
  | 'Workable'
  | 'SmartRecruiters'
  | 'Comeet'
  | 'Rippling'
  | 'BambooHR'
  | 'Jobvite'
  | 'Teamtailor'
  | 'UNKNOWN';

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type DiscoverySource =
  | 'STARTUP_ACCELERATOR'
  | 'INDIAN_STARTUP_ECOSYSTEM'
  | 'UNICORN_REGISTRY'
  | 'DEVELOPER_REGISTRY'
  | 'AI_REGISTRY'
  | 'BIG_TECH_REGISTRY'
  | 'PORTFOLIO_DISCOVERY'
  | 'CAREERS_DISCOVERY'
  | 'MANUAL_SEED';

/**
 * Deterministic source categories used for the confidence score. Each maps to a
 * fixed point contribution defined in company-score.ts. Ordered roughly by trust.
 */
export type ConfidenceSource =
  | 'OFFICIAL_DOMAIN'
  | 'KNOWN_ATS'
  | 'Y_COMBINATOR'
  | 'TECHSTARS'
  | 'STARTUP_INDIA'
  | 'GOVERNMENT_REGISTRY'
  | 'OFFICIAL_LINKEDIN'
  | 'CRUNCHBASE'
  | 'GITHUB_ORG'
  | 'DEVELOPER_DIRECTORY'
  | 'BLOG'
  | 'UNKNOWN';

/**
 * A raw company candidate emitted by an ecosystem connector.
 */
export interface CompanyCandidate {
  name: string;
  website: string;
  careersUrl?: string;
  ecosystem: EcosystemCategory;
  country: string;
  city?: string;
  companyStage?: CompanyStage;
  companyType?: CompanyType;
  source: DiscoverySource;
  confidence: Confidence;
  /** Optional known ATS provider hint (deterministic, from curated data). */
  ats?: ATSProvider;
  /** Optional parent ecosystem label (e.g. "Y Combinator", "Techstars"). */
  ecosystemLabel?: string;
}

/**
 * A normalized, canonical company record maintained by the registry.
 */
export interface CompanyRecord {
  canonicalName: string;
  aliases: string[];
  website: string;
  careersUrl?: string;
  ats: ATSProvider;
  ecosystem: EcosystemCategory;
  country: string;
  city?: string;
  industry?: string;
  stage?: CompanyStage;
  type?: CompanyType;
  priority: number;
  source: DiscoverySource;
  ecosystemLabel?: string;
  confidence: Confidence;
  /** Deterministic 0-100 desirability score (see company-score.ts). */
  companyScore: number;
  /** Deterministic 0-100 confidence in the record's accuracy/source (see company-score.ts). */
  companyConfidence: number;
  /** Final ordering used before crawling: round(companyScore*0.7 + companyConfidence*0.3). */
  companyPriority: number;
  /** True when the ATS provider was confirmed by URL pattern or HTML signature. */
  atsVerified: boolean;
  /** True when the career page was validated (HTTP 200, hiring signals, not junk). */
  careerPageVerified: boolean;
  /** Epoch ms of the last discovery run that touched this company. */
  lastSeen: number;
  /** Mission that most recently contributed to this record. */
  discoveredByMission?: string;
  /** Strategy (ecosystem/portfolio/careers) that produced the strongest signal. */
  discoveredByStrategy?: string;
}

/**
 * A plug-in connector that discovers companies within an ecosystem.
 */
export interface EcosystemConnector {
  readonly ecosystem: EcosystemCategory;
  readonly label: string;
  discoverCompanies(): Promise<CompanyCandidate[]>;
}

/**
 * Signals used to derive a deterministic priority score (0-100).
 */
export interface PrioritySignals {
  knownAccelerator: boolean;
  knownUnicorn: boolean;
  engineeringCompany: boolean;
  aiCompany: boolean;
  developerTools: boolean;
  india: boolean;
  hiringHistory: boolean;
  internshipHistory: boolean;
  atsDetected: boolean;
  careerPageFound: boolean;
  ecosystemStrength: number; // 0-1 multiplier derived from source ecosystem
}

export interface CompanyDiscoveryConfig {
  enabledEcosystems?: EcosystemCategory[];
  includeCountries?: string[];
  maxCompanies?: number;
  /** When false, network-backed discovery (careers probe) is skipped. */
  probeCareers?: boolean;
  /** When false, ATS detection via HTTP is skipped (uses static hints only). */
  detectAts?: boolean;
  /** When true, career pages are HTTP-verified (200 + hiring signals, not junk). */
  verifyCareers?: boolean;
  /** When true, ATS providers are verified by URL pattern or HTML signature. */
  verifyAts?: boolean;
}

export interface CompanyDiscoverySummary {
  mission: string;
  ecosystems: number;
  companiesFound: number;
  companiesAccepted: number;
  careerPages: number;
  atsDetected: number;
  atsByProvider: Record<string, number>;
  cached: number;
  fresh: number;
  topEcosystems: { ecosystem: string; count: number }[];
  generatedAt: string;
}

export interface CompanyDiscoveryResult {
  companies: CompanyRecord[];
  /** Company-derived candidate URLs to merge into the crawl pipeline. */
  candidateUrls: DiscoveredUrl[];
  summary: CompanyDiscoverySummary;
  /** Per-run statistics for logging/analytics. */
  statistics: CompanyDiscoveryStatistics;
}

export interface DiscoveredUrl {
  url: string;
  company: string;
  type: 'CAREERS' | 'ATS' | 'PORTFOLIO';
  /** Deterministic priority contribution (0-100). */
  priority: number;
  ecosystem?: EcosystemCategory;
  ats?: ATSProvider;
}

/**
 * Statistics printed at the end of every discovery run (Module 2.5 spec).
 */
export interface CompanyDiscoveryStatistics {
  mission: string;
  companiesFound: number;
  knownCompanies: number;
  newCompanies: number;
  registryUpdates: number;
  careerPagesVerified: number;
  atsDetected: number;
  portfolioCompanies: number;
  averageCompanyScore: number;
  averageConfidence: number;
  averagePriority: number;
  generatedAt: string;
}

export interface CompanyDiscoveryHealth {
  registrySize: number;
  companiesWithCareers: number;
  companiesWithAts: number;
  companiesWithoutCareers: number;
  companiesWithoutAts: number;
  averageScore: number;
  averageConfidence: number;
  top20Companies: { canonicalName: string; companyPriority: number }[];
  newestCompanies: { canonicalName: string; lastSeen: number }[];
  generatedAt: string;
}
