import { Ecosystem } from './ecosystem.types';
import { EcosystemDiscoveryStrategy, emptyResult } from './strategy.types';

/**
 * University Discovery.
 *
 * For research ecosystems that include universities (IITs, IIITs, IISc, and
 * their affiliated labs), maps:
 *   - Universities (knownUniversities)
 *   - Research internship pages (knownCareerPages)
 *   - Technology transfer / incubation centers (knownIncubators)
 *   - Programs (knownEvents)
 */
export class UniversityDiscovery implements EcosystemDiscoveryStrategy {
  readonly name = 'university';

  supports(eco: Ecosystem): boolean {
    return eco.type === 'RESEARCH_ECOSYSTEM' && eco.knownUniversities.length > 0;
  }

  discover(eco: Ecosystem): ReturnType<EcosystemDiscoveryStrategy['discover']> {
    const result = emptyResult(eco);

    if (eco.portfolioPage) result.portfolioPages.push(eco.portfolioPage);

    // Universities are surfaced via knownUniversities (referenced by id).
    result.directories.push(...eco.knownUniversities.map((u) => `university:${u}`));

    // Labs / research centers = knownDomains.
    for (const domain of eco.knownDomains) {
      result.startupListings.push(`https://${domain}`);
    }

    // Incubation / TTO centers.
    result.incubators.push(...eco.knownIncubators);

    for (const careerPage of eco.knownCareerPages) {
      result.careerPages.push(careerPage);
    }

    // Research internship programs.
    result.programPages.push(...eco.knownEvents.map((e) => `${eco.officialWebsite}#${slug(e)}`));

    result.candidateUrls.push(...eco.knownCareerPages);

    return result;
  }
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
