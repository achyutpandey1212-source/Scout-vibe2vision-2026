export interface Opportunity {
  _id: string;
  title: string;
  organization: string;
  description: string;
  summary?: string;
  category: 'JOB' | 'INTERNSHIP' | 'SCHOLARSHIP' | 'FELLOWSHIP' | 'GRANT' | 'FREELANCE';
  opportunityType?: string;
  deadline: string | null;
  startDate?: string | null;
  endDate?: string | null;
  applicationUrl: string;
  sourceURL: string;
  officialWebsite?: string | null;
  sourceDomain?: string;
  sourceType?: string;
  tags: string[];
  skills?: string[];
  eligibility?: string | null;
  minimumQualification?: string | null;
  benefits?: string | null;
  requirements?: string[];
  documentsRequired?: string[];
  selectionProcess?: string | null;
  stipend?: number | null;
  salary?: number | null;
  currency?: string | null;
  duration?: string | null;
  experienceLevel?: string | null;
  ageLimit?: number | null;
  genderEligibility?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  remote?: boolean;
  isWomenOnly?: boolean;
  isHiddenGem?: boolean;
  isFeatured?: boolean;
  confidence?: number;
  intelligence?: {
    normalizedOrganization?: string;
    normalizedDeadline?: string;
    daysRemaining?: number;
    expired?: boolean;
    metadata?: {
      isGovernment?: boolean;
      isRemote?: boolean;
      isPaid?: boolean;
      hasDeadline?: boolean;
    };
    scores?: {
      trust?: number;
      popularity?: number;
      quality?: number;
    };
  };
}

export interface Recommendation {
  opportunity: Opportunity;
  recommendationScore: number;
  matchedFactors: string[];
  missingFactors: string[];
  explanation: string;
}

export interface ScoutUser {
  _id?: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  provider: string;
  emailVerified: boolean;
  isActive: boolean;
  role: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  name?: string;
  picture?: string | null;
}
