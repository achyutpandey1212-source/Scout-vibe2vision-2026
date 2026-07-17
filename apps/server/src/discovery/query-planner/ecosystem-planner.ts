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
          priorityScore: 0,
          category: 'STARTUP_INTERNSHIPS',
          tags: ['ecosystem', 'startup', ecosystem.toLowerCase()],
          expectedOpportunityType: 'INTERNSHIP',
          strategy: 'ECOSYSTEM',
          purpose: 'DISCOVER_PORTFOLIO',
          expectedSourceType: 'INCUBATOR',
          expectedEcosystem: ecosystem,
          reason: `Ecosystem-first discovery for ${ecosystem} portfolio companies`,
          explanation:
            config.explanationTemplates?.ecosystem ||
            'Discover portfolio companies before crawling career pages.',
          budget: budgetRatio,
          depth: 1,
        });

        queries.push({
          query: `${ecosystem} portfolio careers internship`.toLowerCase(),
          priority: 'high',
          priorityScore: 0,
          category: 'STARTUP_INTERNSHIPS',
          tags: ['ecosystem', 'portfolio', 'careers'],
          expectedOpportunityType: 'INTERNSHIP',
          strategy: 'ECOSYSTEM',
          purpose: 'DISCOVER_PORTFOLIO',
          expectedSourceType: 'INCUBATOR',
          expectedEcosystem: ecosystem,
          reason: `Portfolio company career pages for ${ecosystem}`,
          explanation:
            config.explanationTemplates?.ecosystem ||
            'Discover portfolio companies before crawling career pages.',
          budget: budgetRatio,
          depth: 2,
        });

        queries.push({
          query: `${ecosystem} startup jobs intern`.toLowerCase(),
          priority: 'medium',
          priorityScore: 0,
          category: 'STARTUP_INTERNSHIPS',
          tags: ['ecosystem', 'jobs', 'startup'],
          expectedOpportunityType: 'INTERNSHIP',
          strategy: 'ECOSYSTEM',
          purpose: 'DISCOVER_PORTFOLIO',
          expectedSourceType: 'INCUBATOR',
          expectedEcosystem: ecosystem,
          reason: `Job listings from ${ecosystem} ecosystem`,
          explanation:
            config.explanationTemplates?.ecosystem ||
            'Discover portfolio companies before crawling career pages.',
          budget: budgetRatio,
          depth: 1,
        });
      } else if (mission === 'RESEARCH_INTERNSHIPS') {
        queries.push({
          query: `${ecosystem} research internship engineering`.toLowerCase(),
          priority: 'high',
          priorityScore: 0,
          category: 'RESEARCH_INTERNSHIP',
          tags: ['ecosystem', 'research', ecosystem.toLowerCase()],
          expectedOpportunityType: 'INTERNSHIP',
          strategy: 'ECOSYSTEM',
          purpose: 'DISCOVER_PORTFOLIO',
          expectedSourceType: 'UNIVERSITY',
          expectedEcosystem: ecosystem,
          reason: `Research internships at ${ecosystem}`,
          explanation:
            config.explanationTemplates?.ecosystem ||
            'Discover portfolio companies before crawling career pages.',
          budget: budgetRatio,
          depth: 1,
        });
      } else if (mission === 'HACKATHONS') {
        queries.push({
          query: `${ecosystem} hackathon student`.toLowerCase(),
          priority: 'high',
          priorityScore: 0,
          category: 'HACKATHONS',
          tags: ['ecosystem', 'hackathon', ecosystem.toLowerCase()],
          expectedOpportunityType: 'HACKATHON',
          strategy: 'ECOSYSTEM',
          purpose: 'DISCOVER_EVENTS',
          expectedSourceType: 'PLATFORM',
          expectedEcosystem: ecosystem,
          reason: `Hackathons hosted on ${ecosystem} platform`,
          explanation:
            config.explanationTemplates?.ecosystem ||
            'Discover portfolio companies before crawling career pages.',
          budget: budgetRatio,
          depth: 1,
        });
      }

      if (queries.length >= maxQueries) break;
    }

    return queries.slice(0, maxQueries);
  }
}
