export interface DiscoveryContext {
  categories: string[];
  targetAudience: string;
  country: string;
  maxQueries?: number; // Enforces the query budget constraint (default 25)
}

export interface PlannedQuery {
  query: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  tags: string[];
  expectedOpportunityType: string;
}

export interface QueryPlannerResponse {
  queries: string[];
}
