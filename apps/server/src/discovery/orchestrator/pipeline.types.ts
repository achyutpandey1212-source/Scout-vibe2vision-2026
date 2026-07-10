export interface DiscoveryOptions {
  skipSearch?: boolean; // Reuses previously generated queries/cache or crawls raw pages directly
  skipCrawl?: boolean; // Utilizes already scraped RawPages
  skipExtract?: boolean; // Bypasses structured AI extraction
}

export interface PipelineMetrics {
  queriesGenerated: number;
  searchResults: number;
  acceptedCandidates: number;
  crawledPages: number;
  snippetBypasses: number;
  extracted: number;
  inserted: number;
  updated: number;
  unchanged: number;
  cacheHits: number;
  cacheMisses: number;
  aiFailures: number;
  crawlFailures: number;
  totalLatency: number; // In milliseconds
}

export interface DiscoveryOrchestratorResponse {
  runId: string;
  metrics: PipelineMetrics;
  failedItems: { url: string; reason: string; stage: string }[];
}
