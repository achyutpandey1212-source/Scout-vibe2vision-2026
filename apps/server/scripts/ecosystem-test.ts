/**
 * Ecosystem Test CLI.
 *
 * Usage:
 *   npm run ecosystem:test -- yc
 *   npm run ecosystem:test -- thub
 *   npm run ecosystem:test -- nsrcel
 *   npm run ecosystem:test -- peakxv
 *   npm run ecosystem:test -- iisc
 *
 * Prints a deterministic per-ecosystem report. Never crawls.
 */
import { buildTestReport, formatTestReport } from '../src/discovery/ecosystem-intelligence';

function main(): void {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: npm run ecosystem:test -- <id>  (e.g. yc, thub, nsrcel, peakxv, iisc)');
    process.exit(1);
  }
  const report = buildTestReport(id);
  if (!report) {
    console.log(`\nEcosystem "${id}" not found in deterministic registry.`);
    console.log('Known test ids: yc, thub, nsrcel, peakxv, iisc');
    process.exit(1);
  }
  console.log(formatTestReport(report));
}

main();
