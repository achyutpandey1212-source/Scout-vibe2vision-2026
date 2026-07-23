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
  userProfile: IUserProfileSummary;
  careerGoals: ICareerGoals;
  technicalProfile: ITechnicalProfile;
  experienceSummary: IExperienceSummary;
  projects: IProjectHighlight[];
  resumeStrength: IResumeStrengthSummary;
  opportunity: IOpportunitySummary;
  matchAnalysis: IDeterministicMatchAnalysis;
  insights: IRecommendationInsights;
  humanReadableSummary: string;
}
