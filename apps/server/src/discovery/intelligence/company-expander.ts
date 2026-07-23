import { CompanyGraph } from './company-graph';
import { sourceRegistryService } from '../sources/source-registry.service';

export class CompanyExpander {
  /**
   * Expands the candidate search space by scheduling searches for related companies
   * when a company yields successfully accepted opportunities.
   */
  static async expand(companyName: string, maxExpansion = 10): Promise<string[]> {
    const peers = CompanyGraph.getPeers(companyName);
    if (peers.length === 0) return [];

    const enqueued: string[] = [];
    const limit = Math.min(peers.length, maxExpansion);

    for (let i = 0; i < limit; i++) {
      const peer = peers[i];
      const peerDomain = `${peer.toLowerCase().replace(/\s+/g, '')}.com`;

      const exists = await sourceRegistryService.domainExists(peerDomain);
      if (!exists) {
        try {
          await sourceRegistryService.upsertSource({
            domain: peerDomain,
            organization: peer,
            homepage: `https://${peerDomain}`,
            sourceType: 'Company',
            category: 'INTERNSHIPS',
            strategy: 'search',
            crawlFrequency: 'weekly',
            trustScore: 75,
            priority: 'medium',
            isActive: true,
            discoveredBy: `company-graph-expansion:${companyName}` as any,
          });
          enqueued.push(peer);
          console.log(
            `[Company Expander] Dynamic Ecosystem Expansion: Enqueued peer "${peer}" for "${companyName}"`,
          );
        } catch (err: any) {
          console.error(`[Company Expander] Failed to enqueue peer ${peer}: ${err.message}`);
        }
      }
    }

    return enqueued;
  }
}
export default CompanyExpander;
