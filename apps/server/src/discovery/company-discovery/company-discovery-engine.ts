import {
  CompanyCandidate,
  CompanyDiscoveryConfig,
  CompanyDiscoveryResult,
  CompanyDiscoveryStatistics,
  CompanyDiscoveryHealth,
  CompanyDiscoverySummary,
  DiscoveredUrl,
} from './company.types';
import { CompanyRegistry } from './company-registry';
import { EcosystemConnectorRegistry, buildEcosystemConnectors } from './ecosystem-connectors';
import { PortfolioDiscovery } from './portfolio-discovery';
import { ensureUnicorns } from './startup-registry';
import { discoverCareers, verifyCareerPage } from './careers-discovery';
import { ATSDetector, verifyAts } from './ats-detector';

/**
 * Company Discovery Engine.
 *
 * Deterministic, LLM-free. Transforms a mission intent into a prioritized set
 * of company-derived career/ATS URLs that are merged into the existing crawl
 * pipeline (instead of relying solely on generic job search).
 *
 * Pipeline:
 *   Mission Query
 *     ↓
 *   Ecosystem Discovery   (connectors)
 *     ↓
 *   Companies            (normalized + merged in registry, self-growing upsert)
 *     ↓
 *   Career Pages         (deterministic inference + optional HTTP verification)
 *     ↓
 *   ATS Detection         (jump straight to ATS crawling when verified)
 */

export class CompanyDiscoveryEngine {
  private readonly registry: CompanyRegistry;
  private readonly connectors: EcosystemConnectorRegistry;
  private readonly portfolio: PortfolioDiscovery;

  constructor(registry?: CompanyRegistry, connectors?: EcosystemConnectorRegistry) {
    this.registry = registry || new CompanyRegistry();
    this.connectors = connectors || new EcosystemConnectorRegistry(buildEcosystemConnectors());
    this.portfolio = new PortfolioDiscovery(this.connectors);
  }

  getRegistry(): CompanyRegistry {
    return this.registry;
  }

  async discover(
    mission: string,
    config: CompanyDiscoveryConfig = {},
  ): Promise<CompanyDiscoveryResult> {
    const enabled = config.enabledEcosystems;
    const countries = config.includeCountries;

    const connectors = this.connectors.all().filter((c) => {
      if (enabled && !enabled.includes(c.ecosystem)) return false;
      return true;
    });

    let candidates: CompanyCandidate[] = [];
    for (const connector of connectors) {
      const found = await connector.discoverCompanies();
      candidates = candidates.concat(found);
    }

    // Filter by country when requested.
    if (countries && countries.length > 0) {
      const set = new Set(countries.map((c) => c.toLowerCase()));
      candidates = candidates.filter((c) => set.has(c.country.toLowerCase()));
    }

    const detectAts = config.detectAts ?? false;
    const verifyCareers = config.verifyCareers ?? false;
    const verifyAtsFlag = config.verifyAts ?? false;

    this.registry.clearRunTracking();

    let accepted = 0;
    let careerPages = 0;
    let atsDetected = 0;
    let newCompanies = 0;
    let registryUpdates = 0;
    let careerPagesVerified = 0;
    let portfolioCompanies = 0;
    const atsByProvider: Record<string, number> = {};
    const topEcosystemCounts: Record<string, number> = {};

    const candidateUrls: DiscoveredUrl[] = [];

    for (const candidate of candidates) {
      if (config.maxCompanies && this.registry.size() >= config.maxCompanies) {
        break;
      }

      const { record, isNew } = this.registry.upsert(candidate, {
        mission,
        strategy: 'ECOSYSTEM',
      });
      if (isNew) newCompanies++;
      accepted++;

      topEcosystemCounts[record.ecosystemLabel || record.ecosystem] =
        (topEcosystemCounts[record.ecosystemLabel || record.ecosystem] || 0) + 1;

      // ── Careers discovery (deterministic inference + optional verification) ──
      const careers = discoverCareers(record.website, undefined, record.ats);
      if (careers.careersUrl) {
        record.careersUrl = careers.careersUrl;
        careerPages++;
        candidateUrls.push({
          url: careers.careersUrl,
          company: record.canonicalName,
          type: 'CAREERS',
          priority: record.companyPriority,
          ecosystem: record.ecosystem,
        });

        if (verifyCareers) {
          const verification = await verifyCareerPage(careers.careersUrl);
          record.careerPageVerified = verification.verified;
          if (verification.verified) careerPagesVerified++;
        }
      }

      // ── ATS detection (optional network, else static hint) ──
      let ats = record.ats;
      let atsVerified = record.atsVerified;
      if (detectAts && record.careersUrl) {
        const detected = ATSDetector.detect(record.careersUrl);
        if (detected !== 'UNKNOWN') ats = detected;
      } else if (record.ats && record.ats !== 'UNKNOWN') {
        ats = record.ats;
      }

      if (verifyAtsFlag && ats !== 'UNKNOWN') {
        const v = verifyAts(record.website);
        atsVerified = v.verified;
        if (v.provider !== 'UNKNOWN') ats = v.provider;
      }

      if (ats !== 'UNKNOWN') {
        record.ats = ats;
        record.atsVerified = atsVerified;
        atsDetected++;
        atsByProvider[ats] = (atsByProvider[ats] || 0) + 1;
        candidateUrls.push({
          url: record.website,
          company: record.canonicalName,
          type: 'ATS',
          priority: Math.min(100, record.companyPriority + 10),
          ecosystem: record.ecosystem,
          ats,
        });
      }
    }

    // Multi-hop portfolio-derived URLs (deterministic).
    for (const connector of connectors) {
      const hops = this.portfolio.discoverForEcosystem(connector.label);
      for (const hop of hops) {
        if (hop.type === 'PORTFOLIO') portfolioCompanies++;
        candidateUrls.push(hop);
      }
    }

    // Ensure unicorns are always represented.
    const before = this.registry.size();
    ensureUnicorns(this.registry);
    registryUpdates = this.registry.updatesThisRun() + Math.max(0, this.registry.size() - before);

    const records = this.registry.all();
    const knownCompanies = records.length - newCompanies;

    const summary: CompanyDiscoverySummary = {
      mission,
      ecosystems: connectors.length,
      companiesFound: candidates.length,
      companiesAccepted: accepted,
      careerPages,
      atsDetected,
      atsByProvider,
      cached: 0,
      fresh: accepted,
      topEcosystems: Object.entries(topEcosystemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([ecosystem, count]) => ({ ecosystem, count })),
      generatedAt: new Date().toISOString(),
    };

    const statistics = this.buildStatistics(mission, {
      candidatesFound: candidates.length,
      newCompanies,
      registryUpdates,
      careerPagesVerified,
      atsDetected,
      portfolioCompanies,
      knownCompanies,
    });

    return {
      companies: records,
      candidateUrls,
      summary,
      statistics,
    };
  }

  /**
   * Builds the per-run statistics block (Module 2.5 spec).
   */
  private buildStatistics(
    mission: string,
    counts: {
      candidatesFound: number;
      newCompanies: number;
      registryUpdates: number;
      careerPagesVerified: number;
      atsDetected: number;
      portfolioCompanies: number;
      knownCompanies: number;
    },
  ): CompanyDiscoveryStatistics {
    const records = this.registry.all();
    const scores = records.map((r) => r.companyScore);
    const confs = records.map((r) => r.companyConfidence);
    const prios = records.map((r) => r.companyPriority);
    const avg = (xs: number[]) =>
      xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0;

    return {
      mission,
      companiesFound: counts.candidatesFound,
      knownCompanies: counts.knownCompanies,
      newCompanies: counts.newCompanies,
      registryUpdates: counts.registryUpdates,
      careerPagesVerified: counts.careerPagesVerified,
      atsDetected: counts.atsDetected,
      portfolioCompanies: counts.portfolioCompanies,
      averageCompanyScore: avg(scores),
      averageConfidence: avg(confs),
      averagePriority: avg(prios),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Produces a health report (registry size, coverage, top/newest companies).
   */
  health(): CompanyDiscoveryHealth {
    const records = this.registry.all();
    const withCareers = records.filter((r) => r.careersUrl).length;
    const withAts = records.filter((r) => r.ats !== 'UNKNOWN').length;
    const scores = records.map((r) => r.companyScore);
    const confs = records.map((r) => r.companyConfidence);
    const avg = (xs: number[]) =>
      xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0;

    const top20 = [...records]
      .sort((a, b) => b.companyPriority - a.companyPriority)
      .slice(0, 20)
      .map((r) => ({ canonicalName: r.canonicalName, companyPriority: r.companyPriority }));

    const newest = [...records]
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 20)
      .map((r) => ({ canonicalName: r.canonicalName, lastSeen: r.lastSeen }));

    return {
      registrySize: records.length,
      companiesWithCareers: withCareers,
      companiesWithAts: withAts,
      companiesWithoutCareers: records.length - withCareers,
      companiesWithoutAts: records.length - withAts,
      averageScore: avg(scores),
      averageConfidence: avg(confs),
      top20Companies: top20,
      newestCompanies: newest,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Formats the per-run statistics exactly as specified in the Module 2.5 brief.
   */
  formatStatistics(stats: CompanyDiscoveryStatistics): string {
    const lines: string[] = [];
    lines.push('=========================================');
    lines.push('Company Discovery Summary');
    lines.push('=========================================');
    lines.push(`Mission:`.padEnd(24) + stats.mission);
    lines.push(`Companies Found:`.padEnd(24) + stats.companiesFound);
    lines.push(`Known Companies:`.padEnd(24) + stats.knownCompanies);
    lines.push(`New Companies:`.padEnd(24) + stats.newCompanies);
    lines.push(`Registry Updates:`.padEnd(24) + stats.registryUpdates);
    lines.push(`Career Pages Verified:`.padEnd(24) + stats.careerPagesVerified);
    lines.push(`ATS Detected:`.padEnd(24) + stats.atsDetected);
    lines.push(`Portfolio Companies:`.padEnd(24) + stats.portfolioCompanies);
    lines.push(`Average Company Score:`.padEnd(24) + stats.averageCompanyScore);
    lines.push(`Average Confidence:`.padEnd(24) + stats.averageConfidence);
    lines.push(`Average Priority:`.padEnd(24) + stats.averagePriority);
    lines.push('=========================================');
    return lines.join('\n');
  }

  /**
   * Formats the legacy discovery summary.
   */
  formatSummary(result: CompanyDiscoveryResult): string {
    const s = result.summary;
    const pad = (label: string, value: number | string) => `${label}:`.padEnd(22) + `${value}`;

    const lines: string[] = [];
    lines.push('====================================');
    lines.push('Company Discovery');
    lines.push('====================================');
    lines.push('');
    lines.push(`Mission:`.padEnd(22) + s.mission);
    lines.push(pad('Ecosystems', s.ecosystems));
    lines.push(pad('Companies Found', s.companiesFound));
    lines.push(pad('Companies Accepted', s.companiesAccepted));
    lines.push(pad('Career Pages', s.careerPages));
    lines.push(pad('ATS Detected', s.atsDetected));
    for (const [provider, count] of Object.entries(s.atsByProvider)) {
      lines.push(`  ${provider}:`.padEnd(20) + `${count}`);
    }
    lines.push(pad('Cached', s.cached));
    lines.push(pad('New', s.fresh));
    lines.push('');
    lines.push('Top Ecosystems:');
    for (const e of s.topEcosystems) {
      lines.push(`  ${e.ecosystem}`);
      lines.push(`  ${e.count}`);
    }
    lines.push('====================================');
    return lines.join('\n');
  }
}

export const companyDiscoveryEngine = new CompanyDiscoveryEngine();
