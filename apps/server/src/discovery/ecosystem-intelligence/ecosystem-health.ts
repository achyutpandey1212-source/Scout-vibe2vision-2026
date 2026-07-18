import { EcosystemHealth, EcosystemType } from './ecosystem.types';
import { allEcosystems, allCities } from './ecosystem-registry';
import { scoreAllEcosystems } from './ecosystem-score';
import { EcosystemDiscovery } from './ecosystem-discovery';

/**
 * Ecosystem Health Report.
 *
 * Deterministic aggregate over the entire ecosystem registry: coverage by
 * country, city, and type, plus the top ecosystems by score. Never crawls.
 */
export class EcosystemHealthReport {
  private readonly discovery: EcosystemDiscovery;

  constructor(discovery?: EcosystemDiscovery) {
    this.discovery = discovery ?? new EcosystemDiscovery();
  }

  build(): EcosystemHealth {
    const ecosystems = allEcosystems();
    const discovery = this.discovery;
    const scores = scoreAllEcosystems(ecosystems);

    let companiesDiscoverable = 0;
    let portfolioCompanies = 0;
    let incubators = 0;
    let researchLabs = 0;
    let universities = 0;
    let careerPages = 0;
    let atsPages = 0;

    const coverageByCountry: Record<string, number> = {};
    const coverageByCity: Record<string, number> = {};
    const coverageByType = {} as Record<EcosystemType, number>;

    const cities = allCities();

    for (const eco of ecosystems) {
      const result = discovery.discover(eco);
      companiesDiscoverable += result.companies.length;
      portfolioCompanies += result.companies.length;
      incubators += result.incubators.length;
      careerPages += result.careerPages.length;
      atsPages += result.atsPages.length;

      if (eco.type === 'RESEARCH_ECOSYSTEM') {
        researchLabs++;
        universities += eco.knownUniversities.length;
      }

      coverageByCountry[eco.country] = (coverageByCountry[eco.country] ?? 0) + 1;
      coverageByType[eco.type] = (coverageByType[eco.type] ?? 0) + 1;

      for (const city of cities) {
        if (
          city.majorIncubators.includes(eco.id) ||
          eco.knownIncubators.includes(city.majorIncubators[0] ?? '')
        ) {
          coverageByCity[city.city] = (coverageByCity[city.city] ?? 0) + 1;
        }
      }
    }

    // City coverage: every city hosting an affiliated incubator counts.
    for (const city of cities) {
      const related = ecosystems.filter(
        (e) => city.majorIncubators.includes(e.id) || e.knownIncubators.includes(city.city),
      );
      if (related.length > 0) {
        coverageByCity[city.city] = (coverageByCity[city.city] ?? 0) + related.length;
      }
    }

    const avg =
      scores.length > 0
        ? Math.round(scores.reduce((s, x) => s + x.ecosystemScore, 0) / scores.length)
        : 0;

    const top = scores
      .slice(0, 10)
      .map((s) => ({ id: s.ecosystemId, name: s.ecosystemName, score: s.ecosystemScore }));

    return {
      totalEcosystems: ecosystems.length,
      companiesDiscoverable,
      portfolioCompanies,
      incubators,
      researchLabs,
      universities,
      careerPages,
      atsPages,
      averageScore: avg,
      topEcosystems: top,
      coverageByCountry,
      coverageByCity,
      coverageByType,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Formats the health report exactly as specified in the Module 3 brief.
   */
  format(health: EcosystemHealth): string {
    const lines: string[] = [];
    lines.push('===================================');
    lines.push('Ecosystem Health');
    lines.push('===================================');
    lines.push(`Total Ecosystems`.padEnd(22) + health.totalEcosystems);
    lines.push(`Companies Discoverable`.padEnd(22) + health.companiesDiscoverable);
    lines.push(`Portfolio Companies`.padEnd(22) + health.portfolioCompanies);
    lines.push(`Incubators`.padEnd(22) + health.incubators);
    lines.push(`Research Labs`.padEnd(22) + health.researchLabs);
    lines.push(`Universities`.padEnd(22) + health.universities);
    lines.push(`Career Pages`.padEnd(22) + health.careerPages);
    lines.push(`ATS Pages`.padEnd(22) + health.atsPages);
    lines.push(`Average Score`.padEnd(22) + health.averageScore);
    lines.push('');
    lines.push('Top Ecosystems:');
    for (const e of health.topEcosystems) {
      lines.push(`  ${e.name}`.padEnd(22) + `score=${e.score}`);
    }
    lines.push('');
    lines.push('Coverage by Country:');
    for (const [country, count] of Object.entries(health.coverageByCountry)) {
      lines.push(`  ${country}`.padEnd(22) + `${count}`);
    }
    lines.push('');
    lines.push('Coverage by City:');
    for (const [city, count] of Object.entries(health.coverageByCity)) {
      lines.push(`  ${city}`.padEnd(22) + `${count}`);
    }
    lines.push('');
    lines.push('Coverage by Type:');
    for (const [type, count] of Object.entries(health.coverageByType)) {
      lines.push(`  ${type}`.padEnd(22) + `${count}`);
    }
    lines.push('===================================');
    return lines.join('\n');
  }
}
