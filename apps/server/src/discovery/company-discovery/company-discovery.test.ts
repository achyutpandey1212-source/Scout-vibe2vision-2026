import { describe, it, expect } from 'vitest';
import { resolveCanonicalName, isSameCompany, normalizeAliasKey } from './company-normalizer';
import { detectAtsFromUrl, ATSDetector } from './ats-detector';
import { discoverCareers, buildCareerCandidates, extractCareerLinks } from './careers-discovery';
import { scoreCompany } from './company-score';
import { CompanyRegistry } from './company-registry';
import { buildEcosystemConnectors, EcosystemConnectorRegistry } from './ecosystem-connectors';
import { ensureUnicorns, isKnownUnicorn } from './startup-registry';
import { PortfolioDiscovery } from './portfolio-discovery';
import { CompanyDiscoveryEngine } from './company-discovery-engine';

describe('Company Discovery Engine — deterministic behavior', () => {
  it('merges company aliases to a canonical identity', () => {
    expect(resolveCanonicalName('Google LLC')).toBe('Google');
    expect(resolveCanonicalName('Google Inc')).toBe('Google');
    expect(resolveCanonicalName('Google')).toBe('Google');
    expect(resolveCanonicalName('Meta Platforms')).toBe('Meta');
    expect(resolveCanonicalName('Meta')).toBe('Meta');
  });

  it('detects same company across aliases', () => {
    expect(isSameCompany('Google LLC', 'Google Inc')).toBe(true);
    expect(isSameCompany('Google', 'Microsoft')).toBe(false);
    expect(isSameCompany('Facebook', 'Meta')).toBe(true);
  });

  it('normalizes names by stripping legal suffixes', () => {
    expect(normalizeAliasKey('Razorpay Software Private Limited')).toBe('razorpay');
    expect(normalizeAliasKey('OpenAI Inc')).toBe('openai');
  });

  it('detects ATS providers from URLs', () => {
    expect(detectAtsFromUrl('https://boards.greenhouse.io/stripe')).toBe('Greenhouse');
    expect(detectAtsFromUrl('https://jobs.lever.co/anthropic')).toBe('Lever');
    expect(detectAtsFromUrl('https://jobs.ashbyhq.com/cursor')).toBe('Ashby');
    expect(detectAtsFromUrl('https://apply.workable.com/acme')).toBe('Workable');
    expect(detectAtsFromUrl('https://example.com/careers')).toBe('UNKNOWN');
  });

  it('detects ATS from HTML markers', () => {
    const html = '<a href="/jobs">Careers</a><script data-gh-id="123"></script>';
    expect(ATSDetector.detect(html)).toBe('Greenhouse');
  });

  it('infers a deterministic careers URL from a homepage', () => {
    const res = discoverCareers('https://supabase.com');
    expect(res.careersUrl).toBe('https://supabase.com/careers');
    expect(res.source).toBe('INFERRED');
  });

  it('extracts career links from homepage HTML only on the official domain', () => {
    const html =
      '<a href="/careers">Careers</a><a href="https://linkedin.com/company/x">LinkedIn</a>';
    const links = buildCareerCandidates('https://acme.com');
    expect(links[0]).toContain('/careers');
    const extracted = extractCareerLinks(html, 'https://acme.com');
    expect(extracted).toContain('https://acme.com/careers');
    expect(extracted.some((l: string) => l.includes('linkedin'))).toBe(false);
  });

  it('scores a unicorn developer-tools company above a generic startup', () => {
    const unicorn = {
      canonicalName: 'Postman',
      aliases: ['Postman'],
      website: 'https://postman.com',
      ats: 'Greenhouse' as const,
      ecosystem: 'UNICORN' as const,
      country: 'India',
      stage: 'UNICORN' as const,
      type: 'DEVELOPER_TOOLS' as const,
      priority: 0,
      source: 'UNICORN_REGISTRY' as const,
      confidence: 'HIGH' as const,
      companyScore: 0,
      companyConfidence: 0,
      companyPriority: 0,
      atsVerified: false,
      careerPageVerified: false,
      lastSeen: Date.now(),
    };
    const generic = {
      ...unicorn,
      canonicalName: 'TinyStart',
      website: 'https://tinystart.com',
      ats: 'UNKNOWN' as const,
      ecosystem: 'INDIAN_STARTUP_ECOSYSTEM' as const,
      stage: 'SEED' as const,
      type: 'STARTUP' as const,
    };
    expect(scoreCompany(unicorn)).toBeGreaterThan(scoreCompany(generic));
    expect(scoreCompany(unicorn)).toBeLessThanOrEqual(100);
  });

  it('registry merges duplicate companies across ecosystems into one identity', () => {
    const registry = new CompanyRegistry();
    registry.register({
      name: 'Razorpay',
      website: 'https://razorpay.com',
      ecosystem: 'UNICORN',
      country: 'India',
      city: 'Bengaluru',
      companyStage: 'UNICORN',
      companyType: 'STARTUP',
      source: 'UNICORN_REGISTRY',
      confidence: 'HIGH',
      ecosystemLabel: 'Unicorn Registry',
    });
    registry.register({
      name: 'Razorpay',
      website: 'https://razorpay.com',
      ecosystem: 'STARTUP_ACCELERATOR',
      country: 'India',
      city: 'Bengaluru',
      companyStage: 'UNICORN',
      companyType: 'STARTUP',
      source: 'STARTUP_ACCELERATOR',
      confidence: 'HIGH',
      ecosystemLabel: 'Sequoia Surge',
    });
    expect(registry.size()).toBe(1);
    const record = registry.get('Razorpay')!;
    expect(record.aliases).toContain('Razorpay');
  });

  it('connectors are pluggable and return curated candidates', async () => {
    const connectors = buildEcosystemConnectors();
    expect(connectors.length).toBeGreaterThan(10);
    const yc = connectors.find((c) => c.label === 'Y Combinator')!;
    const companies = await yc.discoverCompanies();
    expect(companies.some((c) => c.name === 'OpenAI')).toBe(true);
  });

  it('recognizes known unicorns', () => {
    expect(isKnownUnicorn('Razorpay')).toBe(true);
    expect(isKnownUnicorn('https://razorpay.com')).toBe(true);
    expect(isKnownUnicorn('NoSuchStartup')).toBe(false);
  });

  it('ensureUnicorns populates the registry', () => {
    const registry = new CompanyRegistry();
    ensureUnicorns(registry);
    expect(registry.get('Razorpay')).toBeDefined();
    expect(registry.get('Meesho')).toBeDefined();
  });

  it('portfolio discovery yields careers + ATS candidate URLs', () => {
    const registry = new EcosystemConnectorRegistry(buildEcosystemConnectors());
    const pd = new PortfolioDiscovery(registry);
    const urls = pd.discoverForEcosystem('Y Combinator');
    expect(urls.some((u) => u.company === 'OpenAI' && u.type === 'CAREERS')).toBe(true);
    expect(urls.some((u) => u.company === 'OpenAI' && u.type === 'ATS')).toBe(true);
  });

  it('engine produces a deterministic summary without LLM/network', async () => {
    const engine = new CompanyDiscoveryEngine();
    const result = await engine.discover('STARTUP_INTERNSHIPS', {
      detectAts: false,
      probeCareers: false,
    });
    expect(result.summary.companiesFound).toBeGreaterThan(50);
    expect(result.summary.companiesAccepted).toBe(result.summary.companiesFound);
    expect(result.candidateUrls.length).toBeGreaterThan(0);
    expect(result.summary.atsDetected).toBeGreaterThan(0);
    expect(result.summary.topEcosystems.length).toBeGreaterThan(0);

    const formatted = engine.formatSummary(result);
    expect(formatted).toContain('Company Discovery');
    expect(formatted).toContain('Mission:');
    expect(formatted).toContain('Companies Found:');
    expect(formatted).toContain('ATS Detected:');
  });

  it('engine respects country filtering', async () => {
    const engine = new CompanyDiscoveryEngine();
    const result = await engine.discover('STARTUP_INTERNSHIPS', {
      includeCountries: ['India'],
      detectAts: false,
    });
    const all = await new CompanyDiscoveryEngine().discover('STARTUP_INTERNSHIPS', {
      detectAts: false,
    });
    expect(result.companies.length).toBeLessThanOrEqual(all.companies.length);
  });
});
