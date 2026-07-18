/**
 * Manual Company Discovery verification CLI.
 *
 * Usage:
 *   npm run company:test -- google
 *   npm run company:test -- cursor
 *   npm run company:test -- supabase
 *
 * Inspects deterministic logic ONLY. It never runs a full Discovery crawl.
 * It seeds the curated registry and reports what the engine would know about a
 * given company.
 */
import {
  CompanyDiscoveryEngine,
  resolveCanonicalName,
  isKnownUnicorn,
} from '../src/discovery/company-discovery';
import { normalizeHost } from '../src/discovery/company-discovery/ecosystem-config';

async function main(): Promise<void> {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: npm run company:test -- <company>');
    process.exit(1);
  }

  const engine = new CompanyDiscoveryEngine();
  // Deterministic seed (no network). Inspects logic, does not crawl.
  await engine.discover('STARTUP_INTERNSHIPS', {
    detectAts: false,
    verifyCareers: false,
    verifyAts: false,
  });
  const registry = engine.getRegistry();

  const canonical = resolveCanonicalName(arg);
  const byName = registry.get(canonical);
  const byHost = registry.getByWebsite(arg);

  const record = byName || byHost;

  if (!record) {
    console.log('');
    console.log('Company:'.padEnd(20) + arg);
    console.log('Status:'.padEnd(20) + 'NOT FOUND in deterministic registry');
    console.log('Known Unicorn:'.padEnd(20) + (isKnownUnicorn(arg) ? 'Yes' : 'No'));
    console.log('');
    console.log('Tip: add the company to an ecosystem in ecosystem-config.ts.');
    return;
  }

  const lines: string[] = [];
  lines.push('');
  lines.push('Company:'.padEnd(20) + record.canonicalName);
  lines.push('Official Domain:'.padEnd(20) + normalizeHost(record.website));
  lines.push('Careers URL:'.padEnd(20) + (record.careersUrl || 'N/A'));
  lines.push(
    'Verified:'.padEnd(20) + `career=${record.careerPageVerified} ats=${record.atsVerified}`,
  );
  lines.push('ATS:'.padEnd(20) + record.ats);
  lines.push('Confidence:'.padEnd(20) + `${record.companyConfidence}/100`);
  lines.push('Priority:'.padEnd(20) + `${record.companyPriority}/100`);
  lines.push('Score:'.padEnd(20) + `${record.companyScore}/100`);
  lines.push(
    'Registry Entry:'.padEnd(20) +
      `aliases=${record.aliases.join(', ')} | stage=${record.stage || '?'} | type=${record.type || '?'}`,
  );
  lines.push('Known Ecosystems:'.padEnd(20) + (record.ecosystemLabel || record.ecosystem));
  lines.push('Portfolio Sources:'.padEnd(20) + (record.source || 'N/A'));
  lines.push('Country:'.padEnd(20) + `${record.country}${record.city ? ' / ' + record.city : ''}`);
  lines.push('Last Seen:'.padEnd(20) + new Date(record.lastSeen).toISOString());
  lines.push('');
  console.log(lines.join('\n'));
}

main().catch((err) => {
  console.error('company:test failed:', err);
  process.exit(1);
});
