/**
 * Company Discovery health check CLI.
 *
 * Usage:
 *   npm run company:health
 *
 * Prints a health report (registry size, coverage, top/newest companies) and
 * saves it as JSON. Inspects deterministic logic only — never crawls.
 */
import { CompanyDiscoveryEngine } from '../src/discovery/company-discovery';
import * as fs from 'fs';
import * as path from 'path';

async function main(): Promise<void> {
  const engine = new CompanyDiscoveryEngine();
  await engine.discover('STARTUP_INTERNSHIPS', {
    detectAts: false,
    verifyCareers: false,
    verifyAts: false,
  });

  const health = engine.health();

  console.log('');
  console.log('=========================================');
  console.log('Company Discovery Health');
  console.log('=========================================');
  console.log(`Registry Size:`.padEnd(28) + health.registrySize);
  console.log(`Companies with Careers:`.padEnd(28) + health.companiesWithCareers);
  console.log(`Companies with ATS:`.padEnd(28) + health.companiesWithAts);
  console.log(`Companies without Careers:`.padEnd(28) + health.companiesWithoutCareers);
  console.log(`Companies without ATS:`.padEnd(28) + health.companiesWithoutAts);
  console.log(`Average Score:`.padEnd(28) + health.averageScore);
  console.log(`Average Confidence:`.padEnd(28) + health.averageConfidence);
  console.log('');
  console.log('Top 20 Companies:');
  for (const c of health.top20Companies) {
    console.log(`  ${c.canonicalName}`.padEnd(28) + `priority=${c.companyPriority}`);
  }
  console.log('');
  console.log('Newest Companies:');
  for (const c of health.newestCompanies.slice(0, 10)) {
    console.log(`  ${c.canonicalName}`.padEnd(28) + new Date(c.lastSeen).toISOString());
  }
  console.log('=========================================');
  console.log('');

  const outDir = path.join(process.cwd(), 'planner-logs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const date = new Date().toISOString().split('T')[0];
  const outPath = path.join(outDir, `company-health-${date}.json`);
  fs.writeFileSync(outPath, JSON.stringify(health, null, 2));
  console.log(`Health report saved to ${outPath}`);
}

main().catch((err) => {
  console.error('company:health failed:', err);
  process.exit(1);
});
