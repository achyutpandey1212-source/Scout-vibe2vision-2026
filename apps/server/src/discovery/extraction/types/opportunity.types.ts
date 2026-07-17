export type OpportunityType =
  | 'JOB'
  | 'INTERNSHIP'
  | 'SCHOLARSHIP'
  | 'FELLOWSHIP'
  | 'GRANT'
  | 'FREELANCE'
  | 'COMPETITION'
  | 'BOOTCAMP'
  | 'COURSE'
  | 'VOLUNTEER'
  | 'EVENT'
  | 'PROGRAM'
  | 'OTHER';

export type SourceType =
  | 'GOVERNMENT'
  | 'COMPANY'
  | 'UNIVERSITY'
  | 'NGO'
  | 'FOUNDATION'
  | 'AGGREGATOR'
  | 'COMMUNITY'
  | 'OTHER';

/**
 * More precise organization classification than SourceType.
 * Used by the Recommendation Engine to surface organization context.
 */
export type OrganizationType =
  'GOVERNMENT' | 'MNC' | 'STARTUP' | 'NGO' | 'UNIVERSITY' | 'FOUNDATION' | 'COMMUNITY' | 'OTHER';

/**
 * Coarse experience bracket — enables filtering without parsing free-text experienceLevel.
 */
export type ExperienceRequired = 'NONE' | 'SOME' | 'EXPERIENCED';

/**
 * Funding classification more granular than the legacy fundingStatus field.
 */
export type FundingType = 'FULLY_FUNDED' | 'PARTIALLY_FUNDED' | 'PAID' | 'UNPAID';

/**
 * Multi-dimensional audience persona tags.
 * An opportunity may have multiple personas simultaneously.
 */
export type AudiencePersona =
  | 'college-student'
  | 'graduate'
  | 'postgraduate'
  | 'phd'
  | 'school-student'
  | 'dropout'
  | 'career-break'
  | 'career-returner'
  | 'working-professional'
  | 'fresher'
  | 'entrepreneur'
  | 'self-employed'
  | 'homemaker'
  | 'rural'
  | 'disabled'
  | 'minority'
  | 'veteran';

/**
 * Signals that contribute to an opportunity being classified as "Gold".
 * Multiple signals may apply simultaneously.
 */
export type GoldReason =
  | 'fully-funded'
  | 'government'
  | 'low-competition'
  | 'international'
  | 'travel-sponsored'
  | 'stipend'
  | 'mentorship'
  | 'networking'
  | 'certificate'
  | 'placement'
  | 'equity'
  | 'prestigious';

/**
 * Estimated competitive pressure for the opportunity.
 * LLM-estimated signal; valuable for ranking even at ~60% accuracy.
 */
export type CompetitionLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

/**
 * High-level discovery category used for analytics and recommendation segmentation.
 * Represents the bucket from which Discovery found the opportunity.
 */
export type SearchCategory =
  | 'Government Scheme'
  | 'Scholarship'
  | 'Fellowship'
  | 'Grant'
  | 'Internship'
  | 'Job'
  | 'Competition'
  | 'Training'
  | 'Entrepreneurship'
  | 'Volunteer'
  | 'Event'
  | 'Other';

/**
 * Major product vertical for grouping and navigation.
 * Helps slice the catalog for UI navigation sections.
 */
export type OpportunityVertical =
  | 'CAREERS'
  | 'SCHOLARSHIPS'
  | 'FELLOWSHIPS'
  | 'GOVERNMENT_SCHEMES'
  | 'COMPETITIONS'
  | 'COURSES'
  | 'TRAINING'
  | 'ENTREPRENEURSHIP'
  | 'FINANCIAL_AID'
  | 'EVENTS'
  | 'OTHER';

/**
 * User-perceived friction or criteria weight required to apply or stand out.
 */
export type ApplicationDifficulty = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'UNKNOWN';

export interface AIMetadata {
  provider: string;
  model: string;
  latencyMs: number;
  extractionVersion: string;
}

export interface Opportunity {
  title: string;
  description: string; // Detailed description
  summary: string; // AI summary (2-3 sentences)
  organization: string;
  opportunityType: OpportunityType;
  category: string;
  country: string | null;
  state: string | null;
  city: string | null;
  remote: boolean;
  applicationUrl: string;
  officialWebsite: string | null;
  deadline: string | null;
  startDate: string | null;
  endDate: string | null;
  salary: number | null;
  stipend: number | null;
  currency: string | null;
  duration: string | null;
  eligibility: string | null;
  minimumQualification: string | null;
  skills: string[];
  experienceLevel: string | null;
  ageLimit: number | null;
  genderEligibility: 'FEMALE' | 'ALL' | 'OTHER' | null;
  documentsRequired: string[];
  selectionProcess: string | null;
  benefits: string | null;
  tags: string[];
  sourceURL: string;
  sourceDomain: string;
  sourceType: SourceType;
  confidence: number;
  rawPageId: string;
  aiMetadata: AIMetadata;
  hash: string;

  // ── Audience Intelligence ──────────────────────────────────────────────────
  /** Multi-dimensional persona tags (LLM-extracted from page text). */
  audiencePersonas?: AudiencePersona[];
  /** Education tiers eligible — e.g. ["10th pass", "graduate", "postgraduate"]. */
  educationEligibility?: string[];
  /** Industry domains this opportunity belongs to — e.g. ["technology", "healthcare", "beauty"]. */
  professionalDomains?: string[];
  /** Coarse experience bracket for fast filtering. */
  experienceRequired?: ExperienceRequired | null;
  /** More granular funding classification. Coexists with legacy fundingStatus. */
  fundingType?: FundingType | null;
  /** High-level discovery category for analytics. */
  searchCategory?: SearchCategory | null;
  /** Estimated number of applicants / competitive pressure (LLM-estimated). */
  estimatedCompetition?: CompetitionLevel | null;
  /** Precise organization type classification. */
  organizationType?: OrganizationType | null;

  // ── Product Verticals & Friction (New Fields) ─────────────────────────────
  /** The navigation vertical of this opportunity. */
  opportunityVertical?: OpportunityVertical | null;
  /** Perceived friction to apply/win. */
  applicationDifficulty?: ApplicationDifficulty | null;

  // ── Gold Opportunity System ────────────────────────────────────────────────
  /** Which specific gold signals triggered the flag. Powers future Premium collections. */
  goldReasons?: GoldReason[];

  // ── Trust Scoring ──────────────────────────────────────────────────────────
  /** Deterministic trust score (0–100) computed after extraction. */
  trustScore?: number;

  // ── Freshness & Archiving ──────────────────────────────────────────────────
  discoveredAt?: string;
  firstSeenAt?: string;
  lastCheckedAt?: string;
  expiresAt?: string | null;
  archived?: boolean;

  // ── Trust & Quality Metrics ────────────────────────────────────────────────
  trustLevel?: 'VERIFIED' | 'OFFICIAL' | 'COMMUNITY' | 'UNKNOWN';
  qualityScore?: number;
  qualityBreakdown?: {
    officialSource: boolean;
    deadlinePresent: boolean;
    applicationLink: boolean;
    richDescription: boolean;
    benefitsPresent: boolean;
    stipendPresent: boolean;
  };

  // ── Enriched Metadata ──────────────────────────────────────────────────────
  workMode?: 'REMOTE' | 'HYBRID' | 'ONSITE' | null;
  /** Legacy coarse funding status — kept for backward compatibility. */
  fundingStatus?: 'PAID' | 'UNPAID' | null;
  visaSponsored?: boolean;
  travelFunded?: boolean;

  intelligence?: OpportunityIntelligence | null;
  createdAt?: string;
  updatedAt?: string;

  // ── V2 Core Fields ──────────────────────────────────────────────────────────
  canonicalId?: string;
  slug?: string;
  type?: string;
  subCategory?: string;
  eligibleBranches?: string[];
  eligibleYears?: string[];
  minimumEducation?: string;
  requirements?: string[];
  hybrid?: boolean;
  onsite?: boolean;
  publishedAt?: string;
  sourceUrl?: string;
  officialPage?: string;
  crawlDate?: string;
  crawlMethod?: string;
  contentHash?: string;
  lastSeen?: string;
  lastUpdated?: string;
  keywords?: string[];
  hiddenGemScore?: number;
  sourceAuthority?: number;
  recommendationTags?: string[];
  careerStages?: string[];
  domains?: string[];
  difficulty?: string;
  womenFocused?: boolean;
  status?: 'ACTIVE' | 'EXPIRED' | 'ARCHIVED';
  visibility?: 'PUBLIC' | 'PRIVATE' | 'HIDDEN';

  competitionEstimate?: string;
  categoryPrediction?: string;
  eligibilitySummary?: string;
  trustSignals?: string[];
  qualitySignals?: string[];
  warnings?: string[];

  // ── V2 Intelligence (PR5.3) ────────────────────────────────────────────────
  commitment?: 'PART_TIME' | 'FULL_TIME' | 'FLEXIBLE' | null;
  organizationStage?:
    | 'EARLY_STARTUP'
    | 'GROWTH_STARTUP'
    | 'SCALE_UP'
    | 'ENTERPRISE'
    | 'GOVERNMENT'
    | 'ACADEMIC'
    | null;
  skillsTechnical?: string[];
  skillsSoft?: string[];
  skillsTools?: string[];
  suitableFirstYear?: boolean;
  suitableSecondYear?: boolean;
  suitableThirdYear?: boolean;
  suitableFourthYear?: boolean;
  suitableGraduate?: boolean;
  suitabilityReason?: string | null;
  careerValResume?: number;
  careerValLearning?: number;
  careerValNetworking?: number;
  careerValExposure?: number;
  careerValPortfolio?: number;
  careerValResearch?: number;
  careerValInterview?: number;
  deadlineStatus?: 'OPEN' | 'CLOSING_SOON' | 'ROLLING' | 'UNKNOWN' | 'EXPIRED';
  relatedSimilar?: string[];
  relatedSameOrg?: string[];
  relatedSameDomain?: string[];
  relatedSameSkills?: string[];
  readinessScore?: number;
  readinessStatus?: 'READY' | 'NEEDS_REVIEW';
}

export interface OpportunityIntelligence {
  normalizedOrganization: string | null;
  normalizedDeadline: string | null;
  daysRemaining: number | null;
  expired: boolean;
  metadata: {
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
  } | null;
  version: string;
  enriched: boolean;
  lastEnrichedAt: Date | null;
  lastProcessedAt?: Date | null;
  scores?: {
    trust: number;
    popularity: number;
    hidden: number;
    quality: number;
  };
  scoreBreakdown?: {
    trustFactors: Record<string, number>;
    popularityFactors: Record<string, number>;
    hiddenFactors: Record<string, number>;
    qualityFactors: Record<string, number>;
  };
}
