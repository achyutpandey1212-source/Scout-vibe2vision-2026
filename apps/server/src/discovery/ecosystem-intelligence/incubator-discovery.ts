import { Ecosystem } from './ecosystem.types';
import { EcosystemDiscoveryStrategy, emptyResult } from './strategy.types';

/**
 * Incubator Discovery.
 *
 * For Indian startup ecosystems / incubators, maps resident + graduated
 * startups (knownDomains), programs (knownEvents), and career pages.
 */
export class IncubatorDiscovery implements EcosystemDiscoveryStrategy {
  readonly name = 'incubator';

  supports(eco: Ecosystem): boolean {
    return (
      eco.type === 'INDIAN_STARTUP_ECOSYSTEM' ||
      eco.knownIncubators.length > 0 ||
      eco.type === 'VC_ECOSYSTEM'
    );
  }

  discover(eco: Ecosystem): ReturnType<EcosystemDiscoveryStrategy['discover']> {
    const result = emptyResult(eco);

    if (eco.startupDirectory) result.directories.push(eco.startupDirectory);
    if (eco.portfolioPage) result.portfolioPages.push(eco.portfolioPage);

    // Resident / graduated startups (deterministic from knownDomains).
    for (const domain of eco.knownDomains) {
      result.startupListings.push(`https://${domain}`);
    }

    // Affiliated incubators.
    result.incubators.push(...eco.knownIncubators);

    // Programs = known events.
    result.programPages.push(...eco.knownEvents.map((e) => `${eco.officialWebsite}#${slug(e)}`));

    for (const careerPage of eco.knownCareerPages) {
      result.careerPages.push(careerPage);
    }

    result.candidateUrls.push(...eco.knownCareerPages);
    if (eco.portfolioPage) result.candidateUrls.push(eco.portfolioPage);

    return result;
  }
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
