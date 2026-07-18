import {
  HopNode,
  MissionPipelineConfig,
  MissionPipelineInput,
  MissionPipelineResult,
  MissionSummary,
} from './hop.types';
import { HopEngine } from './hop-engine';
import { createMissionContext, finalizeMissionContext, computeSummary } from './mission-context';
import { getMissionPipeline } from './hop-registry';

export class MissionPipeline {
  private readonly engine: HopEngine;

  constructor(engine?: HopEngine) {
    this.engine = engine ?? new HopEngine();
  }

  execute(input: MissionPipelineInput): MissionPipelineResult {
    const config = getMissionPipeline(input.mission);
    if (!config) {
      throw new Error(`No pipeline configuration found for mission: ${input.mission}`);
    }

    const context = createMissionContext(input.mission, input, config);
    this.engine.loadVisitedUrls(input.visitedUrls);

    const { root, stats, graphJson } = this.engine.run(input);

    const accepted: HopNode[] = [];
    const visited: HopNode[] = [];
    const deadEnds: HopNode[] = [];
    const skipped: HopNode[] = [];

    const extractNodes = (node: HopNode | null): void => {
      if (!node) return;
      if (node.status === 'accepted') accepted.push(node);
      else if (node.status === 'visited') visited.push(node);
      else if (node.status === 'dead_end') deadEnds.push(node);
      else if (node.status === 'skipped') skipped.push(node);
      for (const child of node.children) {
        extractNodes(child);
      }
    };

    extractNodes(root);

    const summary = computeSummary(context);
    finalizeMissionContext(context);

    return {
      mission: input.mission,
      root,
      accepted,
      visited,
      deadEnds,
      skipped,
      summary,
      stats,
      graphJson,
    };
  }

  formatRun(result: MissionPipelineResult): string {
    const s = result.summary;
    const pad = (label: string, value: number | string) => `${label}:`.padEnd(24) + `${value}`;
    const lines: string[] = [];
    lines.push('=================================');
    lines.push(`${s.mission} Mission`);
    lines.push('=================================');
    lines.push('');
    lines.push(pad('Queries', s.queries));
    lines.push(pad('Companies', s.companies));
    lines.push(pad('Career Pages', s.careerPages));
    lines.push(pad('ATS', s.ats));
    lines.push(pad('Portfolio', s.portfolio));
    lines.push(pad('Directories', s.directories));
    lines.push(pad('Ecosystems', s.ecosystems));
    lines.push(pad('Programs', s.programs));
    lines.push(pad('Applications', s.applications));
    lines.push(pad('Universities', s.universities));
    lines.push(pad('Labs', s.labs));
    lines.push(pad('Platforms', s.platforms));
    lines.push(pad('Events', s.events));
    lines.push(pad('Organizations', s.organizations));
    lines.push(pad('Internship Pages', s.internshipPages));
    lines.push(pad('Dead Ends', s.deadEnds));
    lines.push(pad('Accepted Opportunities', s.acceptedOpportunities));
    lines.push(pad('Average Branch Size', s.averageBranchSize));
    lines.push(pad('Average Recall', s.averageRecall));
    lines.push('=================================');
    return lines.join('\n');
  }
}
