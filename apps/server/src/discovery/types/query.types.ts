import { SourceCategory, TargetAudience } from '@scout/shared';

export type DiscoveryMission =
  | 'ENGINEERING_INTERNSHIPS'
  | 'STARTUP_INTERNSHIPS'
  | 'GOVERNMENT_TECH_INTERNSHIPS'
  | 'RESEARCH_INTERNSHIPS'
  | 'HACKATHONS';

export type SearchStrategy =
  'INTENT' | 'ECOSYSTEM' | 'LOCATION' | 'COMPANY' | 'ATS' | 'OFFICIAL' | 'COMMUNITY';

export interface MissionConfiguration {
  mission: DiscoveryMission;
  searchIntents: string[];
  prioritySources: string[];
  priorityEcosystems: string[];
  priorityCities: string[];
  preferredATS: string[];
  searchBudget: number;
  maxSearchDepth: number;
  companyDiscoveryEnabled: boolean;
  multiHopEnabled: boolean;
}

export interface PlannedQuery {
  query: string;
  priority: 'high' | 'medium' | 'low';
  category: SourceCategory;
  tags: string[];
  expectedOpportunityType: string;
  strategy: SearchStrategy;
  expectedSourceType: string;
  expectedEcosystem?: string;
  expectedLocation?: string;
  expectedATS?: string;
  reason: string;
  budget: number;
  depth: number;
}

export interface PlanMeta {
  totalQueries: number;
  searchIntents: number;
  companyDiscoverySearches: number;
  atsSearches: number;
  officialSearches: number;
  communitySearches: number;
  expectedCompanies: number;
  expectedEcosystems: number;
  expectedCities: number;
  estimatedSearchBudget: number;
}

export interface QueryPlannerResponse {
  queries: string[];
}

export interface PrioritizedSearchPlan extends QueryPlannerResponse {
  mission: DiscoveryMission;
  configuration: MissionConfiguration;
  plannedQueries: PlannedQuery[];
  meta: PlanMeta;
}

export interface DiscoveryContext {
  mission?: DiscoveryMission;
  categories: SourceCategory[];
  targetAudience: TargetAudience;
  country: string;
  maxQueries?: number;
}
