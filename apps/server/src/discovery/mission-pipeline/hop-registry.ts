import { HopGraph, HopTransition, HopType, MissionPipelineConfig } from './hop.types';

export const HOP_TYPE_META: Record<HopType, { priority: number; label: string }> = {
  SEARCH: { priority: 100, label: 'Search' },
  ECOSYSTEM: { priority: 90, label: 'Ecosystem' },
  PORTFOLIO: { priority: 88, label: 'Portfolio' },
  COMPANY: { priority: 92, label: 'Company' },
  CAREERS: { priority: 100, label: 'Careers' },
  ATS: { priority: 98, label: 'ATS' },
  OPPORTUNITY: { priority: 100, label: 'Opportunity' },
  DIRECTORY: { priority: 70, label: 'Directory' },
  UNIVERSITY: { priority: 85, label: 'University' },
  RESEARCH: { priority: 82, label: 'Research' },
  PROGRAM: { priority: 80, label: 'Program' },
  APPLICATION: { priority: 95, label: 'Application' },
  LAB: { priority: 82, label: 'Lab' },
  PROJECT: { priority: 78, label: 'Project' },
  PLATFORM: { priority: 85, label: 'Platform' },
  EVENT: { priority: 80, label: 'Event' },
  REGISTRATION: { priority: 90, label: 'Registration' },
  ORGANIZATION: { priority: 78, label: 'Organization' },
  INTERNSHIP: { priority: 96, label: 'Internship' },
};

export const ALLOWED_TRANSITIONS: HopTransition[] = [
  { from: 'SEARCH', to: 'COMPANY', allowed: true },
  { from: 'SEARCH', to: 'PORTFOLIO', allowed: true },
  { from: 'SEARCH', to: 'DIRECTORY', allowed: true },
  { from: 'SEARCH', to: 'CAREERS', allowed: true },
  { from: 'SEARCH', to: 'ECOSYSTEM', allowed: true },
  { from: 'SEARCH', to: 'UNIVERSITY', allowed: true },
  { from: 'SEARCH', to: 'RESEARCH', allowed: true },
  { from: 'SEARCH', to: 'LAB', allowed: true },
  { from: 'SEARCH', to: 'PLATFORM', allowed: true },
  { from: 'SEARCH', to: 'ORGANIZATION', allowed: true },
  { from: 'ECOSYSTEM', to: 'PORTFOLIO', allowed: true },
  { from: 'ECOSYSTEM', to: 'COMPANY', allowed: true },
  { from: 'ECOSYSTEM', to: 'DIRECTORY', allowed: true },
  { from: 'PORTFOLIO', to: 'COMPANY', allowed: true },
  { from: 'PORTFOLIO', to: 'CAREERS', allowed: true },
  { from: 'COMPANY', to: 'CAREERS', allowed: true },
  { from: 'COMPANY', to: 'ATS', allowed: true },
  { from: 'COMPANY', to: 'DIRECTORY', allowed: true },
  { from: 'CAREERS', to: 'ATS', allowed: true },
  { from: 'CAREERS', to: 'OPPORTUNITY', allowed: true },
  { from: 'CAREERS', to: 'INTERNSHIP', allowed: true },
  { from: 'ATS', to: 'OPPORTUNITY', allowed: true },
  { from: 'ATS', to: 'INTERNSHIP', allowed: true },
  { from: 'UNIVERSITY', to: 'PROGRAM', allowed: true },
  { from: 'UNIVERSITY', to: 'CAREERS', allowed: true },
  { from: 'UNIVERSITY', to: 'RESEARCH', allowed: true },
  { from: 'RESEARCH', to: 'LAB', allowed: true },
  { from: 'RESEARCH', to: 'PROGRAM', allowed: true },
  { from: 'LAB', to: 'PROJECT', allowed: true },
  { from: 'LAB', to: 'CAREERS', allowed: true },
  { from: 'LAB', to: 'OPPORTUNITY', allowed: true },
  { from: 'PROJECT', to: 'CAREERS', allowed: true },
  { from: 'PROJECT', to: 'OPPORTUNITY', allowed: true },
  { from: 'PROGRAM', to: 'APPLICATION', allowed: true },
  { from: 'PROGRAM', to: 'OPPORTUNITY', allowed: true },
  { from: 'PROGRAM', to: 'INTERNSHIP', allowed: true },
  { from: 'APPLICATION', to: 'OPPORTUNITY', allowed: true },
  { from: 'APPLICATION', to: 'INTERNSHIP', allowed: true },
  { from: 'ORGANIZATION', to: 'PROGRAM', allowed: true },
  { from: 'ORGANIZATION', to: 'APPLICATION', allowed: true },
  { from: 'ORGANIZATION', to: 'CAREERS', allowed: true },
  { from: 'PLATFORM', to: 'EVENT', allowed: true },
  { from: 'PLATFORM', to: 'REGISTRATION', allowed: true },
  { from: 'EVENT', to: 'REGISTRATION', allowed: true },
  { from: 'EVENT', to: 'OPPORTUNITY', allowed: true },
  { from: 'REGISTRATION', to: 'OPPORTUNITY', allowed: true },
];

export const MISSION_PIPELINES: Record<string, MissionPipelineConfig> = {
  ENGINEERING_INTERNSHIPS: {
    mission: 'ENGINEERING_INTERNSHIPS',
    pipeline: ['SEARCH', 'COMPANY', 'CAREERS', 'ATS', 'OPPORTUNITY'],
    maxDepth: 4,
    priorityThreshold: 70,
    branchExpansionLimit: 50,
    deadEndPatterns: ['/login', '/signin', '/auth', '/403', '/404'],
    atsPatterns: [
      {
        provider: 'Greenhouse',
        patterns: ['boards.greenhouse.io', 'greenhouse.io'],
        priority: 100,
      },
      { provider: 'Lever', patterns: ['jobs.lever.co', 'lever.co'], priority: 98 },
      { provider: 'Ashby', patterns: ['jobs.ashbyhq.com', 'ashbyhq.com'], priority: 98 },
      { provider: 'SmartRecruiters', patterns: ['smartrecruiters.com'], priority: 96 },
      { provider: 'Workable', patterns: ['workable.com'], priority: 95 },
      { provider: 'Jobvite', patterns: ['jobvite.com'], priority: 94 },
      { provider: 'TeamTailor', patterns: ['teamtailor.com'], priority: 93 },
      { provider: 'BambooHR', patterns: ['bamboohr.com'], priority: 92 },
      { provider: 'Rippling', patterns: ['rippling.com'], priority: 91 },
      { provider: 'Comeet', patterns: ['comeet.com'], priority: 90 },
    ],
  },
  STARTUP_INTERNSHIPS: {
    mission: 'STARTUP_INTERNSHIPS',
    pipeline: ['SEARCH', 'ECOSYSTEM', 'PORTFOLIO', 'COMPANY', 'CAREERS', 'ATS', 'OPPORTUNITY'],
    maxDepth: 6,
    priorityThreshold: 65,
    branchExpansionLimit: 100,
    deadEndPatterns: ['/login', '/signin', '/auth', '/403', '/404'],
    atsPatterns: [
      {
        provider: 'Greenhouse',
        patterns: ['boards.greenhouse.io', 'greenhouse.io'],
        priority: 100,
      },
      { provider: 'Lever', patterns: ['jobs.lever.co', 'lever.co'], priority: 98 },
      { provider: 'Ashby', patterns: ['jobs.ashbyhq.com', 'ashbyhq.com'], priority: 98 },
      { provider: 'Workable', patterns: ['workable.com'], priority: 95 },
      { provider: 'Comeet', patterns: ['comeet.com'], priority: 90 },
    ],
  },
  GOVERNMENT_TECH_INTERNSHIPS: {
    mission: 'GOVERNMENT_TECH_INTERNSHIPS',
    pipeline: ['SEARCH', 'ORGANIZATION', 'PROGRAM', 'APPLICATION', 'OPPORTUNITY'],
    maxDepth: 4,
    priorityThreshold: 75,
    branchExpansionLimit: 30,
    deadEndPatterns: ['/login', '/signin', '/auth', '/403', '/404'],
    atsPatterns: [],
  },
  RESEARCH_INTERNSHIPS: {
    mission: 'RESEARCH_INTERNSHIPS',
    pipeline: ['SEARCH', 'LAB', 'PROJECT', 'CAREERS', 'OPPORTUNITY'],
    maxDepth: 4,
    priorityThreshold: 72,
    branchExpansionLimit: 40,
    deadEndPatterns: ['/login', '/signin', '/auth', '/403', '/404'],
    atsPatterns: [],
  },
  HACKATHONS: {
    mission: 'HACKATHONS',
    pipeline: ['SEARCH', 'PLATFORM', 'EVENT', 'REGISTRATION', 'OPPORTUNITY'],
    maxDepth: 4,
    priorityThreshold: 68,
    branchExpansionLimit: 50,
    deadEndPatterns: ['/login', '/signin', '/auth', '/403', '/404'],
    atsPatterns: [],
  },
};

export function getMissionPipeline(mission: string): MissionPipelineConfig | undefined {
  return MISSION_PIPELINES[mission];
}

export function getHopPriority(hopType: HopType): number {
  return HOP_TYPE_META[hopType]?.priority ?? 0;
}

export function isTransitionAllowed(from: HopType, to: HopType): boolean {
  return ALLOWED_TRANSITIONS.some((t) => t.from === from && t.to === to && t.allowed);
}

export function getAllowedTransitions(from: HopType): HopType[] {
  return ALLOWED_TRANSITIONS.filter((t) => t.from === from && t.allowed).map((t) => t.to);
}

export function buildHopGraph(mission: string, pipeline: HopType[], maxDepth: number): HopGraph {
  const transitions: HopTransition[] = [];
  for (let i = 0; i < pipeline.length - 1; i++) {
    transitions.push({ from: pipeline[i], to: pipeline[i + 1], allowed: true });
  }
  return {
    mission,
    start: pipeline[0] ?? 'SEARCH',
    transitions,
    maxDepth,
    priorityThreshold: getMissionPipeline(mission)?.priorityThreshold ?? 70,
  };
}

export function classifyUrl(
  url: string,
  atsPatterns: { provider: string; patterns: string[] }[],
): { hopType: HopType; confidence: number } | null {
  const lower = url.toLowerCase();
  for (const ats of atsPatterns) {
    for (const pattern of ats.patterns) {
      if (lower.includes(pattern)) {
        return {
          hopType: 'ATS',
          confidence: ats.provider === 'Greenhouse' || ats.provider === 'Lever' ? 95 : 85,
        };
      }
    }
  }
  if (lower.includes('/careers') || lower.includes('/jobs') || lower.includes('/hiring')) {
    return { hopType: 'CAREERS', confidence: 90 };
  }
  if (lower.includes('/about') || lower.includes('/company') || lower.includes('/team')) {
    return { hopType: 'COMPANY', confidence: 70 };
  }
  if (lower.includes('/portfolio') || lower.includes('/companies')) {
    return { hopType: 'PORTFOLIO', confidence: 85 };
  }
  if (lower.includes('/program') || lower.includes('/internship-program')) {
    return { hopType: 'PROGRAM', confidence: 80 };
  }
  if (lower.includes('/apply') || lower.includes('/application')) {
    return { hopType: 'APPLICATION', confidence: 85 };
  }
  if (lower.includes('/lab') || lower.includes('/research-lab')) {
    return { hopType: 'LAB', confidence: 75 };
  }
  if (lower.includes('/project')) {
    return { hopType: 'PROJECT', confidence: 70 };
  }
  if (lower.includes('/event') || lower.includes('/hackathon') || lower.includes('/competition')) {
    return { hopType: 'EVENT', confidence: 80 };
  }
  if (lower.includes('/register') || lower.includes('/registration')) {
    return { hopType: 'REGISTRATION', confidence: 85 };
  }
  if (lower.includes('/university') || lower.includes('/campus') || lower.includes('/college')) {
    return { hopType: 'UNIVERSITY', confidence: 80 };
  }
  if (lower.includes('/organization') || lower.includes('/organisation')) {
    return { hopType: 'ORGANIZATION', confidence: 70 };
  }
  if (lower.includes('intern') || lower.includes('internship')) {
    return { hopType: 'INTERNSHIP', confidence: 88 };
  }
  if (lower.includes('/directory') || lower.includes('/list')) {
    return { hopType: 'DIRECTORY', confidence: 60 };
  }
  return null;
}
