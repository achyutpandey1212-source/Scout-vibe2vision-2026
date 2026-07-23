export interface ICandidateBrief {
  identity: {
    name: string;
    currentCareerStage: string;
    educationLevel: string;
    degree: string;
    branch: string;
    college: string;
    graduationYear?: number;
    location: string;
    currentStatus: string;
  };
  careerGoals: {
    preferredRoles: string[];
    interestedDomains: string[];
    longTermGoals: string[];
    preferredIndustries: string[];
    internshipVsFullTimePreference: string;
    opportunityPreferences: string[];
  };
  technicalProfile: {
    strongestTechnologies: string[];
    secondaryTechnologies: string[];
    languages: string[];
    frameworks: string[];
    backend: string[];
    frontend: string[];
    databases: string[];
    cloud: string[];
    aiMl: string[];
    tools: string[];
  };
  experienceSummary: {
    internshipCount: number;
    projectCount: number;
    leadershipCount: number;
    hackathonCount: number;
    openSourceCount: number;
    certificationsCount: number;
    internships: string[];
    leadership: string[];
    majorAchievements: string[];
  };
  projectHighlights: Array<{
    title: string;
    evidence: string;
    technologies: string[];
  }>;
  strengths: string[];
  growthAreas: string[];
  preferences: {
    remotePreference: boolean;
    workModePreferences: string[];
    relocation: string;
    internshipVsFullTime: string;
  };
}

export interface IOpportunityBrief {
  role: string;
  company: string;
  title?: string;
  organization?: string;
  opportunityType: string;
  difficulty: 'Easy' | 'Medium' | 'Stretch';
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'Onsite' | 'Unknown';
  deadline?: string;
  compensation?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  topTechnologies: string[];
  experienceLevel: string;
  learningOpportunities: string;
  mentorship: string;
  growthPotential: string;
  uniqueBenefits: string[];
  whyInteresting: string;
}

export interface IMatchIntelligence {
  overallMatchScore: number;
  confidenceScore: number;
  topMatchingSkills: string[];
  missingSkills: string[];
  matchingInterests: string[];
  matchingPreferences: string[];
  relevantProjects: string[];
  relevantExperience: string[];
  skillGaps: string[];
  reasonCandidateRankedHighly: string;
  estimatedCompetitiveness: 'High' | 'Medium' | 'Low';
  urgency: 'High' | 'Medium' | 'Low';
  learningPotential: 'High' | 'Medium' | 'Low';
  careerGrowthPotential: 'High' | 'Medium' | 'Low';
  resumeFit: 'High' | 'Medium' | 'Low';
}

export interface IPortfolioSummary {
  todayCoveredRoles: string[];
  technologiesCovered: string[];
  difficultySpread: {
    easy: number;
    medium: number;
    stretch: number;
  };
  companiesCount: number;
  uniqueRoleFamiliesCount: number;
}

export interface ISlotOpportunityContext {
  slot: string;
  opportunityBrief: IOpportunityBrief;
  matchIntelligence: IMatchIntelligence;
}

// Backward compatible legacy interfaces
export interface IUserProfileSummary {
  name: string;
  gender: string;
  educationLevel: string;
  degree: string;
  branch: string;
  college: string;
  graduationYear?: number;
  currentStatus: string;
  location: string;
  preferredLocations: string[];
}

export interface ICareerGoals {
  preferredRoles: string[];
  interestedDomains: string[];
  longTermGoals: string[];
  preferredIndustries: string[];
  opportunityPreferences: string[];
  workModePreferences: string[];
  internshipVsFullTimePreference: string;
}

export interface ITechnicalProfile {
  languages: string[];
  frameworks: string[];
  backend: string[];
  frontend: string[];
  databases: string[];
  cloud: string[];
  aiMl: string[];
  tools: string[];
  other: string[];
}

export interface IExperienceSummary {
  yearsOfExperience?: number;
  internships: string[];
  leadership: string[];
  research: string[];
  hackathons: string[];
  openSource: string[];
  freelancing: string[];
  teaching: string[];
  majorAchievements: string[];
}

export interface IProjectHighlight {
  title: string;
  description: string;
  technologies: string[];
  mostRelevantLearning: string;
}

export interface IResumeStrengthSummary {
  bulletPoints: string[];
}

export interface IOpportunitySummary {
  title: string;
  organization: string;
  opportunityType: string;
  domain: string;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'Onsite' | 'Unknown';
  deadline?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequirements?: string;
  benefits?: string[];
  descriptionSummary: string;
  tags: string[];
  qualityScore: number;
  trustLevel: string;
}

export interface IDeterministicMatchAnalysis {
  overallMatch: number;
  scoreBreakdown: {
    skillMatch: number;
    projectMatch: number;
    careerGoal: number;
    opportunityType: number;
    careerStage: number;
    location: number;
    womenPreference: number;
    freshness: number;
    deadline: number;
    hiddenGem: number;
    softPenalties: number;
  };
  topMatchingSkills: string[];
  missingSkills: string[];
  matchingInterests: string[];
  matchingPreferences: string[];
  potentialGaps: string[];
  relevantResumeProjects: string[];
  relevantExperience: string[];
}

export interface IRecommendationInsights {
  careerStage: string;
  estimatedCompetitiveness: 'High' | 'Medium' | 'Low';
  applicationUrgency: 'High' | 'Medium' | 'Low';
  growthPotential: 'High' | 'Medium' | 'Low';
  learningPotential: 'High' | 'Medium' | 'Low';
  resumeFit: 'High' | 'Medium' | 'Low';
  confidenceScore: number;
  priorityScore: number;
}

export interface IRecommendationContext {
  // Structured Briefs (V2 Context)
  candidateBrief: ICandidateBrief;
  portfolioSummary: IPortfolioSummary;
  opportunityContexts: ISlotOpportunityContext[];

  // Legacy fields (for backward compatibility)
  userProfile?: IUserProfileSummary;
  careerGoals?: ICareerGoals;
  technicalProfile?: ITechnicalProfile;
  experienceSummary?: IExperienceSummary;
  projects?: IProjectHighlight[];
  resumeStrength?: IResumeStrengthSummary;
  opportunity?: IOpportunitySummary;
  matchAnalysis?: IDeterministicMatchAnalysis;
  insights?: IRecommendationInsights;
  humanReadableSummary?: string;
}
