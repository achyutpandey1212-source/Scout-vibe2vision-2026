import { describe, it, expect } from 'vitest';
import { allCities, allEcosystems, getEcosystem, normalizeHost } from './ecosystem-registry';
import { PortfolioDiscovery } from './portfolio-discovery';
import { IncubatorDiscovery } from './incubator-discovery';
import { AcceleratorDiscovery } from './accelerator-discovery';
import { UniversityDiscovery } from './university-discovery';
import { CityDiscovery } from './city-discovery';
import { EcosystemDiscovery } from './ecosystem-discovery';
import { scoreEcosystem, scoreAllEcosystems, filterEcosystemsForMission } from './ecosystem-score';
import { EcosystemEngine } from './ecosystem-engine';
import { EcosystemHealthReport } from './ecosystem-health';
import { buildTestReport } from './ecosystem-cli';

describe('ecosystem-registry', () => {
  it('registers every ecosystem with a unique id', () => {
    const ids = allEcosystems().map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no duplicate cities', () => {
    // city uniqueness is enforced via getCity lookup map; ensure allCities unique
    const names = allCities().map((c: { city: string }) => c.city.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('resolves known ecosystems by id', () => {
    expect(getEcosystem('yc')?.name).toBe('Y Combinator');
    expect(getEcosystem('thub')?.name).toBe('T-Hub');
    expect(getEcosystem('iisc')?.name).toBe('IISc');
    expect(getEcosystem('nope')).toBeUndefined();
  });

  it('normalizes hosts deterministically', () => {
    expect(normalizeHost('https://www.OpenAI.com/')).toBe('openai.com');
    expect(normalizeHost('http://stripe.com')).toBe('stripe.com');
  });
});

describe('PortfolioDiscovery', () => {
  const strategy = new PortfolioDiscovery();

  it('maps YC to portfolio companies + careers + candidate URLs', () => {
    const eco = getEcosystem('yc')!;
    expect(strategy.supports(eco)).toBe(true);
    const r = strategy.discover(eco);
    expect(r.companies.length).toBeGreaterThan(0);
    expect(r.companies.some((c) => c.website === 'https://openai.com')).toBe(true);
    expect(r.portfolioPages[0]).toBe('https://www.ycombinator.com/companies');
    expect(r.candidateUrls.length).toBeGreaterThan(0);
  });

  it('emits an ATS page when the ecosystem declares a known ATS', () => {
    const eco = getEcosystem('openai')!;
    const r = strategy.discover(eco);
    expect(r.atsPages.some((u) => u.includes('greenhouse'))).toBe(true);
  });

  it('does not apply to ecosystems without a portfolio page', () => {
    const eco = getEcosystem('drdo')!;
    expect(strategy.supports(eco)).toBe(false);
  });
});

describe('IncubatorDiscovery', () => {
  const strategy = new IncubatorDiscovery();

  it('applies to Indian startup ecosystems', () => {
    const eco = getEcosystem('thub')!;
    expect(strategy.supports(eco)).toBe(true);
  });

  it('maps T-Hub to startup listings + programs + career pages', () => {
    const eco = getEcosystem('thub')!;
    const r = strategy.discover(eco);
    expect(r.programPages.length).toBeGreaterThan(0);
    expect(r.careerPages).toContain('https://www.t-hub.co/careers');
    expect(r.candidateUrls.length).toBeGreaterThan(0);
  });

  it('does not apply to pure accelerators', () => {
    const eco = getEcosystem('yc')!;
    // Accelerators also expose portfolio but IncubatorDiscovery targets
    // INDIAN_STARTUP_ECOSYSTEM / VC_ECOSYSTEM.
    expect(strategy.supports(eco)).toBe(false);
  });
});

describe('AcceleratorDiscovery', () => {
  const strategy = new AcceleratorDiscovery();

  it('applies only to accelerators', () => {
    expect(strategy.supports(getEcosystem('yc')!)).toBe(true);
    expect(strategy.supports(getEcosystem('thub')!)).toBe(false);
  });

  it('maps Techstars to startups + demo-day programs', () => {
    const eco = getEcosystem('techstars')!;
    const r = strategy.discover(eco);
    expect(r.startupListings.length).toBeGreaterThan(0);
    expect(r.programPages.some((p) => p.includes('demo-day') || p.includes('Demo'))).toBe(true);
  });
});

describe('UniversityDiscovery', () => {
  const strategy = new UniversityDiscovery();

  it('applies to research ecosystems with universities', () => {
    expect(strategy.supports(getEcosystem('iisc')!)).toBe(true);
    expect(strategy.supports(getEcosystem('yc')!)).toBe(false);
  });

  it('maps IISc to universities + research internship pages', () => {
    const eco = getEcosystem('iisc')!;
    const r = strategy.discover(eco);
    expect(r.directories.some((d) => d.startsWith('university:'))).toBe(true);
    expect(r.careerPages.some((c) => c.includes('iisc.ac.in'))).toBe(true);
    expect(r.programPages.some((p) => p.toLowerCase().includes('fellow'))).toBe(true);
  });
});

describe('CityDiscovery', () => {
  const strategy = new CityDiscovery();

  it('always applies', () => {
    expect(strategy.supports(getEcosystem('yc')!)).toBe(true);
  });

  it('resolves cities for T-Hub (incubator-linked hubs)', () => {
    const eco = getEcosystem('thub')!;
    const cities = strategy.resolveCities(eco);
    expect(cities.length).toBeGreaterThan(0);
    // Bengaluru hosts T-Hub affiliates.
    expect(cities.some((c) => c.city === 'Bengaluru')).toBe(true);
  });

  it('resolves country hubs for an India research ecosystem', () => {
    const eco = getEcosystem('iisc')!;
    const cities = strategy.resolveCities(eco);
    expect(cities.some((c) => c.city === 'Bengaluru')).toBe(true);
  });
});

describe('EcosystemDiscovery orchestrator', () => {
  const discovery = new EcosystemDiscovery();

  it('applies all supporting strategies and emits crawl candidates', () => {
    const eco = getEcosystem('yc')!;
    const result = discovery.discover(eco);
    expect(result.companies.length).toBeGreaterThan(0);
    const candidates = discovery.toCrawlCandidates(eco, result);
    expect(candidates.some((c) => c.type === 'COMPANY')).toBe(true);
    expect(candidates.some((c) => c.type === 'PORTFOLIO')).toBe(true);
    expect(candidates.some((c) => c.type === 'CAREERS')).toBe(true);
    // No duplicate candidate URLs.
    const keys = candidates.map((c) => `${c.url}|${c.type}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('does not duplicate companies within a result', () => {
    const eco = getEcosystem('accel')!;
    const result = discovery.discover(eco);
    const hosts = result.companies.map((c) => c.website.toLowerCase());
    expect(new Set(hosts).size).toBe(hosts.length);
  });
});

describe('ecosystem-score', () => {
  it('scores every ecosystem within 0-100', () => {
    for (const eco of allEcosystems()) {
      const s = scoreEcosystem(eco);
      expect(s.ecosystemScore).toBeGreaterThanOrEqual(0);
      expect(s.ecosystemScore).toBeLessThanOrEqual(100);
    }
  });

  it('ranks a high-signal ecosystem above a low-signal one', () => {
    const scores = scoreAllEcosystems(allEcosystems());
    const yc = scores.find((s) => s.ecosystemId === 'yc')!;
    const ff = scores.find((s) => s.ecosystemId === 'foundersfactory')!;
    expect(yc.ecosystemScore).toBeGreaterThan(ff.ecosystemScore);
  });

  it('computes expected yield and engineering relevance', () => {
    const s = scoreEcosystem(getEcosystem('yc')!);
    expect(s.expectedOpportunityYield).toBeGreaterThan(0);
    expect(s.expectedEngineeringRelevance).toBeGreaterThan(0);
    expect(s.expectedEngineeringRelevance).toBeLessThanOrEqual(1);
  });

  it('filters ecosystems for a mission deterministically', () => {
    const globalAI = filterEcosystemsForMission(allEcosystems(), {
      region: 'INDIA',
      focus: 'AI',
      minInternshipLikelihood: 0.7,
    });
    expect(globalAI.length).toBeGreaterThan(0);
    for (const eco of globalAI) {
      expect(eco.region).toBe('INDIA');
      expect(eco.engineeringFocus).toContain('AI');
      expect(eco.internshipLikelihood).toBeGreaterThanOrEqual(0.7);
    }
  });
});

describe('EcosystemEngine', () => {
  it('produces hundreds of deterministic crawl candidates', () => {
    const engine = new EcosystemEngine();
    const result = engine.run('STARTUP_INTERNSHIPS');
    expect(result.visited).toBe(allEcosystems().length);
    expect(result.candidates.length).toBeGreaterThan(100);
    // No duplicate candidates.
    const keys = result.candidates.map((c) => `${c.url.toLowerCase()}|${c.type}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('formats the run banner', () => {
    const engine = new EcosystemEngine();
    const result = engine.run('STARTUP_INTERNSHIPS');
    const banner = engine.formatRun(result);
    expect(banner).toContain('Ecosystem Discovery');
    expect(banner).toContain('Ecosystems Visited:');
    expect(banner).toContain('Candidate URLs:');
  });

  it('runs a single ecosystem by id', () => {
    const engine = new EcosystemEngine();
    const result = engine.runOne('thub');
    expect(result.visited).toBe(1);
    expect(result.companies.length).toBeGreaterThanOrEqual(0);
  });

  it('respects region filtering', () => {
    const engine = new EcosystemEngine();
    const india = engine.run('M', { region: 'INDIA' });
    for (const eco of allEcosystems()) {
      if (india.scores.some((s) => s.ecosystemId === eco.id)) {
        expect(eco.region).toBe('INDIA');
      }
    }
  });
});

describe('EcosystemHealthReport', () => {
  it('builds a deterministic health report', () => {
    const report = new EcosystemHealthReport();
    const health = report.build();
    expect(health.totalEcosystems).toBe(allEcosystems().length);
    expect(health.companiesDiscoverable).toBeGreaterThan(0);
    expect(health.topEcosystems.length).toBeGreaterThan(0);
    expect(Object.keys(health.coverageByType).length).toBeGreaterThan(0);
    expect(health.averageScore).toBeGreaterThanOrEqual(0);
  });

  it('formats the health report banner', () => {
    const report = new EcosystemHealthReport();
    const text = report.format(report.build());
    expect(text).toContain('Ecosystem Health');
    expect(text).toContain('Total Ecosystems');
    expect(text).toContain('Coverage by Country');
    expect(text).toContain('Coverage by City');
    expect(text).toContain('Coverage by Type');
  });
});

describe('ecosystem-cli', () => {
  it('builds a test report for known ids', () => {
    for (const id of ['yc', 'thub', 'nsrcel', 'peakxv', 'iisc']) {
      const report = buildTestReport(id);
      expect(report).not.toBeNull();
      expect(report!.ecosystem).toBeTruthy();
      expect(report!.score).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns null for unknown ecosystem', () => {
    expect(buildTestReport('does-not-exist')).toBeNull();
  });
});
