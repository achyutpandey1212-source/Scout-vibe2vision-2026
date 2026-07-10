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

  // Freshness & Archiving
  discoveredAt?: string;
  firstSeenAt?: string;
  lastCheckedAt?: string;
  expiresAt?: string | null;
  archived?: boolean;

  // Trust & Quality Metrics
  trustLevel?: 'VERIFIED' | 'OFFICIAL' | 'COMMUNITY' | 'UNKNOWN';
  qualityScore?: number;
  qualityBreakdown?: {
    officialSource: boolean;
    deadlinePresent: boolean;
    applicationLink: boolean;
    womenFocused: boolean;
    descriptionComplete: boolean;
  };

  // Enriched Metadata
  workMode?: 'REMOTE' | 'HYBRID' | 'ONSITE' | null;
  fundingStatus?: 'PAID' | 'UNPAID' | null;
  visaSponsored?: boolean;
  travelFunded?: boolean;

  intelligence?: OpportunityIntelligence | null;
  createdAt?: string;
  updatedAt?: string;
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
