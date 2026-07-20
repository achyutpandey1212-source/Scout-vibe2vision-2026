import { getRolesForEcosystem } from './opportunity-roles';
import { OPPORTUNITY_TYPES } from './opportunity-types';
import { ECOSYSTEMS, Ecosystem } from './ecosystems';
import { expandLocations } from './location-planner';
import { QueryNormalizer } from './query-normalizer';
import { diversifyQueries } from './query-diversifier';
import { SourceTierResolver, SourceTier } from './source-tier-resolver';
import { QueryBudgetManager } from './query-budget-manager';
import { QueryYieldModel } from './query-yield.model';
import { QUERY_ENGINE_CONFIG } from './config';

export interface PlannedQuery {
  query: string;
  priorityScore: number;
  roleId: string;
  location: string;
}

function findEcosystemForDomain(domain: string): Ecosystem {
  const domainLower = domain.toLowerCase().trim();

  for (const eco of Object.values(ECOSYSTEMS)) {
    if (eco.domains.some((d) => domainLower.includes(d) || d.includes(domainLower))) {
      return eco;
    }
  }

  return {
    id: 'CompanyCareers',
    displayName: 'Company Careers',
    domains: [domainLower],
    searchTemplates: [
      `site:${domainLower} {keyword} {location}`,
      `site:${domainLower} {keyword} remote`,
      `site:${domainLower} internship`,
    ],
    crawlStrategy: 'direct',
    parserType: 'company',
    trustScore: 80,
    priority: 'medium',
  };
}

function calculateQueryScore(
  roleId: string,
  location: string,
  ecosystem: Ecosystem,
  tier: SourceTier,
): number {
  let score = 50;

  if (tier === 'A') score += 15;
  else if (tier === 'B') score += 5;

  if (ecosystem.priority === 'critical') score += 15;
  else if (ecosystem.priority === 'high') score += 5;

  const loc = location.toLowerCase();
  if (loc === 'remote') score += 15;
  else if (['bangalore', 'bengaluru', 'hyderabad', 'pune'].includes(loc)) score += 10;

  return Math.min(100, Math.max(0, score));
}

export class OpportunityQueryPlanner {
  /**
   * Plans, scores, and limits queries for a source domain in a single pipeline.
   * Leverages roles, per-source templates, locations, and yield ranking.
   */
  static async plan(
    domain: string,
    registryEntry?: any,
  ): Promise<{ queries: PlannedQuery[]; tier: SourceTier }> {
    const ecosystem = findEcosystemForDomain(domain);
    const tier = await SourceTierResolver.resolve(domain, registryEntry);
    const limit = QueryBudgetManager.getLimit(tier);

    const roles = getRolesForEcosystem(ecosystem.id);
    const rawQueries: PlannedQuery[] = [];
    const seen = new Set<string>();

    for (const role of roles) {
      // Limit locations basis country config
      const locations = expandLocations(QUERY_ENGINE_CONFIG.DEFAULT_COUNTRY, role.id);

      for (const oppType of Object.values(OPPORTUNITY_TYPES)) {
        for (const location of locations) {
          for (const template of ecosystem.searchTemplates) {
            const roleKeyword = role.keywords[0];
            const oppKeyword = oppType.keywords[0];
            const combinedKeyword = `${roleKeyword} ${oppKeyword}`;

            const queryStr = template
              .replace('{keyword}', combinedKeyword)
              .replace('{location}', location)
              .trim();

            const norm = QueryNormalizer.normalize(queryStr);
            if (seen.has(norm)) continue;
            seen.add(norm);

            const priorityScore = calculateQueryScore(role.id, location, ecosystem, tier);

            rawQueries.push({
              query: queryStr,
              priorityScore,
              roleId: role.id,
              location,
            });
          }
        }
      }
    }

    // Historical yields injection
    try {
      const qStrings = rawQueries.map((q) => q.query);
      const yieldStats = await QueryYieldModel.find({ query: { $in: qStrings } }).lean();
      const yieldMap = new Map<string, number>();

      for (const stat of yieldStats) {
        yieldMap.set(stat.query, stat.yieldRate || 0);
      }

      for (const q of rawQueries) {
        const hist = yieldMap.get(q.query) || 0;
        const boost = Math.min(30, Math.round(hist * 10));
        q.priorityScore = Math.min(100, q.priorityScore + boost);
      }
    } catch {
      // Ignored
    }

    // Diversify and cap by resolved budget
    const diversified = diversifyQueries(rawQueries as any, limit) as unknown as PlannedQuery[];

    return {
      queries: diversified.sort((a, b) => b.priorityScore - a.priorityScore),
      tier,
    };
  }
}
export default OpportunityQueryPlanner;
