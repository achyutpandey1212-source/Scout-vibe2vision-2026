export interface ScoreBreakdown {
  trust: number;
  keyword: number;
  freshness: number;
  urlQuality: number;
}

export interface CandidateSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  queryUsed: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  retrievedAt: string;
  source: 'tavily';
  searchRank: number;
  // Future extensibility slots
  metadata?: Record<string, any>;
}

export interface RejectedSearchResult extends Omit<CandidateSearchResult, 'source'> {
  source: 'tavily';
  rejectionReason: string;
}

export interface OrchestratorSearchResponse {
  accepted: CandidateSearchResult[];
  rejected: RejectedSearchResult[];
}
