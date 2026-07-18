/**
 * Ecosystem Health CLI.
 *
 * Usage:
 *   npm run ecosystem:health
 *
 * Prints the ecosystem health report and saves JSON to planner-logs/.
 */
import { EcosystemHealthReport, saveReports } from '../src/discovery/ecosystem-intelligence';

function main(): void {
  const report = new EcosystemHealthReport();
  const health = report.build();
  console.log(report.format(health));

  saveReports();

  console.log('\nReports saved to planner-logs/ (ecosystem-health.json, ecosystem-summary.json)');
}

main();
