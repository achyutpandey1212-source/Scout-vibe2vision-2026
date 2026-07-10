export interface ScoreResult {
  score: number;
  factors: Record<string, number>;
}

export interface DomainWeight {
  domain: string;
  weight: number;
}

export interface PopularityKeywords {
  highPopularityOrgs: string[];
  highPopularityPlatforms: string[];
  aggregatorDomains: string[];
}

export interface HiddenBoostKeywords {
  womenFocused: string[];
  governmentSchemes: string[];
  scholarships: string[];
  regionalSchemes: string[];
}

export interface QualityWeights {
  hasDeadline: number;
  hasApplicationUrl: number;
  hasOfficialWebsite: number;
  hasEligibility: number;
  hasBenefits: number;
  hasSalaryOrStipend: number;
  descriptionLengthBonus: number;
}

export interface ScoringConfig {
  trustWeights: {
    governmentSuffixes: string[];
    universitySuffixes: string[];
    trustedAggregators: string[];
    ngoSuffixes: string[];
    trustedDomains: Record<string, number>;
    untrustedDomains: string[];
    blogDomains: string[];
    baseScore: number;
  };
  popularityWeights: {
    orgWeights: Record<string, number>;
    domainTypeWeights: Record<string, number>;
    baseScore: number;
  };
  hiddenBoosts: {
    lowPopularityMultiplier: number;
    womenFocusedBoost: number;
    governmentSchemeBoost: number;
    ngoBoost: number;
    scholarshipBoost: number;
    regionalBoost: number;
    nicheBoost: number;
    bigTechPenalty: Record<string, number>;
    baseScore: number;
  };
  qualityWeights: QualityWeights & {
    baseScore: number;
  };
}
