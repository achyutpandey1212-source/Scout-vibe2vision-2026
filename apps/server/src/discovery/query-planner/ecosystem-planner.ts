import { MissionConfiguration, PlannedQuery } from '../types/query.types';

export class EcosystemPlanner {
  static generate(
    mission: string,
    config: MissionConfiguration,
    baseIntents: { intent: string; category: string }[],
    budgetRatio: number,
    maxQueries: number,
  ): PlannedQuery[] {
    if (config.priorityEcosystems.length === 0 || mission === 'ENGINEERING_INTERNSHIPS') {
      return [];
    }

    const queries: PlannedQuery[] = [];
    const ecosystems = config.priorityEcosystems;

    for (let i = 0; i < ecosystems.length; i++) {
      const ecosystem = ecosystems[i];

      if (mission === 'STARTUP_INTERNSHIPS') {
        queries.push({
          query: `${ecosystem} hiring interns`.toLowerCase(),
          priority: 'high',
          category: 'STARTUP_INTERNSHIPS',
          tags: ['ecosystem', 'startup', ecosystem.toLowerCase()],
          expectedOpportunityType: 'INTERNSHIP',
          strategy: 'ECOSYSTEM',
          expectedSourceType: 'INCUBATOR',
          expectedEcosystem: ecosystem,
          reason: `Ecosystem-first discovery for ${ecosystem} portfolio companies`,
          budget: budgetRatio,
          depth: 1,
        });

        queries.push({
          query: `${ecosystem} portfolio careers internship`.toLowerCase(),
          priority: 'high',
          category: 'STARTUP_INTERNSHIPS',
          tags: ['ecosystem', 'portfolio', 'careers'],
          expectedOpportunityType: 'INTERNSHIP',
          strategy: 'ECOSYSTEM',
          expectedSourceType: 'INCUBATOR',
          expectedEcosystem: ecosystem,
          reason: `Portfolio company career pages for ${ecosystem}`,
          budget: budgetRatio,
          depth: 2,
        });

        queries.push({
          query: `${ecosystem} startup jobs intern`.toLowerCase(),
          priority: 'medium',
          category: 'STARTUP_INTERNSHIPS',
          tags: ['ecosystem', 'jobs', 'startup'],
          expectedOpportunityType: 'INTERNSHIP',
          strategy: 'ECOSYSTEM',
          expectedSourceType: 'INCUBATOR',
          expectedEcosystem: ecosystem,
          reason: `Job listings from ${ecosystem} ecosystem`,
          budget: budgetRatio,
          depth: 1,
        });
      } else if (mission === 'RESEARCH_INTERNSHIPS') {
        queries.push({
          query: `${ecosystem} research internship engineering`.toLowerCase(),
          priority: 'high',
          category: 'RESEARCH_INTERNSHIP',
          tags: ['ecosystem', 'research', ecosystem.toLowerCase()],
          expectedOpportunityType: 'INTERNSHIP',
          strategy: 'ECOSYSTEM',
          expectedSourceType: 'UNIVERSITY',
          expectedEcosystem: ecosystem,
          reason: `Research internships at ${ecosystem}`,
          budget: budgetRatio,
          depth: 1,
        });
      } else if (mission === 'HACKATHONS') {
        queries.push({
          query: `${ecosystem} hackathon student`.toLowerCase(),
          priority: 'high',
          category: 'HACKATHONS',
          tags: ['ecosystem', 'hackathon', ecosystem.toLowerCase()],
          expectedOpportunityType: 'HACKATHON',
          strategy: 'ECOSYSTEM',
          expectedSourceType: 'PLATFORM',
          expectedEcosystem: ecosystem,
          reason: `Hackathons hosted on ${ecosystem} platform`,
          budget: budgetRatio,
          depth: 1,
        });
      }

      if (queries.length >= maxQueries) break;
    }

    return queries.slice(0, maxQueries);
  }
}
