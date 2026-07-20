import { OPPORTUNITY_PERSONAS, OpportunityPersona } from './opportunity-personas';
import { OPPORTUNITY_TYPES, OpportunityType } from './opportunity-types';
import { ECOSYSTEMS, Ecosystem } from './ecosystems';
import { expandLocations } from './location-planner';
import { QUERY_ENGINE_CONFIG } from './config';
import { QueryNormalizer } from './query-normalizer';
import { diversifyQueries } from './query-diversifier';

export interface RankedQuery {
  query: string;
  priorityScore: number;
  personaId: string;
  location: string;
}

/**
 * Normalizes a domain to locate a matching Ecosystem configuration.
 */
function findEcosystemForDomain(domain: string): Ecosystem {
  const domainLower = domain.toLowerCase().trim();

  for (const eco of Object.values(ECOSYSTEMS)) {
    if (eco.domains.some((d) => domainLower.includes(d) || d.includes(domainLower))) {
      return eco;
    }
  }

  // Fallback Ecosystem configuration for standard company domains
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

/**
 * Resolves the query priority score based on persona alignment, ecosystem strength, and locations.
 */
function calculateQueryPriority(
  persona: OpportunityPersona,
  oppType: OpportunityType,
  location: string,
  ecosystem: Ecosystem,
): number {
  let score = 50; // Start at 50

  // 1. Ecosystem Alignment
  if (ecosystem.priority === 'critical') score += 20;
  else if (ecosystem.priority === 'high') score += 10;
  else if (ecosystem.priority === 'low') score -= 15;

  // 2. Persona Preferential Ecosystem
  if (persona.preferredEcosystems.includes(ecosystem.displayName)) {
    score += 15;
  }

  // 3. Location Alignment
  const locLower = location.toLowerCase();
  if (locLower === 'remote') score += 15;
  else if (locLower === 'bangalore' || locLower === 'bengaluru') score += 15;
  else if (locLower === 'pune' || locLower === 'delhi ncr' || locLower === 'gurugram') score += 10;

  // 4. Persona Preferential Location
  if (persona.preferredLocations.some((l) => l.toLowerCase() === locLower)) {
    score += 10;
  }

  // 5. Keyword Relevance (Opportunity Type)
  if (oppType.id === 'INTERNSHIP') score += 10;
  else if (oppType.id === 'RESEARCH_INTERNSHIP' || oppType.id === 'GRADUATE_PROGRAM') score += 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Generates ranked, diversified, and deduplicated queries for a target domain.
 */
export function generateQueries(domain: string): RankedQuery[] {
  const ecosystem = findEcosystemForDomain(domain);
  const rawQueries: RankedQuery[] = [];
  const seenNormKeys = new Set<string>();

  // Iterate Persona × Opportunity Type × Location × Ecosystem Templates
  for (const persona of Object.values(OPPORTUNITY_PERSONAS)) {
    // Expand location targets (defaulting country basis to India config)
    const locations = expandLocations(QUERY_ENGINE_CONFIG.DEFAULT_COUNTRY, persona.id);

    for (const oppType of Object.values(OPPORTUNITY_TYPES)) {
      for (const location of locations) {
        for (const template of ecosystem.searchTemplates) {
          // Select keyword matching persona & opportunity keywords
          const personaKeyword = persona.keywords[0];
          const oppKeyword = oppType.keywords[0];
          const combinedKeyword = `${personaKeyword} ${oppKeyword}`;

          // Format search query using template parameters
          const queryStr = template
            .replace('{keyword}', combinedKeyword)
            .replace('{location}', location)
            .trim();

          const normKey = QueryNormalizer.normalize(queryStr);
          if (seenNormKeys.has(normKey)) continue;
          seenNormKeys.add(normKey);

          const priorityScore = calculateQueryPriority(persona, oppType, location, ecosystem);

          rawQueries.push({
            query: queryStr,
            priorityScore,
            personaId: persona.id,
            location,
          });
        }
      }
    }
  }

  // Diversify to ensure multi-disciplinary domain coverage without single-persona saturation
  const diversified = diversifyQueries(rawQueries, QUERY_ENGINE_CONFIG.MAX_QUERIES_PER_SOURCE);

  // Sort descending by final query rank
  return diversified.sort((a, b) => b.priorityScore - a.priorityScore);
}
