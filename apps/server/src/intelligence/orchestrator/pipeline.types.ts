export interface IntelligencePipelineOptions {
  force?: boolean;
  batchSize?: number;
}

export interface IntelligencePipelineMetrics {
  loaded: number;
  skipped: number;
  enriched: number;
  scored: number;
  validated: number;
  updated: number;
  unchanged: number;
  avgTrust: number;
  avgPopularity: number;
  avgHidden: number;
  avgQuality: number;
  highestHidden: { title: string; score: number } | null;
  highestTrust: { title: string; score: number } | null;
  lowestQuality: { title: string; score: number } | null;
  avgRuntimePerOpportunityMs: number;
  totalRuntimeMs: number;
}

export interface IntelligencePipelineResult {
  success: boolean;
  metrics: IntelligencePipelineMetrics;
  errors: string[];
}
