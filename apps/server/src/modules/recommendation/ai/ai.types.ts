export interface ICareerReport {
  executiveSummary: string;
  whyScoutPickedThis: string;
  strongestStrengths: string[];
  missingSkills: string[];
  resumeImprovements: string[];
  interviewPrep: string[];
  applicationConfidence: {
    level: string;
    explanation: string;
  };
  nextAction: string;
  scoutVerdict: {
    verdict: string;
    explanation: string;
  };
  personalizedReason: string;
  whyNow: string;
  firstAction: string;
  confidenceMessage: string;
  projectEvidence?: string;
  whyYou?: string;
  whyCompany?: string;

  // New Career Report fields
  strengths?: string[];
  challenges?: string[];
  applicationStrategy?: string;
  preparationChecklist?: string[];
}

export type IAIPersonalizationItem = ICareerReport;

export interface IAIPersonalizationResponse {
  todayMission: string;
  aiSummary: string;
  recommendationsBySlot: Record<string, IAIPersonalizationItem>;
}

export interface IAIPersonalizationMetadata {
  provider: string;
  model: string;
  latencyMs: number;
  promptVersion: string;
  schemaVersion: string;
  engineVersion: string;
  fallbackUsed: boolean;
  repairUsed: boolean;
  promptLength: number;
  responseLength: number;
  promptHash: string;
}
