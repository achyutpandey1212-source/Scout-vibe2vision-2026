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
  createdAt?: string;
  updatedAt?: string;
}
