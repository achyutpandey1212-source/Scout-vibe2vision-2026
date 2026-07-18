import * as fs from 'fs';
import * as path from 'path';
import { EcosystemEngine } from './ecosystem-engine';
import { EcosystemHealthReport } from './ecosystem-health';
import { getEcosystem, allCities } from './ecosystem-registry';
import { scoreEcosystem } from './ecosystem-score';
import { EcosystemTestReport } from './ecosystem.types';

/**
 * CLI entrypoints for the Ecosystem Intelligence Engine.
 *
 *   npm run ecosystem:health
 *   npm run ecosystem:test <id>   (e.g. yc, thub, nsrcel, peakxv, iisc)
 *
 * Deterministic only — never crawls.
 */

const KNOWN_TEST_IDS = ['yc', 'thub', 'nsrcel', 'peakxv', 'iisc'];

export function buildTestReport(id: string): EcosystemTestReport | null {
  const eco = getEcosystem(id);
  if (!eco) return null;

  const engine = new EcosystemEngine();
  const result = engine.runOne(id);

  const score = scoreEcosystem(eco);
  const cities = allCities()
    .filter((c) => c.majorIncubators.includes(eco.id) || eco.knownIncubators.includes(c.city))
    .map((c) => c.city);

  return {
    ecosystem: eco.name,
    priority: eco.priority,
    score: score.ecosystemScore,
    companies: result.companies.length,
    portfolio: result.discoveryResults[0]?.portfolioPages.length ?? 0,
    careerPages: result.discoveryResults[0]?.careerPages.length ?? 0,
    ats: result.discoveryResults[0]?.atsPages.length ?? 0,
    expectedYield: score.expectedOpportunityYield,
    knownCities: cities,
    knownDomains: eco.knownDomains,
  };
}

export function formatTestReport(report: EcosystemTestReport): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('Ecosystem:'.padEnd(16) + report.ecosystem);
  lines.push('Priority:'.padEnd(16) + report.priority);
  lines.push('Score:'.padEnd(16) + report.score);
  lines.push('Companies:'.padEnd(16) + report.companies);
  lines.push('Portfolio:'.padEnd(16) + report.portfolio);
  lines.push('Career Pages:'.padEnd(16) + report.careerPages);
  lines.push('ATS:'.padEnd(16) + report.ats);
  lines.push('Expected Yield:'.padEnd(16) + report.expectedYield);
  lines.push('Known Cities:'.padEnd(16) + (report.knownCities.join(', ') || '—'));
  lines.push('Known Domains:'.padEnd(16) + (report.knownDomains.join(', ') || '—'));
  lines.push('');
  return lines.join('\n');
}

/**
 * Writes deterministic JSON reports to planner-logs/.
 */
export function saveReports(dir = path.join(process.cwd(), 'planner-logs')): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const date = new Date().toISOString().split('T')[0];

  const health = new EcosystemHealthReport().build();
  fs.writeFileSync(
    path.join(dir, `ecosystem-health-${date}.json`),
    JSON.stringify(health, null, 2),
  );

  const engine = new EcosystemEngine();
  const run = engine.run('ECOSYSTEM_INTELLIGENCE');
  const summary = {
    mission: run.mission,
    ecosystemsVisited: run.visited,
    portfolioCompanies: run.companies.length,
    candidates: run.candidates.length,
    averageScore: run.summary.averageScore,
    topEcosystems: run.scores.slice(0, 10).map((s) => ({
      id: s.ecosystemId,
      name: s.ecosystemName,
      score: s.ecosystemScore,
    })),
    generatedAt: run.summary.generatedAt,
  };
  fs.writeFileSync(
    path.join(dir, `ecosystem-summary-${date}.json`),
    JSON.stringify(summary, null, 2),
  );
}

export { KNOWN_TEST_IDS };

/**
 * Run the CLI. Exposed for the npm scripts (`scripts/ecosystem-*.ts`).
 */
export async function main(argv: string[]): Promise<void> {
  const command = argv[0];
  if (command === 'health') {
    const report = new EcosystemHealthReport();
    const health = report.build();
    console.log(report.format(health));
    saveReports();
    console.log('\nReports saved to planner-logs/ (ecosystem-health.json, ecosystem-summary.json)');
    return;
  }

  const id = command;
  if (!id) {
    console.error('Usage: npm run ecosystem:test -- <id>  (e.g. yc, thub, nsrcel, peakxv, iisc)');
    process.exit(1);
  }
  const report = buildTestReport(id);
  if (!report) {
    console.log(`\nEcosystem "${id}" not found in deterministic registry.`);
    console.log(`Known test ids: ${KNOWN_TEST_IDS.join(', ')}`);
    process.exit(1);
  }
  console.log(formatTestReport(report));
}
