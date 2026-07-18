import { Ecosystem } from './ecosystem.types';
import { EcosystemDiscoveryStrategy, emptyResult } from './strategy.types';

/**
 * Accelerator Discovery.
 *
 * For accelerators, maps batch/portfolio companies (knownDomains), demo-day
 * programs (knownEvents), and career pages. Accelerators behave like
 * portfolio ecosystems with stronger program emphasis.
 */
export class AcceleratorDiscovery implements EcosystemDiscoveryStrategy {
  readonly name = 'accelerator';

  supports(eco: Ecosystem): boolean {
    return eco.type === 'ACCELERATOR';
  }

  discover(eco: Ecosystem): ReturnType<EcosystemDiscoveryStrategy['discover']> {
    const result = emptyResult(eco);

    if (eco.portfolioPage) result.portfolioPages.push(eco.portfolioPage);
    if (eco.companiesPage) result.directories.push(eco.companiesPage);

    for (const domain of eco.knownDomains) {
      result.startupListings.push(`https://${domain}`);
    }

    // Batch programs = known events / demo days.
    result.programPages.push(...eco.knownEvents.map((e) => `${eco.officialWebsite}#${slug(e)}`));

    for (const careerPage of eco.knownCareerPages) {
      result.careerPages.push(careerPage);
    }

    for (const provider of eco.knownATS) {
      result.atsPages.push(`${eco.officialWebsite}/ats/${provider.toLowerCase()}`);
    }

    result.candidateUrls.push(...eco.knownCareerPages);
    result.candidateUrls.push(...eco.knownEvents.map((e) => `${eco.officialWebsite}#${slug(e)}`));

    return result;
  }
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
