import {
  HopNode,
  MissionPipelineConfig,
  MissionPipelineInput,
  MissionPipelineResult,
  MissionSummary,
} from './hop.types';

export interface MissionContext {
  mission: string;
  config: MissionPipelineConfig;
  input: MissionPipelineInput;
  result: MissionPipelineResult;
  startTime: number;
  endTime: number;
}

export function createMissionContext(
  mission: string,
  input: MissionPipelineInput,
  config: MissionPipelineConfig,
): MissionContext {
  const summary: MissionSummary = {
    mission,
    queries: 0,
    companies: 0,
    careerPages: 0,
    ats: 0,
    portfolio: 0,
    directories: 0,
    ecosystems: 0,
    programs: 0,
    applications: 0,
    universities: 0,
    labs: 0,
    platforms: 0,
    events: 0,
    organizations: 0,
    internshipPages: 0,
    deadEnds: 0,
    acceptedOpportunities: 0,
    averageBranchSize: 0,
    averageRecall: 0,
    generatedAt: new Date().toISOString(),
  };

  return {
    mission,
    config,
    input,
    result: {
      mission,
      root: null,
      accepted: [],
      visited: [],
      deadEnds: [],
      skipped: [],
      summary,
      stats: {},
      graphJson: {},
    },
    startTime: Date.now(),
    endTime: 0,
  };
}

export function finalizeMissionContext(context: MissionContext): MissionContext {
  context.endTime = Date.now();
  return context;
}

export function computeSummary(context: MissionContext): MissionSummary {
  const stats = context.result.stats;
  const summary = context.result.summary;
  summary.queries = stats.queries ?? 0;
  summary.companies = stats.companies ?? 0;
  summary.careerPages = stats.careers ?? 0;
  summary.ats = stats.ats ?? 0;
  summary.portfolio = stats.portfolio ?? 0;
  summary.directories = stats.directories ?? 0;
  summary.ecosystems = stats.ecosystems ?? 0;
  summary.programs = stats.programs ?? 0;
  summary.applications = stats.applications ?? 0;
  summary.universities = stats.universities ?? 0;
  summary.labs = stats.labs ?? 0;
  summary.platforms = stats.platforms ?? 0;
  summary.events = stats.events ?? 0;
  summary.organizations = stats.organizations ?? 0;
  summary.internshipPages = stats.internships ?? 0;
  summary.deadEnds = stats.deadEnds ?? 0;
  summary.acceptedOpportunities = stats.acceptedOpportunities ?? 0;

  const allChildren = context.result.root?.children ?? [];
  const branchSizes = allChildren.map((c) => countNodes(c));
  const avgSize =
    branchSizes.length > 0 ? branchSizes.reduce((a, b) => a + b, 0) / branchSizes.length : 0;
  summary.averageBranchSize = Math.round(avgSize * 10) / 10;
  summary.averageRecall =
    summary.queries > 0
      ? Math.round((summary.acceptedOpportunities / summary.queries) * 100) / 100
      : 0;
  summary.generatedAt = new Date().toISOString();
  return summary;
}

function countNodes(node: HopNode): number {
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}
