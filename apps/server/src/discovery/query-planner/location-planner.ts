import { DiscoveryMission, MissionConfiguration, PlannedQuery } from '../types/query.types';
import { SourceCategory } from '@scout/shared';

export class LocationPlanner {
  static generate(
    mission: DiscoveryMission,
    config: MissionConfiguration,
    baseIntents: { intent: string; category: SourceCategory; engineeringDomain: string }[],
    budgetRatio: number,
    maxQueries: number,
  ): PlannedQuery[] {
    if (config.priorityCities.length === 0) {
      return [];
    }

    const queries: PlannedQuery[] = [];
    const cities = config.priorityCities;
    const intents = baseIntents.slice(0, 15);

    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      const intent = intents[i % intents.length];
      queries.push({
        query: `${intent.intent} ${city}`.toLowerCase(),
        priority: 'medium',
        priorityScore: 0,
        category: intent.category,
        tags: [
          'location',
          city.toLowerCase(),
          ...intent.intent.toLowerCase().split(' ').slice(0, 3),
        ],
        expectedOpportunityType: mission === 'HACKATHONS' ? 'HACKATHON' : 'INTERNSHIP',
        strategy: 'LOCATION',
        purpose: 'DISCOVER_INTERNSHIPS',
        expectedSourceType: 'SEARCH_API',
        expectedLocation: city,
        engineeringDomain: intent.engineeringDomain,
        reason: `Location-aware search for ${intent.intent} in ${city}`,
        explanation:
          config.explanationTemplates?.location ||
          'High-density startup ecosystem in priority geography.',
        budget: budgetRatio,
        depth: 1,
      });

      if (mission === 'STARTUP_INTERNSHIPS' || mission === 'ENGINEERING_INTERNSHIPS') {
        queries.push({
          query: `${intent.intent} ${city} startup`.toLowerCase(),
          priority: 'medium',
          priorityScore: 0,
          category: intent.category,
          tags: ['location', 'startup', city.toLowerCase()],
          expectedOpportunityType: 'INTERNSHIP',
          strategy: 'LOCATION',
          purpose: 'DISCOVER_INTERNSHIPS',
          expectedSourceType: 'SEARCH_API',
          expectedLocation: city,
          engineeringDomain: intent.engineeringDomain,
          reason: `Startup-focused search for ${intent.intent} in ${city}`,
          explanation:
            config.explanationTemplates?.location ||
            'High-density startup ecosystem in priority geography.',
          budget: budgetRatio,
          depth: 1,
        });
      }

      if (queries.length >= maxQueries) break;
    }

    if (queries.length < maxQueries && mission === 'STARTUP_INTERNSHIPS') {
      queries.push({
        query: `remote startup internship india`.toLowerCase(),
        priority: 'medium',
        priorityScore: 0,
        category: 'STARTUP_INTERNSHIPS',
        tags: ['remote', 'startup', 'india'],
        expectedOpportunityType: 'INTERNSHIP',
        strategy: 'LOCATION',
        purpose: 'DISCOVER_INTERNSHIPS',
        expectedSourceType: 'SEARCH_API',
        expectedLocation: 'Remote',
        engineeringDomain: 'General Engineering',
        reason: 'Remote startup internship discovery across India',
        explanation:
          config.explanationTemplates?.location ||
          'High-density startup ecosystem in priority geography.',
        budget: budgetRatio,
        depth: 1,
      });
    }

    return queries.slice(0, maxQueries);
  }
}
