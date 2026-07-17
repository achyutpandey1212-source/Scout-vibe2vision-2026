import { SourceCategory, TargetAudience } from '@scout/shared';

export type DiscoveryMission =
  | 'ENGINEERING_INTERNSHIPS'
  | 'STARTUP_INTERNSHIPS'
  | 'GOVERNMENT_TECH_INTERNSHIPS'
  | 'RESEARCH_INTERNSHIPS'
  | 'HACKATHONS';

export type SearchStrategy =
  'INTENT' | 'ECOSYSTEM' | 'LOCATION' | 'COMPANY' | 'ATS' | 'OFFICIAL' | 'COMMUNITY';

export type QueryPurpose =
  | 'DISCOVER_COMPANIES'
  | 'DISCOVER_CAREERS'
  | 'DISCOVER_ATS'
  | 'DISCOVER_INTERNSHIPS'
  | 'DISCOVER_PORTFOLIO'
  | 'DISCOVER_EVENTS'
  | 'DISCOVER_COMMUNITIES'
  | 'DISCOVER_PROGRAMS';

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
  engineeringDomains: string[];
  explanationTemplates: {
    ats: string;
    company: string;
    ecosystem: string;
    location: string;
    intent: string;
  };
}

export interface PlannedQuery {
  query: string;
  priority: 'high' | 'medium' | 'low';
  priorityScore: number;
  category: SourceCategory;
  tags: string[];
  expectedOpportunityType: string;
  strategy: SearchStrategy;
  purpose: QueryPurpose;
  expectedSourceType: string;
  expectedEcosystem?: string;
  expectedLocation?: string;
  expectedATS?: string;
  reason: string;
  explanation: string;
  budget: number;
  depth: number;
}

export interface PlanMeta {
  mission: DiscoveryMission;
  totalGenerated: number;
  duplicatesRemoved: number;
  finalQueries: number;
  averagePriority: number;
  averageBudget: number;
  strategiesUsed: Record<SearchStrategy, number>;
  citiesCovered: string[];
  engineeringDomainsCovered: string[];
  atsProviders: string[];
  companiesExpected: number;
  ecosystemsCovered: string[];
  budgetUtilization: number;
  missionCoverage: number;
  diversity: {
    intent: number;
    location: number;
    strategy: number;
    engineeringDomain: number;
    companyDiscovery: number;
    ats: number;
  };
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
