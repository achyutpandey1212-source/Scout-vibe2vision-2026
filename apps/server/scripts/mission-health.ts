import { MissionRunner, MissionPipelineInput } from '../src/discovery/mission-pipeline';

const missions = [
  'ENGINEERING_INTERNSHIPS',
  'STARTUP_INTERNSHIPS',
  'GOVERNMENT_TECH_INTERNSHIPS',
  'RESEARCH_INTERNSHIPS',
  'HACKATHONS',
] as const;

function buildInput(mission: string): MissionPipelineInput {
  return {
    mission,
    queries: [`sample query for ${mission}`],
    companyUrls: [],
    ecosystemCandidates: [],
    maxDepth: 4,
    priorityThreshold: 70,
    branchExpansionLimit: 10,
    visitedUrls: new Map(),
  };
}

const runner = new MissionRunner();

for (const mission of missions) {
  const input = buildInput(mission);
  const { result, health } = runner.run(input, { visualize: false });
  console.log(runner.formatResult(result));
  console.log('');
  console.log(runner.formatHealth(health));
  console.log('');
}
