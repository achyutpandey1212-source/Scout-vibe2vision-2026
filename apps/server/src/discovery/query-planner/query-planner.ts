import {
  DiscoveryContext,
  PlannedQuery,
  PlanMeta,
  PrioritizedSearchPlan,
  QueryPurpose,
  SearchStrategy,
} from '../types/query.types';
import { MISSION_CONFIGS } from './mission-configs';
import { IntentGenerator } from './intent-generator';
import { EcosystemPlanner } from './ecosystem-planner';
import { LocationPlanner } from './location-planner';
import { CompanyPlanner } from './company-planner';
import { ATSPlanner } from './ats-planner';
import { DISCOVERY_CONFIG } from '../config/discovery.config';
import { QueryDeduplicator } from './query-deduplicator';
import { DiversityValidator, DiversityReport } from './diversity-validator';
import { PriorityScorer } from './priority-scorer';

const STRATEGY_BUDGET_RATIOS: Record<string, number> = {
  ats: 0.35,
  company: 0.25,
  ecosystem: 0.2,
  location: 0.15,
  official: 0.1,
  community: 0.05,
};

function getPurposeForStrategy(strategy: SearchStrategy): QueryPurpose {
  switch (strategy) {
    case 'ATS':
      return 'DISCOVER_ATS';
    case 'COMPANY':
      return 'DISCOVER_CAREERS';
    case 'ECOSYSTEM':
      return 'DISCOVER_PORTFOLIO';
    case 'LOCATION':
      return 'DISCOVER_INTERNSHIPS';
    case 'INTENT':
      return 'DISCOVER_INTERNSHIPS';
    case 'OFFICIAL':
      return 'DISCOVER_PROGRAMS';
    case 'COMMUNITY':
      return 'DISCOVER_COMMUNITIES';
    default:
      return 'DISCOVER_INTERNSHIPS';
  }
}

function assignExplanation(
  query: PlannedQuery,
  templates:
    | { ats?: string; company?: string; ecosystem?: string; location?: string; intent?: string }
    | undefined,
): string {
  if (query.explanation) return query.explanation;
  switch (query.strategy) {
    case 'ATS':
      return templates?.ats || 'Official ATS search with historically high internship yield.';
    case 'COMPANY':
      return templates?.company || 'Direct career page discovery for high-priority employer.';
    case 'ECOSYSTEM':
      return templates?.ecosystem || 'Discover portfolio companies before crawling career pages.';
    case 'LOCATION':
      return templates?.location || 'High-density startup ecosystem in priority geography.';
    case 'INTENT':
      return templates?.intent || 'Core mission-aligned search intent for maximum coverage.';
    default:
      return query.reason || 'Strategic search query.';
  }
}

function enforceBudget(
  queries: PlannedQuery[],
  budgetSlots: Record<string, number>,
): PlannedQuery[] {
  const counts: Record<string, number> = {};
  const accepted: PlannedQuery[] = [];

  for (const query of queries) {
    const strategyKey = query.strategy.toLowerCase();
    const limit = budgetSlots[strategyKey] || 0;

    if (counts[strategyKey] === undefined) {
      counts[strategyKey] = 0;
    }

    if (counts[strategyKey] < limit) {
      counts[strategyKey]++;
      accepted.push(query);
    }
  }

  return accepted;
}

export async function generateSearchQueries(
  context: DiscoveryContext,
): Promise<PrioritizedSearchPlan> {
  const mission = context.mission || 'ENGINEERING_INTERNSHIPS';
  const config = MISSION_CONFIGS[mission];
  const limit = context.maxQueries || DISCOVERY_CONFIG.MAX_SEARCH_QUERIES;

  const baseIntents = IntentGenerator.generate(config);

  const budgetAllocation: Record<string, number> = {
    ats: config.preferredATS.length > 0 ? STRATEGY_BUDGET_RATIOS.ats : 0,
    company: config.companyDiscoveryEnabled ? STRATEGY_BUDGET_RATIOS.company : 0,
    ecosystem:
      config.priorityEcosystems.length > 0 && mission !== 'ENGINEERING_INTERNSHIPS'
        ? STRATEGY_BUDGET_RATIOS.ecosystem
        : 0,
    location: config.priorityCities.length > 0 ? STRATEGY_BUDGET_RATIOS.location : 0,
    official: STRATEGY_BUDGET_RATIOS.official,
    community: STRATEGY_BUDGET_RATIOS.community,
  };

  const totalBudget = Object.values(budgetAllocation).reduce((sum, b) => sum + b, 0);
  const normalizedBudget: Record<string, number> = {};
  for (const [key, value] of Object.entries(budgetAllocation)) {
    normalizedBudget[key] = totalBudget > 0 ? Math.round((value / totalBudget) * 100) / 100 : 0;
  }

  const budgetSlots: Record<string, number> = {};
  for (const [key, ratio] of Object.entries(normalizedBudget)) {
    budgetSlots[key] = Math.max(1, Math.round(limit * ratio));
  }

  const atsQueries = ATSPlanner.generate(mission, config, normalizedBudget.ats, budgetSlots.ats);

  const companyQueries = CompanyPlanner.generate(
    mission,
    config,
    normalizedBudget.company,
    budgetSlots.company,
  );

  const ecosystemQueries = EcosystemPlanner.generate(
    mission,
    config,
    baseIntents,
    normalizedBudget.ecosystem,
    budgetSlots.ecosystem,
  );

  const locationQueries = LocationPlanner.generate(
    mission,
    config,
    baseIntents,
    normalizedBudget.location,
    budgetSlots.location,
  );

  const intentQueries: PlannedQuery[] = baseIntents
    .slice(0, budgetSlots.official)
    .map((item, index) => ({
      query: item.intent.toLowerCase(),
      priority: index < 10 ? 'high' : index < 20 ? 'medium' : 'low',
      priorityScore: 0,
      category: item.category,
      tags: ['intent', ...item.intent.toLowerCase().split(' ').slice(0, 3)],
      expectedOpportunityType: mission === 'HACKATHONS' ? 'HACKATHON' : 'INTERNSHIP',
      strategy: 'INTENT' as SearchStrategy,
      purpose: getPurposeForStrategy('INTENT'),
      expectedSourceType: 'SEARCH_API',
      reason: `Core mission intent [${index + 1}/${baseIntents.length}]`,
      explanation:
        config.explanationTemplates?.intent ||
        'Core mission-aligned search intent for maximum coverage.',
      budget: normalizedBudget.official,
      depth: 1,
    }));

  const allQueries: PlannedQuery[] = [
    ...atsQueries,
    ...companyQueries,
    ...ecosystemQueries,
    ...locationQueries,
    ...intentQueries,
  ];

  for (const query of allQueries) {
    if (!query.purpose) {
      query.purpose = getPurposeForStrategy(query.strategy);
    }
    if (!query.explanation) {
      query.explanation = assignExplanation(query, config.explanationTemplates);
    }
    query.priorityScore = PriorityScorer.score(query);
  }

  const preDupCount = allQueries.length;
  const dedupedStrings = QueryDeduplicator.deduplicate(allQueries.map((q) => q.query));
  const dedupedQueries = allQueries.filter((q) => dedupedStrings.unique.includes(q.query));

  const enforcedQueries = enforceBudget(dedupedQueries, budgetSlots);

  const finalQueries = enforcedQueries
    .slice(0, limit)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const diversity = DiversityValidator.validate(finalQueries);

  const avgPriority =
    finalQueries.length > 0
      ? Math.round(finalQueries.reduce((sum, q) => sum + q.priorityScore, 0) / finalQueries.length)
      : 0;

  const avgBudget =
    finalQueries.length > 0
      ? Math.round((finalQueries.reduce((sum, q) => sum + q.budget, 0) / finalQueries.length) * 100)
      : 0;

  const strategiesUsed: Record<SearchStrategy, number> = {
    INTENT: 0,
    ECOSYSTEM: 0,
    LOCATION: 0,
    COMPANY: 0,
    ATS: 0,
    OFFICIAL: 0,
    COMMUNITY: 0,
  };
  for (const q of finalQueries) {
    strategiesUsed[q.strategy]++;
  }

  const meta: PlanMeta = {
    mission,
    totalGenerated: preDupCount,
    duplicatesRemoved: preDupCount - finalQueries.length,
    finalQueries: finalQueries.length,
    averagePriority: avgPriority,
    averageBudget: avgBudget,
    strategiesUsed,
    citiesCovered: [
      ...new Set(finalQueries.map((q) => q.expectedLocation).filter(Boolean) as string[]),
    ],
    engineeringDomainsCovered: [...new Set(finalQueries.map((q) => q.category))],
    atsProviders: [...new Set(finalQueries.map((q) => q.expectedATS).filter(Boolean) as string[])],
    companiesExpected: finalQueries.filter((q) => q.strategy === 'COMPANY').length,
    ecosystemsCovered: [
      ...new Set(finalQueries.map((q) => q.expectedEcosystem).filter(Boolean) as string[]),
    ],
    budgetUtilization: Math.round((finalQueries.length / Math.max(1, limit)) * 100),
    missionCoverage: Math.min(
      100,
      Math.round((finalQueries.length / Math.max(1, baseIntents.length)) * 100),
    ),
    diversity: {
      intent: diversity.intentDiversity,
      location: diversity.locationDiversity,
      strategy: diversity.strategyDiversity,
      engineeringDomain: diversity.engineeringDomainDiversity,
      companyDiscovery: diversity.companyDiscoveryDiversity,
      ats: diversity.atsDiversity,
    },
  };

  const plan: PrioritizedSearchPlan = {
    mission,
    configuration: config,
    queries: finalQueries.map((q) => q.query),
    plannedQueries: finalQueries,
    meta,
  };

  console.log(formatPlanLog(plan, diversity));

  return plan;
}

function formatPlanLog(plan: PrioritizedSearchPlan, diversity: DiversityReport): string {
  const strategyCounts = plan.meta.strategiesUsed;
  const lines: string[] = [];

  lines.push('');
  lines.push('=================================================');
  lines.push('Mission Query Planner');
  lines.push('=================================================');
  lines.push(`Mission              : ${plan.mission}`);
  lines.push(`Generated            : ${plan.meta.totalGenerated}`);
  lines.push(`Removed              : ${plan.meta.duplicatesRemoved} duplicates`);
  lines.push(`Final                : ${plan.meta.finalQueries}`);
  lines.push('-----------------------------------------------');
  lines.push('Strategies');
  for (const [strategy, count] of Object.entries(strategyCounts)) {
    if (count > 0) lines.push(`  ${strategy.padEnd(20)}: ${count}`);
  }
  lines.push('-----------------------------------------------');
  lines.push('Engineering Domains');
  for (const domain of plan.meta.engineeringDomainsCovered.slice(0, 8)) {
    lines.push(`  ${domain}`);
  }
  lines.push('-----------------------------------------------');
  lines.push('Cities');
  for (const city of plan.meta.citiesCovered.slice(0, 8)) {
    lines.push(`  ${city}`);
  }
  lines.push('-----------------------------------------------');
  lines.push('Priority');
  lines.push(`  Average             : ${plan.meta.averagePriority}`);
  lines.push(`  Highest             : ${plan.plannedQueries[0]?.priorityScore || 0}`);
  lines.push(
    `  Lowest              : ${plan.plannedQueries[plan.plannedQueries.length - 1]?.priorityScore || 0}`,
  );
  lines.push('-----------------------------------------------');
  lines.push('Budget Utilization   : ' + plan.meta.budgetUtilization + '%');
  lines.push('=================================================');
  lines.push('');
  lines.push(DiversityValidator.formatReport(diversity));

  return lines.join('\n');
}
