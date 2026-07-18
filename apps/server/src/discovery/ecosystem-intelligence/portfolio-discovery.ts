import { Ecosystem } from './ecosystem.types';
import { EcosystemDiscoveryStrategy, companyFromDomain, emptyResult } from './strategy.types';
import { atsHostFor } from './ecosystem-registry';

/**
 * Portfolio Discovery.
 *
 * For ecosystems that expose a portfolio (accelerators, VC funds, incubators,
 * hackathon platforms) we map:
 *
 *   Ecosystem → Portfolio Page → Company → Careers → ATS → Candidate URL
 *
 * Everything is derived from curated config. No network required.
 */
export class PortfolioDiscovery implements EcosystemDiscoveryStrategy {
  readonly name = 'portfolio';

  supports(eco: Ecosystem): boolean {
    return Boolean(eco.portfolioPage || eco.companiesPage);
  }

  discover(eco: Ecosystem): ReturnType<EcosystemDiscoveryStrategy['discover']> {
    const result = emptyResult(eco);
    const portfolio = eco.portfolioPage ?? eco.companiesPage;
    if (portfolio) result.portfolioPages.push(portfolio);
    if (eco.startupDirectory) result.directories.push(eco.startupDirectory);
    if (eco.companiesPage) result.directories.push(eco.companiesPage);

    for (const domain of eco.knownDomains) {
      const ats = eco.knownATS.length ? eco.knownATS[0] : undefined;
      result.companies.push(companyFromDomain(eco, domain, ats));
    }

    for (const careerPage of eco.knownCareerPages) {
      result.careerPages.push(careerPage);
    }

    for (const provider of eco.knownATS) {
      const slug = eco.id;
      const board = atsHostFor(provider, slug);
      if (board) result.atsPages.push(board);
    }

    // Candidate URLs: portfolio page + careers pages.
    result.candidateUrls.push(portfolio ?? eco.officialWebsite);
    result.candidateUrls.push(...eco.knownCareerPages);

    return result;
  }
}
