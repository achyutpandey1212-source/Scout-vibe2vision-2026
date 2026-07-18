import {
  CrawlCandidate,
  DiscoveryResult,
  Ecosystem,
  EcosystemCompany,
  EcosystemDiscoveryResult,
  EcosystemDiscoverySummary,
  EcosystemScore,
  EngineeringFocus,
} from './ecosystem.types';
import { allEcosystems, getEcosystem } from './ecosystem-registry';
import { EcosystemDiscovery } from './ecosystem-discovery';
import { scoreAllEcosystems } from './ecosystem-score';
import { CityDiscovery } from './city-discovery';

/**
 * Ecosystem Intelligence Engine.
 *
 * Top-level deterministic engine. Maps ecosystems into hundreds of high-quality
 * crawl candidates (company pages, portfolio pages, careers, ATS, candidate
 * URLs) that feed Company Discovery and the Search Orchestrator — without ever
 * issuing a generic search query first.
 *
 * No LLM. No AI. No randomness. Everything is configuration-driven.
 */
export class EcosystemEngine {
  private readonly discovery: EcosystemDiscovery;

  constructor(discovery?: EcosystemDiscovery) {
    this.discovery = discovery ?? new EcosystemDiscovery();
  }

  /**
   * Runs ecosystem intelligence for a mission.
   *
   * @param mission  Mission identifier (e.g. "STARTUP_INTERNSHIPS").
   * @param opts     Optional filters (ecosystem ids, region, focus).
   */
  run(
    mission: string,
    opts: {
      ecosystemIds?: string[];
      region?: Ecosystem['region'];
      focus?: EngineeringFocus;
    } = {},
  ): EcosystemDiscoveryResult {
    let ecosystems = allEcosystems();

    if (opts.ecosystemIds && opts.ecosystemIds.length > 0) {
      const ids = new Set(opts.ecosystemIds.map((i) => i.toLowerCase()));
      ecosystems = ecosystems.filter((e) => ids.has(e.id));
    }
    if (opts.region) {
      ecosystems = ecosystems.filter((e) => e.region === opts.region);
    }
    if (opts.focus) {
      ecosystems = ecosystems.filter((e) => e.engineeringFocus.includes(opts.focus!));
    }

    const discoveryResults = ecosystems.map((eco) => this.discovery.discover(eco));

    // Merge companies + candidates across all ecosystems, deduplicated.
    const companiesMap = new Map<string, EcosystemCompany>();
    const candidatesMap = new Map<string, CrawlCandidate>();
    const scores: EcosystemScore[] = scoreAllEcosystems(ecosystems);

    for (let i = 0; i < ecosystems.length; i++) {
      const eco = ecosystems[i];
      const result = discoveryResults[i];

      for (const company of result.companies) {
        companiesMap.set(company.website.toLowerCase(), company);
      }

      const candidates = this.discovery.toCrawlCandidates(eco, result);
      for (const candidate of candidates) {
        const key = `${candidate.url.toLowerCase()}|${candidate.type}`;
        const existing = candidatesMap.get(key);
        if (!existing || candidate.priority > existing.priority) {
          candidatesMap.set(key, candidate);
        }
      }
    }

    const companies = [...companiesMap.values()];
    const candidates = [...candidatesMap.values()].sort((a, b) => b.priority - a.priority);

    const summary = this.buildSummary(mission, ecosystems, discoveryResults, companies);

    return {
      mission,
      visited: ecosystems.length,
      discoveryResults,
      companies,
      candidates,
      scores,
      summary,
    };
  }

  /**
   * Runs a single ecosystem by id (used by `npm run ecosystem:test <id>`).
   */
  runOne(id: string, mission = 'ECOSYSTEM_TEST'): EcosystemDiscoveryResult {
    const eco = getEcosystem(id);
    if (!eco) {
      return this.emptyResult(mission);
    }
    return this.run(mission, { ecosystemIds: [id] });
  }

  private buildSummary(
    mission: string,
    ecosystems: Ecosystem[],
    discoveryResults: DiscoveryResult[],
    companies: EcosystemCompany[],
  ): EcosystemDiscoverySummary {
    let incubators = 0;
    let universities = 0;
    let researchLabs = 0;
    let careerPages = 0;
    let atsPages = 0;
    let candidateUrls = 0;
    const citiesCovered = new Set<string>();
    const cityDiscovery = new CityDiscovery();

    for (const eco of ecosystems) {
      for (const city of cityDiscovery.resolveCities(eco)) {
        citiesCovered.add(city.city);
      }
    }

    for (const r of discoveryResults) {
      incubators += r.incubators.length;
      careerPages += r.careerPages.length;
      atsPages += r.atsPages.length;
      candidateUrls += r.candidateUrls.length;
    }

    for (const eco of ecosystems) {
      if (eco.type === 'RESEARCH_ECOSYSTEM') {
        researchLabs++;
        universities += eco.knownUniversities.length;
      }
    }

    const avg =
      ecosystems.length > 0
        ? Math.round(
            ecosystems.reduce((s, e) => s + scoreAllEcosystems([e])[0].ecosystemScore, 0) /
              ecosystems.length,
          )
        : 0;

    return {
      mission,
      ecosystemsVisited: ecosystems.length,
      portfolioCompanies: companies.length,
      incubators,
      universities,
      researchLabs,
      citiesCovered: citiesCovered.size,
      careerPages,
      atsPages,
      candidateUrls,
      averageScore: avg,
      generatedAt: new Date().toISOString(),
    };
  }

  private emptyResult(mission: string): EcosystemDiscoveryResult {
    return {
      mission,
      visited: 0,
      discoveryResults: [],
      companies: [],
      candidates: [],
      scores: [],
      summary: {
        mission,
        ecosystemsVisited: 0,
        portfolioCompanies: 0,
        incubators: 0,
        universities: 0,
        researchLabs: 0,
        citiesCovered: 0,
        careerPages: 0,
        atsPages: 0,
        candidateUrls: 0,
        averageScore: 0,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Formats the run banner exactly as specified in the Module 3 brief.
   */
  formatRun(result: EcosystemDiscoveryResult): string {
    const s = result.summary;
    const pad = (label: string, value: number | string) => `${label}:`.padEnd(22) + `${value}`;
    const lines: string[] = [];
    lines.push('====================================');
    lines.push('Ecosystem Discovery');
    lines.push('====================================');
    lines.push('');
    lines.push(`Mission:`.padEnd(22) + s.mission);
    lines.push(pad('Ecosystems Visited', s.ecosystemsVisited));
    lines.push(pad('Portfolio Companies', s.portfolioCompanies));
    lines.push(pad('Incubators', s.incubators));
    lines.push(pad('Universities', s.universities));
    lines.push(pad('Research Labs', s.researchLabs));
    lines.push(pad('Cities Covered', s.citiesCovered));
    lines.push(pad('Career Pages', s.careerPages));
    lines.push(pad('ATS Pages', s.atsPages));
    lines.push(pad('Candidate URLs', s.candidateUrls));
    lines.push(pad('Average Score', s.averageScore));
    lines.push('====================================');
    return lines.join('\n');
  }
}
