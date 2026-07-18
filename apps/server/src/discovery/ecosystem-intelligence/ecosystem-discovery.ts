import { CrawlCandidate, DiscoveryResult, Ecosystem, EcosystemCompany } from './ecosystem.types';
import { EcosystemDiscoveryStrategy } from './strategy.types';
import { PortfolioDiscovery } from './portfolio-discovery';
import { IncubatorDiscovery } from './incubator-discovery';
import { AcceleratorDiscovery } from './accelerator-discovery';
import { UniversityDiscovery } from './university-discovery';
import { CityDiscovery } from './city-discovery';
import { atsHostFor, deriveCareersUrl } from './ecosystem-registry';

/**
 * Ecosystem Discovery Orchestrator.
 *
 * Runs every applicable deterministic discovery strategy against each
 * ecosystem and merges their outputs into a single {@link DiscoveryResult}.
 *
 * Pipeline per ecosystem:
 *   Ecosystem → [Strategies] → Companies / Portfolio / Directories /
 *               Incubators / Startups / Programs / Careers / ATS / Candidates
 */
export class EcosystemDiscovery {
  private readonly strategies: EcosystemDiscoveryStrategy[];

  constructor(strategies?: EcosystemDiscoveryStrategy[]) {
    this.strategies = strategies ?? [
      new PortfolioDiscovery(),
      new IncubatorDiscovery(),
      new AcceleratorDiscovery(),
      new UniversityDiscovery(),
      new CityDiscovery(),
    ];
  }

  /**
   * Runs discovery for a single ecosystem, applying all supporting strategies.
   */
  discover(eco: Ecosystem): DiscoveryResult {
    const merged: DiscoveryResult = {
      ecosystemId: eco.id,
      companies: [],
      portfolioPages: [],
      directories: [],
      incubators: [],
      startupListings: [],
      programPages: [],
      careerPages: [],
      atsPages: [],
      candidateUrls: [],
    };

    for (const strategy of this.strategies) {
      if (!strategy.supports(eco)) continue;
      const r = strategy.discover(eco);
      merged.companies.push(...r.companies);
      merged.portfolioPages.push(...r.portfolioPages);
      merged.directories.push(...r.directories);
      merged.incubators.push(...r.incubators);
      merged.startupListings.push(...r.startupListings);
      merged.programPages.push(...r.programPages);
      merged.careerPages.push(...r.careerPages);
      merged.atsPages.push(...r.atsPages);
      merged.candidateUrls.push(...r.candidateUrls);
    }

    // Always carry the official website as an ecosystem page.
    merged.portfolioPages.push(eco.officialWebsite);

    return dedupeResult(merged);
  }

  /**
   * Strategy registry (used for inspection / testing).
   */
  getStrategies(): EcosystemDiscoveryStrategy[] {
    return this.strategies;
  }

  /**
   * Converts a discovery result into deterministic crawl candidates that the
   * crawler consumes downstream. No opportunities — only high-quality pages.
   */
  toCrawlCandidates(eco: Ecosystem, result: DiscoveryResult): CrawlCandidate[] {
    const candidates: CrawlCandidate[] = [];
    const priorityBase = priorityFromBand(eco.priority);

    for (const url of result.portfolioPages) {
      candidates.push(mk(url, eco, 'PORTFOLIO', priorityBase, undefined));
    }
    for (const company of result.companies) {
      candidates.push(mk(company.website, eco, 'COMPANY', priorityBase + 4, company.name));
      candidates.push(
        mk(deriveCareersUrl(company.website), eco, 'CAREERS', priorityBase + 8, company.name),
      );
      if (company.ats && company.ats !== 'UNKNOWN') {
        const board = atsHostFor(company.ats, eco.id);
        if (board) {
          candidates.push(mk(board, eco, 'ATS', priorityBase + 12, company.name, company.ats));
        }
      }
    }
    for (const url of result.careerPages) {
      if (!candidates.some((c) => c.url === url)) {
        candidates.push(mk(url, eco, 'CAREERS', priorityBase + 6, undefined));
      }
    }
    for (const ats of result.atsPages) {
      candidates.push(mk(ats, eco, 'ATS', priorityBase + 10, undefined, eco.knownATS[0]));
    }
    for (const url of result.candidateUrls) {
      if (!candidates.some((c) => c.url === url)) {
        candidates.push(mk(url, eco, 'CANDIDATE', priorityBase + 2, undefined));
      }
    }

    return dedupeCandidates(candidates);
  }
}

function mk(
  url: string,
  eco: Ecosystem,
  type: CrawlCandidate['type'],
  priority: number,
  company?: string,
  ats?: CrawlCandidate['ats'],
): CrawlCandidate {
  return {
    url,
    ecosystemId: eco.id,
    ecosystemName: eco.name,
    type,
    company,
    ats,
    priority: Math.min(100, Math.max(0, Math.round(priority))),
    focus: eco.engineeringFocus[0],
    region: eco.region,
  };
}

function priorityFromBand(band: Ecosystem['priority']): number {
  switch (band) {
    case 1:
      return 70;
    case 2:
      return 55;
    default:
      return 42;
  }
}

function dedupeResult(r: DiscoveryResult): DiscoveryResult {
  return {
    ecosystemId: r.ecosystemId,
    companies: dedupeCompanies(r.companies),
    portfolioPages: uniq(r.portfolioPages),
    directories: uniq(r.directories),
    incubators: uniq(r.incubators),
    startupListings: uniq(r.startupListings),
    programPages: uniq(r.programPages),
    careerPages: uniq(r.careerPages),
    atsPages: uniq(r.atsPages),
    candidateUrls: uniq(r.candidateUrls),
  };
}

function dedupeCompanies(companies: EcosystemCompany[]): EcosystemCompany[] {
  const map = new Map<string, EcosystemCompany>();
  for (const c of companies) {
    const key = c.website.toLowerCase();
    if (!map.has(key)) map.set(key, c);
  }
  return [...map.values()];
}

function dedupeCandidates(candidates: CrawlCandidate[]): CrawlCandidate[] {
  const map = new Map<string, CrawlCandidate>();
  for (const c of candidates) {
    const key = `${c.url.toLowerCase()}|${c.type}`;
    const existing = map.get(key);
    if (!existing || c.priority > existing.priority) map.set(key, c);
  }
  return [...map.values()];
}

function uniq(xs: string[]): string[] {
  return [...new Set(xs)];
}
