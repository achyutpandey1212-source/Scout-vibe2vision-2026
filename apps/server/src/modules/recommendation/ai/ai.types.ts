export interface IAIPersonalizationItem {
  personalizedReason: string;
  projectEvidence: string;
  whyYou?: string;
  whyCompany?: string;
  whyNow?: string;
  missingSkills: string[];
  firstAction: string;
  confidenceMessage: string;
}

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
