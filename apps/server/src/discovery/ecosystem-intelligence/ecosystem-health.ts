import { EcosystemHealth, EcosystemType, OpportunityYield } from './ecosystem.types';
import { allEcosystems, allCities } from './ecosystem-registry';
import { scoreAllEcosystems } from './ecosystem-score';
import { EcosystemDiscovery } from './ecosystem-discovery';

const YIELD_RANK: Record<OpportunityYield, number> = {
  VERY_HIGH: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

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

    let governmentEcosystems = 0;
    let startupEcosystems = 0;
    let researchEcosystems = 0;
    let developerEcosystems = 0;
    let hackathonEcosystems = 0;
    let missingMetadataCount = 0;
    let duplicateCount = 0;

    const ids = new Set<string>();
    const names = new Set<string>();
    const coverageByCountry: Record<string, number> = {};
    const coverageByCity: Record<string, number> = {};
    const coverageByType = {} as Record<EcosystemType, number>;

    const cities = allCities();
    const tier1 = new Set(cities.filter((c) => c.priority === 1).map((c) => c.city));

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

      switch (eco.type) {
        case 'INDIAN_STARTUP_ECOSYSTEM':
          startupEcosystems++;
          break;
        case 'RESEARCH_ECOSYSTEM':
          researchEcosystems++;
          break;
        case 'DEVELOPER_ECOSYSTEM':
          developerEcosystems++;
          break;
        case 'HACKATHON_ECOSYSTEM':
          hackathonEcosystems++;
          break;
        default:
          break;
      }

      // Government ecosystems: Indian gov bodies that publish student programs.
      if (
        ['meity', 'aic', 'aim', 'startupindia', 'sih', 'birac', 'ksum', 'stpi', 'tide'].includes(
          eco.id,
        )
      ) {
        governmentEcosystems++;
      }

      // Validation bookkeeping — only true logical duplicates (same id or name)
      // count. Domains may legitimately be shared across related ecosystems
      // (e.g. a company's domain referenced by both its accelerator and VC fund).
      if (ids.has(eco.id)) duplicateCount++;
      ids.add(eco.id);
      if (names.has(eco.name.toLowerCase())) duplicateCount++;
      names.add(eco.name.toLowerCase());
      if (
        !eco.id ||
        !eco.name ||
        !eco.type ||
        !eco.region ||
        !eco.officialWebsite ||
        eco.engineeringFocus.length === 0 ||
        eco.internshipLikelihood === undefined ||
        eco.remoteFriendliness === undefined ||
        !eco.opportunityYield
      ) {
        missingMetadataCount++;
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

    const avgYield =
      ecosystems.length > 0
        ? Number(
            (
              ecosystems.reduce((s, e) => s + YIELD_RANK[e.opportunityYield], 0) / ecosystems.length
            ).toFixed(2),
          )
        : 0;

    const top20HighestYield = [...ecosystems]
      .sort((a, b) => YIELD_RANK[b.opportunityYield] - YIELD_RANK[a.opportunityYield])
      .slice(0, 20)
      .map((e) => ({ id: e.id, name: e.name, yield: e.opportunityYield }));

    const tier1CityCoverage = cities
      .filter((c) => tier1.has(c.city))
      .map((c) => c.city)
      .sort();

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
      governmentEcosystems,
      startupEcosystems,
      researchEcosystems,
      developerEcosystems,
      hackathonEcosystems,
      averageOpportunityYield: avgYield,
      top20HighestYield,
      tier1CityCoverage,
      missingMetadataCount,
      duplicateCount,
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
    lines.push(`Government Ecosystems`.padEnd(22) + health.governmentEcosystems);
    lines.push(`Startup Ecosystems`.padEnd(22) + health.startupEcosystems);
    lines.push(`Research Ecosystems`.padEnd(22) + health.researchEcosystems);
    lines.push(`Developer Ecosystems`.padEnd(22) + health.developerEcosystems);
    lines.push(`Hackathon Ecosystems`.padEnd(22) + health.hackathonEcosystems);
    lines.push(`Average Opportunity Yield`.padEnd(22) + health.averageOpportunityYield);
    lines.push(`Missing Metadata`.padEnd(22) + health.missingMetadataCount);
    lines.push(`Duplicate Count`.padEnd(22) + health.duplicateCount);
    lines.push('');
    lines.push('Top Ecosystems:');
    for (const e of health.topEcosystems) {
      lines.push(`  ${e.name}`.padEnd(22) + `score=${e.score}`);
    }
    lines.push('');
    lines.push('Top 20 Highest-Yield Ecosystems:');
    for (const e of health.top20HighestYield) {
      lines.push(`  ${e.name}`.padEnd(22) + `${e.yield}`);
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
    lines.push('Tier-1 City Coverage:');
    for (const city of health.tier1CityCoverage) {
      lines.push(`  ${city}`);
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
