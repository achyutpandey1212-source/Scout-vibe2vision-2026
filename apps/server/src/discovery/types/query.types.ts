import { SourceCategory, TargetAudience } from '@scout/shared';

export interface DiscoveryContext {
  categories: SourceCategory[];
  targetAudience: TargetAudience;
  country: string;
  maxQueries?: number;
}

export interface PlannedQuery {
  query: string;
  priority: 'high' | 'medium' | 'low';
  category: SourceCategory;
  tags: string[];
  expectedOpportunityType: string;
}

export interface QueryPlannerResponse {
  queries: string[];
}
