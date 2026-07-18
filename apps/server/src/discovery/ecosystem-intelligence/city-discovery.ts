import { CityIntel, Ecosystem } from './ecosystem.types';
import { EcosystemDiscoveryStrategy, emptyResult } from './strategy.types';
import { allCities } from './ecosystem-registry';

/**
 * City Discovery.
 *
 * Maps an ecosystem's geographic footprint to deterministic city intelligence.
 * For each ecosystem we resolve the cities that host its affiliated
 * incubators, falling back to the ecosystem's country priority hubs. This lets
 * the engine prioritize crawl candidates by city startup/engineering scores.
 */
export class CityDiscovery implements EcosystemDiscoveryStrategy {
  readonly name = 'city';

  supports(_eco: Ecosystem): boolean {
    return true;
  }

  discover(eco: Ecosystem): ReturnType<EcosystemDiscoveryStrategy['discover']> {
    const result = emptyResult(eco);
    const cities = this.resolveCities(eco);
    for (const city of cities) {
      result.directories.push(`city:${city.city}`);
    }
    return result;
  }

  /**
   * Resolves the cities relevant to an ecosystem deterministically.
   *
   * Priority order:
   *   1. Cities whose majorIncubators include this ecosystem or one of its
   *      affiliated incubators.
   *   2. All cities in the ecosystem's country (ranked by priority then score).
   */
  resolveCities(eco: Ecosystem): CityIntel[] {
    const relatedIds = new Set<string>([eco.id, ...eco.knownIncubators]);

    const matched = allCities().filter((c) => c.majorIncubators.some((inc) => relatedIds.has(inc)));

    const seen = new Set<string>(matched.map((c) => c.city));
    const countryCities = allCities()
      .filter((c) => c.country.toLowerCase() === eco.country.toLowerCase() && !seen.has(c.city))
      .sort((a, b) => a.priority - b.priority || b.startupScore - a.startupScore);

    return [...matched, ...countryCities].sort(
      (a, b) => a.priority - b.priority || b.startupScore - a.startupScore,
    );
  }
}
