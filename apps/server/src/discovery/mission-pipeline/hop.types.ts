export type HopType =
  | 'SEARCH'
  | 'ECOSYSTEM'
  | 'PORTFOLIO'
  | 'COMPANY'
  | 'CAREERS'
  | 'ATS'
  | 'OPPORTUNITY'
  | 'DIRECTORY'
  | 'UNIVERSITY'
  | 'RESEARCH'
  | 'PROGRAM'
  | 'APPLICATION'
  | 'LAB'
  | 'PROJECT'
  | 'PLATFORM'
  | 'EVENT'
  | 'REGISTRATION'
  | 'ORGANIZATION'
  | 'INTERNSHIP';

export interface HopNode {
  id: string;
  source: string;
  target: string;
  depth: number;
  priority: number;
  reason: string;
  confidence: number;
  url?: string;
  status: 'pending' | 'visited' | 'dead_end' | 'skipped' | 'accepted';
  visitedAt?: string;
  metadata?: Record<string, unknown>;
  children: HopNode[];
}

export interface HopTransition {
  from: HopType;
  to: HopType;
  allowed: boolean;
  reason?: string;
}

export interface HopGraph {
  mission: string;
  start: HopType;
  transitions: HopTransition[];
  maxDepth: number;
  priorityThreshold: number;
}

export interface HopResult {
  hopType: HopType;
  url: string;
  depth: number;
  priority: number;
  status: 'visited' | 'dead_end' | 'skipped' | 'accepted';
  discoveredBy: string;
  targetType?: HopType;
  children: HopResult[];
  metadata?: Record<string, unknown>;
}

export interface MissionPipelineInput {
  mission: string;
  queries: string[];
  companyUrls: {
    url: string;
    company: string;
    type: 'CAREERS' | 'ATS' | 'PORTFOLIO';
    priority: number;
    ats?: string;
    ecosystem?: string;
  }[];
  ecosystemCandidates: { url: string; type: string; priority: number; ecosystem?: string }[];
  maxDepth: number;
  priorityThreshold: number;
  branchExpansionLimit: number;
  visitedUrls: Map<
    string,
    { hopType: HopType; mission: string; depth: number; lastSeen: string; status: string }
  >;
}

export interface MissionPipelineResult {
  mission: string;
  root: HopNode | null;
  accepted: HopNode[];
  visited: HopNode[];
  deadEnds: HopNode[];
  skipped: HopNode[];
  summary: MissionSummary;
  stats: Record<string, number>;
  graphJson: Record<string, unknown>;
}

export interface MissionSummary {
  mission: string;
  queries: number;
  companies: number;
  careerPages: number;
  ats: number;
  portfolio: number;
  directories: number;
  ecosystems: number;
  programs: number;
  applications: number;
  universities: number;
  labs: number;
  platforms: number;
  events: number;
  organizations: number;
  internshipPages: number;
  deadEnds: number;
  acceptedOpportunities: number;
  averageBranchSize: number;
  averageRecall: number;
  generatedAt: string;
}

export interface MissionHealth {
  mission: string;
  coverage: number;
  averageHopDepth: number;
  companiesFound: number;
  careerPages: number;
  ats: number;
  portfolioPages: number;
  directories: number;
  deadEnds: number;
  acceptedOpportunities: number;
  averageBranchSize: number;
  averageRecall: number;
}

export interface DeadEndDetection {
  isDeadEnd: boolean;
  reason:
    | '404'
    | 'login_page'
    | 'empty_careers'
    | 'expired_ats'
    | 'blocked_robots'
    | 'no_internships'
    | null;
}

export interface AtsPattern {
  provider: string;
  patterns: string[];
  priority: number;
}

export interface MissionPipelineConfig {
  mission: string;
  pipeline: HopType[];
  maxDepth: number;
  priorityThreshold: number;
  branchExpansionLimit: number;
  deadEndPatterns: string[];
  atsPatterns: AtsPattern[];
}
