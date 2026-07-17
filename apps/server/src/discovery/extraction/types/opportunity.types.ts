import { OpportunityType, AudiencePersona, SourceCategory, EngineeringDomain } from '@scout/shared';

export type { OpportunityType, AudiencePersona, SourceCategory, EngineeringDomain };

export type SourceType =
  'GOVERNMENT' | 'COMPANY' | 'UNIVERSITY' | 'NGO' | 'FOUNDATION' | 'COMMUNITY' | 'OTHER';

export type OrganizationType =
  'GOVERNMENT' | 'MNC' | 'STARTUP' | 'NGO' | 'UNIVERSITY' | 'FOUNDATION' | 'COMMUNITY' | 'OTHER';

export type ExperienceRequired = 'NONE' | 'SOME' | 'EXPERIENCED';

export type FundingType = 'FULLY_FUNDED' | 'PARTIALLY_FUNDED' | 'PAID' | 'UNPAID';

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

export type CompetitionLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export type ApplicationDifficulty = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'UNKNOWN';

export interface AIMetadata {
  provider: string;
  model: string;
  latencyMs: number;
  extractionVersion: string;
}

export interface Opportunity {
  title: string;
  description: string;
  summary: string;
  organization: string;
  opportunityType: OpportunityType;
  category: SourceCategory;
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

  audiencePersonas: AudiencePersona[];
  educationEligibility: string[];
  professionalDomains: EngineeringDomain[];
  experienceRequired: ExperienceRequired;
  fundingType: FundingType | null;
  estimatedCompetition: CompetitionLevel | null;
  organizationType: OrganizationType | null;
  applicationDifficulty: ApplicationDifficulty | null;

  goldReasons: GoldReason[];
  trustScore: number;

  discoveredAt?: string;
  firstSeenAt?: string;
  lastCheckedAt?: string;
  expiresAt: string | null;
  archived?: boolean;

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

  workMode?: 'REMOTE' | 'HYBRID' | 'ONSITE' | null;
  fundingStatus?: 'PAID' | 'UNPAID' | null;
  visaSponsored?: boolean;
  travelFunded?: boolean;

  intelligence?: OpportunityIntelligence | null;
  createdAt?: string;
  updatedAt?: string;

  canonicalId?: string;
  slug?: string;
  type?: string;
  subCategory?: string;
  eligibleBranches: string[];
  eligibleYears: string[];
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
  womenFocused: boolean;
  status?: 'ACTIVE' | 'EXPIRED' | 'ARCHIVED';
  visibility?: 'PUBLIC' | 'PRIVATE' | 'HIDDEN';

  competitionEstimate?: string;
  categoryPrediction?: string;
  eligibilitySummary?: string;
  trustSignals?: string[];
  qualitySignals?: string[];
  warnings?: string[];

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
