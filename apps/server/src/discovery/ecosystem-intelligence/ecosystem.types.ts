/**
 * Ecosystem Intelligence Engine — Core Type Definitions
 *
 * Deterministic, LLM-free module that maps ecosystems (accelerators, VC funds,
 * incubators, universities, research labs, developer platforms, hackathon
 * platforms) and produces high-quality company / portfolio / career / ATS /
 * candidate crawl targets that feed the rest of Discovery.
 *
 * Ecosystems are modeled INDEPENDENTLY of companies. Companies are produced as
 * a downstream artifact, never the other way around.
 */

/** High-level deterministic ecosystem taxonomy. */
export type EcosystemType =
  | 'ACCELERATOR'
  | 'VC_ECOSYSTEM'
  | 'INDIAN_STARTUP_ECOSYSTEM'
  | 'RESEARCH_ECOSYSTEM'
  | 'DEVELOPER_ECOSYSTEM'
  | 'HACKATHON_ECOSYSTEM';

/** Geographic region used by the Query Planner for mission routing. */
export type EcosystemRegion = 'INDIA' | 'GLOBAL' | 'US' | 'EUROPE' | 'APAC';

/** Engineering focus used for mission-relevant filtering. */
export type EngineeringFocus =
  | 'AI'
  | 'SAAS'
  | 'FINTECH'
  | 'DEEPTECH'
  | 'CLOUD'
  | 'CYBERSECURITY'
  | 'DEVELOPER_TOOLS'
  | 'RESEARCH'
  | 'OPEN_SOURCE'
  | 'GENERAL'
  | 'DEVOPS'
  | 'WEB'
  | 'BLOCKCHAIN'
  | 'WEB3'
  | 'DATA'
  | 'SYSTEMS'
  | 'PHYSICS'
  | 'BIG_DATA';

/** Deterministic opportunity-yield classification (metadata only). */
export type OpportunityYield = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Priority band (1 = highest). */
export type Priority = 1 | 2 | 3;

/** ATS providers emitted as deterministic crawl candidates. */
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

/** Deterministic crawl candidate kind. */
export type CrawlCandidateType =
  'PORTFOLIO' | 'COMPANY' | 'CAREERS' | 'ATS' | 'CANDIDATE' | 'ECOSYSTEM_PAGE';

/**
 * A deterministic ecosystem definition.
 *
 * Everything Scout knows about an ecosystem is captured here. No network, no
 * LLM. Adding a new ecosystem is a pure configuration change.
 */
export interface Ecosystem {
  /** Stable kebab-case identifier, e.g. "yc", "thub". */
  id: string;
  /** Human readable name. */
  name: string;
  type: EcosystemType;
  country: string;
  /** Geographic region used by mission routing. */
  region: EcosystemRegion;
  priority: Priority;
  /** Primary homepage. */
  officialWebsite: string;
  /** Portfolio / alumni listing page. */
  portfolioPage?: string;
  /** Dedicated companies page when distinct from portfolio. */
  companiesPage?: string;
  /** Official startup directory. */
  startupDirectory?: string;
  /** RSS / jobs feed. */
  rssFeed?: string;
  /** Curated career pages known to belong to this ecosystem. */
  knownCareerPages: string[];
  /** Curated ATS boards known to host ecosystem opportunities. */
  knownATS: ATSProvider[];
  /** Known company domains produced by this ecosystem. */
  knownDomains: string[];
  /** Partner ecosystems (referenced by id). */
  knownPartners: string[];
  /** Universities affiliated with this ecosystem. */
  knownUniversities: string[];
  /** Accelerators affiliated with this ecosystem. */
  knownAccelerators: string[];
  /** Incubators affiliated with this ecosystem. */
  knownIncubators: string[];
  /** Events / programs run by this ecosystem. */
  knownEvents: string[];
  /** Engineering focus areas. */
  engineeringFocus: EngineeringFocus[];
  /** Historical probability (0-1) that this ecosystem yields internships. */
  internshipLikelihood: number;
  /** Remote friendliness (0-1). */
  remoteFriendliness: number;
  /** Deterministic opportunity-yield classification (metadata only, no scoring). */
  opportunityYield: OpportunityYield;
  /** Epoch ms of the last configuration update. */
  lastUpdated: number;
}

/**
 * A deterministic company artifact produced by an ecosystem.
 *
 * Companies are downstream of ecosystems — never modeled independently here.
 */
export interface EcosystemCompany {
  name: string;
  website: string;
  ecosystemId: string;
  ecosystemName: string;
  type: EcosystemType;
  country: string;
  city?: string;
  ats?: ATSProvider;
}

/** Deterministic crawl candidate emitted to the discovery pipeline. */
export interface CrawlCandidate {
  url: string;
  /** Originating ecosystem id. */
  ecosystemId: string;
  ecosystemName: string;
  type: CrawlCandidateType;
  /** Company name when the candidate resolves to a known company. */
  company?: string;
  ats?: ATSProvider;
  /** Deterministic priority contribution (0-100). */
  priority: number;
  /** Engineering focus hint. */
  focus?: EngineeringFocus;
  /** Region hint for mission routing. */
  region: EcosystemRegion;
}

/** Deterministic scoring output for a single ecosystem. */
export interface EcosystemScore {
  ecosystemId: string;
  ecosystemName: string;
  /** 0-100 composite desirability score. */
  ecosystemScore: number;
  /** 1-3 (1 = highest). */
  ecosystemPriority: Priority;
  /** Expected number of opportunity crawl targets. */
  expectedOpportunityYield: number;
  /** 0-1 expected share of engineering-relevant targets. */
  expectedEngineeringRelevance: number;
}

/** Deterministic city intelligence record. */
export interface CityIntel {
  city: string;
  state: string;
  country: string;
  startupScore: number;
  engineeringScore: number;
  researchScore: number;
  governmentScore: number;
  priority: Priority;
  majorIncubators: string[];
  majorUniversities: string[];
  majorTechParks: string[];
}

/** Result of running one discovery strategy against one ecosystem. */
export interface DiscoveryResult {
  ecosystemId: string;
  /** Companies discovered (downstream artifact). */
  companies: EcosystemCompany[];
  /** Portfolio / listing pages. */
  portfolioPages: string[];
  /** Official directories discovered. */
  directories: string[];
  /** Incubator members / pages. */
  incubators: string[];
  /** Startup listings. */
  startupListings: string[];
  /** Program pages. */
  programPages: string[];
  /** Career pages. */
  careerPages: string[];
  /** ATS pages. */
  atsPages: string[];
  /** Candidate application URLs. */
  candidateUrls: string[];
}

/** Top-level engine output. */
export interface EcosystemDiscoveryResult {
  mission: string;
  visited: number;
  discoveryResults: DiscoveryResult[];
  /** Deduplicated companies across all ecosystems. */
  companies: EcosystemCompany[];
  /** Deduplicated crawl candidates across all ecosystems. */
  candidates: CrawlCandidate[];
  scores: EcosystemScore[];
  summary: EcosystemDiscoverySummary;
}

/** Printed / serialized summary. */
export interface EcosystemDiscoverySummary {
  mission: string;
  ecosystemsVisited: number;
  portfolioCompanies: number;
  incubators: number;
  universities: number;
  researchLabs: number;
  citiesCovered: number;
  careerPages: number;
  atsPages: number;
  candidateUrls: number;
  averageScore: number;
  generatedAt: string;
}

/** Health report output. */
export interface EcosystemHealth {
  totalEcosystems: number;
  companiesDiscoverable: number;
  portfolioCompanies: number;
  incubators: number;
  researchLabs: number;
  universities: number;
  careerPages: number;
  atsPages: number;
  averageScore: number;
  topEcosystems: { id: string; name: string; score: number }[];
  coverageByCountry: Record<string, number>;
  coverageByCity: Record<string, number>;
  coverageByType: Record<EcosystemType, number>;
  /** Count of government ecosystems (type INDIAN_STARTUP_ECOSYSTEM + gov focus). */
  governmentEcosystems: number;
  startupEcosystems: number;
  researchEcosystems: number;
  developerEcosystems: number;
  hackathonEcosystems: number;
  averageOpportunityYield: number;
  top20HighestYield: { id: string; name: string; yield: OpportunityYield }[];
  tier1CityCoverage: string[];
  missingMetadataCount: number;
  duplicateCount: number;
  generatedAt: string;
}

/** CLI single-ecosystem report. */
export interface EcosystemTestReport {
  ecosystem: string;
  priority: Priority;
  score: number;
  companies: number;
  portfolio: number;
  careerPages: number;
  ats: number;
  expectedYield: number;
  knownCities: string[];
  knownDomains: string[];
}
