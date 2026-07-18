import { CompanyCandidate, EcosystemCategory, EcosystemConnector } from './company.types';
import { ECOSYSTEMS } from './ecosystem-config';

/**
 * Ecosystem Connectors — plug-in discovery sources.
 *
 * Every connector implements `EcosystemConnector.discoverCompanies()` and
 * returns `CompanyCandidate[]`. Discovery is purely deterministic: it reads the
 * curated ecosystem registry. New ecosystems are added by registering another
 * connector — no changes to the engine core.
 */

export class StaticEcosystemConnector implements EcosystemConnector {
  readonly label: string;
  readonly ecosystem: EcosystemCategory;
  private readonly companies: CompanyCandidate[];

  constructor(label: string, ecosystem: EcosystemCategory, companies: CompanyCandidate[]) {
    this.label = label;
    this.ecosystem = ecosystem;
    this.companies = companies;
  }

  async discoverCompanies(): Promise<CompanyCandidate[]> {
    return this.companies;
  }
}

/**
 * Builds one connector per curated ecosystem. Each ecosystem's companies are
 * pre-expanded into candidates so connectors stay uniform and pluggable.
 */
export function buildEcosystemConnectors(): EcosystemConnector[] {
  const connectors: EcosystemConnector[] = [];

  for (const eco of ECOSYSTEMS) {
    const companies: CompanyCandidate[] = eco.companies.map((company) => ({
      name: company.name,
      website: company.website,
      careersUrl: company.careersUrl,
      ecosystem: eco.category,
      country: company.country,
      city: company.city,
      companyStage: company.stage,
      companyType: company.type,
      source: eco.source,
      confidence: company.confidence || 'HIGH',
      ats: company.ats,
      ecosystemLabel: eco.label,
    }));
    connectors.push(new StaticEcosystemConnector(eco.label, eco.category, companies));
  }

  return connectors;
}

/**
 * Registry of all available connectors, keyed by label for multi-hop traversal.
 */
export class EcosystemConnectorRegistry {
  private readonly connectors: Map<string, EcosystemConnector> = new Map();

  constructor(connectors: EcosystemConnector[] = buildEcosystemConnectors()) {
    for (const c of connectors) {
      this.connectors.set(c.label, c);
    }
  }

  all(): EcosystemConnector[] {
    return Array.from(this.connectors.values());
  }

  get(label: string): EcosystemConnector | undefined {
    return this.connectors.get(label);
  }

  byCategory(category: EcosystemCategory): EcosystemConnector[] {
    return this.all().filter((c) => c.ecosystem === category);
  }

  labels(): string[] {
    return Array.from(this.connectors.keys());
  }
}
