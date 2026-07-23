import { HopNode, MissionHealth, MissionPipelineResult } from './hop.types';
import { getMissionPipeline } from './hop-registry';

export class MissionHealthReporter {
  generate(result: MissionPipelineResult): MissionHealth {
    const s = result.summary;
    const totalNodes =
      s.companies +
      s.careerPages +
      s.ats +
      s.portfolio +
      s.directories +
      s.ecosystems +
      s.programs +
      s.applications +
      s.universities +
      s.labs +
      s.platforms +
      s.events +
      s.organizations +
      s.internshipPages +
      s.deadEnds;
    const coverage = totalNodes > 0 ? Math.round((s.acceptedOpportunities / totalNodes) * 100) : 0;
    const config = getMissionPipeline(result.mission);
    const maxDepth = config?.maxDepth ?? 4;
    const depths = this.collectDepths(result.root, 0);
    const averageHopDepth =
      depths.length > 0
        ? Math.round((depths.reduce((a, b) => a + b, 0) / depths.length) * 10) / 10
        : 0;
    const branchSizes = this.collectBranchSizes(result.root);
    const averageBranchSize =
      branchSizes.length > 0
        ? Math.round((branchSizes.reduce((a, b) => a + b, 0) / branchSizes.length) * 10) / 10
        : 0;

    return {
      mission: result.mission,
      coverage,
      averageHopDepth,
      companiesFound: s.companies,
      careerPages: s.careerPages,
      ats: s.ats,
      portfolioPages: s.portfolio,
      directories: s.directories,
      deadEnds: s.deadEnds,
      acceptedOpportunities: s.acceptedOpportunities,
      averageBranchSize,
      averageRecall: s.averageRecall,
    };
  }

  format(health: MissionHealth): string {
    const pad = (label: string, value: number | string) => `${label}:`.padEnd(28) + `${value}`;
    const lines: string[] = [];
    lines.push('====================================');
    lines.push('Mission Coverage');
    lines.push('====================================');
    lines.push(pad('Mission', health.mission));
    lines.push(pad('Coverage', `${health.coverage}%`));
    lines.push(pad('Average Hop Depth', health.averageHopDepth));
    lines.push(pad('Companies Found', health.companiesFound));
    lines.push(pad('Career Pages', health.careerPages));
    lines.push(pad('ATS', health.ats));
    lines.push(pad('Portfolio Pages', health.portfolioPages));
    lines.push(pad('Directories', health.directories));
    lines.push(pad('Dead Ends', health.deadEnds));
    lines.push(pad('Accepted Opportunities', health.acceptedOpportunities));
    lines.push(pad('Average Branch Size', health.averageBranchSize));
    lines.push(pad('Average Recall', health.averageRecall));
    lines.push('====================================');
    return lines.join('\n');
  }

  private collectDepths(node: HopNode | null, _currentDepth: number): number[] {
    if (!node) return [];
    const depths = [node.depth];
    for (const child of node.children) {
      depths.push(...this.collectDepths(child, _currentDepth + 1));
    }
    return depths;
  }

  private collectBranchSizes(node: HopNode | null): number[] {
    if (!node) return [];
    if (node.children.length > 0) {
      return [node.children.length, ...node.children.flatMap((c) => this.collectBranchSizes(c))];
    }
    return [];
  }
}
