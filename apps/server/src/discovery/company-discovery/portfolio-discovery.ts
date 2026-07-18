import { ATSProvider, DiscoveredUrl, EcosystemCategory } from './company.types';
import { EcosystemConnectorRegistry } from './ecosystem-connectors';
import { ECOSYSTEMS } from './ecosystem-config';

/**
 * Multi-hop Portfolio Discovery.
 *
 * Pipeline:
 *   Ecosystem (e.g. Y Combinator)
 *     ↓ portfolio
 *   Company (e.g. Cursor)
 *     ↓ careers
 *   Career Page
 *     ↓ ATS detection
 *   Internship crawl target
 *
 * Purely deterministic: it traverses curated ecosystem -> portfolio company
 * relationships and emits company-derived candidate URLs (careers + ATS boards)
 * for the crawler. No LLM.
 */

export interface PortfolioHop {
  ecosystemLabel: string;
  company: string;
  companyWebsite: string;
  careersUrl: string | null;
  ats: string;
}

export class PortfolioDiscovery {
  constructor(private readonly registry: EcosystemConnectorRegistry) {}

  /**
   * Returns every (ecosystem, company) hop available in the curated registry.
   */
  listHops(): PortfolioHop[] {
    const hops: PortfolioHop[] = [];
    for (const eco of ECOSYSTEMS) {
      for (const company of eco.companies) {
        const careersUrl = company.careersUrl || deriveCareers(company.website);
        hops.push({
          ecosystemLabel: eco.label,
          company: company.name,
          companyWebsite: company.website,
          careersUrl,
          ats: company.ats || 'UNKNOWN',
        });
      }
    }
    return hops;
  }

  /**
   * Returns company-derived candidate URLs for a single ecosystem. Used by the
   * engine to merge official URLs into the crawl pipeline.
   */
  discoverForEcosystem(ecosystemLabel: string): DiscoveredUrl[] {
    const eco = ECOSYSTEMS.find((e) => e.label === ecosystemLabel);
    if (!eco) return [];
    return this.discoverForCompanies(eco.label, eco.category, eco.companies);
  }

  private discoverForCompanies(
    ecosystemLabel: string,
    ecosystem: EcosystemCategory,
    companies: { name: string; website: string; careersUrl?: string; ats?: ATSProvider }[],
  ): DiscoveredUrl[] {
    const urls: DiscoveredUrl[] = [];
    for (const company of companies) {
      const careers = company.careersUrl || deriveCareers(company.website);
      urls.push({
        url: careers,
        company: company.name,
        type: 'CAREERS',
        priority: 80,
        ecosystem,
        ats: 'UNKNOWN',
      });

      if (company.ats && company.ats !== 'UNKNOWN') {
        urls.push({
          url: company.website,
          company: company.name,
          type: 'ATS',
          priority: 90,
          ecosystem,
          ats: company.ats,
        });
      }
    }
    return urls;
  }
}

function deriveCareers(website: string): string {
  return website.replace(/\/+$/, '') + '/careers';
}
