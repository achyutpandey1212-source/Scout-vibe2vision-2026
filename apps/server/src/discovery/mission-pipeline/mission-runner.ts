import {
  type MissionHealth,
  MissionPipelineInput,
  MissionPipelineResult,
  MissionSummary,
} from './hop.types';
import { MissionPipeline } from './mission-pipeline';
import { MissionHealthReporter } from './mission-health';
import { getMissionPipeline } from './hop-registry';
import fs from 'fs';

export interface MissionRunnerOptions {
  maxDepth?: number;
  priorityThreshold?: number;
  branchExpansionLimit?: number;
  visualize?: boolean;
  visualizePath?: string;
}

export class MissionRunner {
  private readonly pipeline: MissionPipeline;
  private readonly healthReporter: MissionHealthReporter;
  private readonly plannerLogsDir: string;

  constructor(
    pipeline?: MissionPipeline,
    healthReporter?: MissionHealthReporter,
    plannerLogsDir = 'planner-logs',
  ) {
    this.pipeline = pipeline ?? new MissionPipeline();
    this.healthReporter = healthReporter ?? new MissionHealthReporter();
    this.plannerLogsDir = plannerLogsDir;
  }

  run(
    input: MissionPipelineInput,
    options: MissionRunnerOptions = {},
  ): { result: MissionPipelineResult; health: MissionHealth } {
    const config = getMissionPipeline(input.mission);
    const maxDepth = options.maxDepth ?? config?.maxDepth ?? input.maxDepth;
    const priorityThreshold =
      options.priorityThreshold ?? config?.priorityThreshold ?? input.priorityThreshold;
    const branchExpansionLimit =
      options.branchExpansionLimit ?? config?.branchExpansionLimit ?? input.branchExpansionLimit;

    const result = this.pipeline.execute({
      ...input,
      maxDepth,
      priorityThreshold,
      branchExpansionLimit,
    });

    if (options.visualize) {
      this.visualize(result, options.visualizePath);
    }

    const health = this.healthReporter.generate(result);
    return { result, health };
  }

  formatResult(result: MissionPipelineResult): string {
    return this.pipeline.formatRun(result);
  }

  formatHealth(health: MissionHealth): string {
    return this.healthReporter.format(health);
  }

  private visualize(result: MissionPipelineResult, path?: string): void {
    const filename = path ?? `${this.plannerLogsDir}/mission-graph.json`;
    const dir = filename.substring(0, filename.lastIndexOf('/') || filename.lastIndexOf('\\'));
    if (dir) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filename, JSON.stringify(result.graphJson, null, 2));
    }
  }
}

export function runMission(
  input: MissionPipelineInput,
  options: MissionRunnerOptions = {},
): { result: MissionPipelineResult; health: MissionHealth } {
  const runner = new MissionRunner();
  return runner.run(input, options);
}

export function formatMissionSummary(summary: MissionSummary): string {
  const pad = (label: string, value: number | string) => `${label}:`.padEnd(24) + `${value}`;
  const lines: string[] = [];
  lines.push('=================================');
  lines.push(`${summary.mission} Mission`);
  lines.push('=================================');
  lines.push('');
  lines.push(pad('Queries', summary.queries));
  lines.push(pad('Companies', summary.companies));
  lines.push(pad('Career Pages', summary.careerPages));
  lines.push(pad('ATS', summary.ats));
  lines.push(pad('Portfolio', summary.portfolio));
  lines.push(pad('Directories', summary.directories));
  lines.push(pad('Ecosystems', summary.ecosystems));
  lines.push(pad('Programs', summary.programs));
  lines.push(pad('Applications', summary.applications));
  lines.push(pad('Universities', summary.universities));
  lines.push(pad('Labs', summary.labs));
  lines.push(pad('Platforms', summary.platforms));
  lines.push(pad('Events', summary.events));
  lines.push(pad('Organizations', summary.organizations));
  lines.push(pad('Internship Pages', summary.internshipPages));
  lines.push(pad('Dead Ends', summary.deadEnds));
  lines.push(pad('Accepted Opportunities', summary.acceptedOpportunities));
  lines.push(pad('Average Branch Size', summary.averageBranchSize));
  lines.push(pad('Average Recall', summary.averageRecall));
  lines.push('=================================');
  return lines.join('\n');
}
