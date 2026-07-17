import {
  DiscoveryContext,
  PlannedQuery,
  PrioritizedSearchPlan,
  SearchStrategy,
} from '../types/query.types';
import { MISSION_CONFIGS } from './mission-configs';
import { IntentGenerator } from './intent-generator';
import { EcosystemPlanner } from './ecosystem-planner';
import { LocationPlanner } from './location-planner';
import { CompanyPlanner } from './company-planner';
import { ATSPlanner } from './ats-planner';
import { DISCOVERY_CONFIG } from '../config/discovery.config';

function computePriority(query: PlannedQuery): number {
  const priorityScore = query.priority === 'high' ? 3 : query.priority === 'medium' ? 2 : 1;
  const strategyScore =
    query.strategy === 'ATS'
      ? 5
      : query.strategy === 'COMPANY'
        ? 4
        : query.strategy === 'ECOSYSTEM'
          ? 3
          : query.strategy === 'LOCATION'
            ? 2
            : query.strategy === 'INTENT'
              ? 1
              : 0;
  return priorityScore * 10 + strategyScore;
}

export async function generateSearchQueries(
  context: DiscoveryContext,
): Promise<PrioritizedSearchPlan> {
  const mission = context.mission || 'ENGINEERING_INTERNSHIPS';
  const config = MISSION_CONFIGS[mission];
  const limit = context.maxQueries || DISCOVERY_CONFIG.MAX_SEARCH_QUERIES;

  const baseIntents = IntentGenerator.generate(config);

  const budgetAllocation = {
    ats: config.preferredATS.length > 0 ? 0.35 : 0,
    company: config.companyDiscoveryEnabled ? 0.25 : 0,
    ecosystem:
      config.priorityEcosystems.length > 0 && mission !== 'ENGINEERING_INTERNSHIPS' ? 0.2 : 0,
    location: config.priorityCities.length > 0 ? 0.15 : 0,
    official: 0.1,
    community: 0.05,
  };

  const totalBudget = Object.values(budgetAllocation).reduce((sum, b) => sum + b, 0);
  const normalizedBudget: Record<string, number> = {};
  for (const [key, value] of Object.entries(budgetAllocation)) {
    normalizedBudget[key] = totalBudget > 0 ? value / totalBudget : 0;
  }

  const atsQueries = ATSPlanner.generate(
    mission,
    config,
    normalizedBudget.ats,
    Math.max(1, Math.round(limit * normalizedBudget.ats)),
  );

  const companyQueries = CompanyPlanner.generate(
    mission,
    config,
    normalizedBudget.company,
    Math.max(1, Math.round(limit * normalizedBudget.company)),
  );

  const ecosystemQueries = EcosystemPlanner.generate(
    mission,
    config,
    baseIntents,
    normalizedBudget.ecosystem,
    Math.max(1, Math.round(limit * normalizedBudget.ecosystem)),
  );

  const locationQueries = LocationPlanner.generate(
    mission,
    config,
    baseIntents,
    normalizedBudget.location,
    Math.max(1, Math.round(limit * normalizedBudget.location)),
  );

  const intentQueries: PlannedQuery[] = baseIntents
    .slice(0, Math.max(1, Math.round(limit * normalizedBudget.official)))
    .map((item, index) => ({
      query: item.intent.toLowerCase(),
      priority: index < 10 ? 'high' : index < 20 ? 'medium' : 'low',
      category: item.category,
      tags: ['intent', ...item.intent.toLowerCase().split(' ').slice(0, 3)],
      expectedOpportunityType: mission === 'HACKATHONS' ? 'HACKATHON' : 'INTERNSHIP',
      strategy: 'INTENT' as SearchStrategy,
      expectedSourceType: 'SEARCH_API',
      reason: `Core mission intent [${index + 1}/${baseIntents.length}]`,
      budget: normalizedBudget.official,
      depth: 1,
    }));

  const allQueries = [
    ...atsQueries,
    ...companyQueries,
    ...ecosystemQueries,
    ...locationQueries,
    ...intentQueries,
  ];

  const seen = new Set<string>();
  const deduplicated: PlannedQuery[] = [];
  for (const query of allQueries) {
    const normalizedQuery = query.query.trim().toLowerCase();
    if (!seen.has(normalizedQuery)) {
      seen.add(normalizedQuery);
      deduplicated.push(query);
    }
  }

  deduplicated.sort((a, b) => computePriority(b) - computePriority(a));

  const finalQueries = deduplicated.slice(0, limit);

  const meta = {
    totalQueries: finalQueries.length,
    searchIntents: intentQueries.length,
    companyDiscoverySearches: companyQueries.length,
    atsSearches: atsQueries.length,
    officialSearches: intentQueries.filter((q) => q.strategy === 'INTENT').length,
    communitySearches: 0,
    expectedCompanies: companyQueries.length,
    expectedEcosystems: ecosystemQueries.length,
    expectedCities: new Set(locationQueries.map((q) => q.expectedLocation).filter(Boolean)).size,
    estimatedSearchBudget: 100,
  };

  const plan: PrioritizedSearchPlan = {
    mission,
    configuration: config,
    queries: finalQueries.map((q) => q.query),
    plannedQueries: finalQueries,
    meta,
  };

  console.log(
    `[Mission Query Planner] Mission: ${mission} | ` +
      `Search Intents: ${meta.searchIntents} | ` +
      `Company Discovery: ${meta.companyDiscoverySearches} | ` +
      `ATS Searches: ${meta.atsSearches} | ` +
      `Official Searches: ${meta.officialSearches} | ` +
      `Expected Companies: ${meta.expectedCompanies} | ` +
      `Expected Ecosystems: ${meta.expectedEcosystems} | ` +
      `Expected Cities: ${meta.expectedCities} | ` +
      `Budget: ${meta.estimatedSearchBudget}% | ` +
      `Total Queries: ${meta.totalQueries}`,
  );

  return plan;
}
