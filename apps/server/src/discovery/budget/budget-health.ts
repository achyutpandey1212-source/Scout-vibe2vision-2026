import { DiscoveryMission, SearchStrategy } from '../types/query.types';
import { BUDGET_CONFIG } from './budget-config';
import { getActiveMissions } from './mission-budget';
import { computeMissionShares } from './mission-budget';
import { runBudgetEngine } from './budget-engine';
import { BudgetHealth } from './budget.types';
import { PlannedQuery } from '../types/query.types';
import { OpportunityYield } from '../ecosystem-intelligence/ecosystem.types';

/**
 * Budget Health — `npm run budget:health`.
 *
 * Reports configured mission weights, strategy weights, budget usage, average
 * budget rank, distribution, and the top/lowest 20 queries across all missions.
 */

export interface BudgetHealthInput {
  /** Per-mission planned queries to analyze. */
  queriesByMission: Partial<Record<DiscoveryMission, PlannedQuery[]>>;
  /** Optional per-query ecosystem yield resolver. */
  ecosystemYieldFor?: (query: PlannedQuery) => OpportunityYield;
  /** Total search budget used to scale allocations (defaults to sum of mission weights). */
  totalBudget?: number;
}

/** Build the health report from supplied planned queries per mission. */
export function buildBudgetHealth(input: BudgetHealthInput): BudgetHealth {
  const shares = computeMissionShares();
  const activeMissions = getActiveMissions();

  const configuredMissions = activeMissions.map((m) => ({
    mission: m.mission,
    weight: m.weight,
    share: Math.round((shares[m.mission] || 0) * 1000) / 10,
  }));

  const missionWeights: Record<string, number> = {};
  for (const m of activeMissions) missionWeights[m.mission] = m.weight;

  const strategyWeights = BUDGET_CONFIG.strategyWeights;

  // Run the engine for each mission and aggregate.
  const allRanked = [];
  let totalAllocated = 0;
  const distribution = {} as Record<SearchStrategy, number>;

  for (const m of activeMissions) {
    const queries = input.queriesByMission[m.mission] || [];
    if (queries.length === 0) continue;
    const res = runBudgetEngine(m.mission, queries, input.ecosystemYieldFor);
    totalAllocated += res.allocation.totalBudget;
    for (const q of res.funded) {
      distribution[q.strategy] = (distribution[q.strategy] || 0) + 1;
    }
    allRanked.push(...res.ranked);
  }

  const totalBudget = input.totalBudget ?? totalAllocated;
  const ranks = allRanked.map((q) => q.budgetScore);
  const averageBudgetRank =
    ranks.length > 0 ? Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length) : 0;

  const sorted = allRanked
    .slice()
    .sort((a, b) => b.budgetScore - a.budgetScore || a.query.localeCompare(b.query));

  const top20 = sorted.slice(0, 20).map((q) => ({
    query: q.query,
    budgetRank: q.budgetScore,
    mission: q.mission,
  }));
  const lowest20 = sorted
    .slice(-20)
    .reverse()
    .map((q) => ({
      query: q.query,
      budgetRank: q.budgetScore,
      mission: q.mission,
    }));

  return {
    configuredMissions,
    missionWeights,
    strategyWeights,
    budgetUsage: {
      totalBudget,
      allocated: totalAllocated,
      unused: Math.max(0, totalBudget - totalAllocated),
    },
    averageBudgetRank,
    distribution,
    top20,
    lowest20,
  };
}

/** Render the health report as ASCII. */
export function renderBudgetHealth(health: BudgetHealth): string {
  const sep = '=================================';
  const dashes = '---------------------------------';
  const lines: string[] = [];

  lines.push(sep);
  lines.push('Budget Health');
  lines.push(sep);

  lines.push('Configured Missions');
  for (const m of health.configuredMissions) {
    lines.push(`  ${m.mission.padEnd(28)} weight=${m.weight}  share=${m.share}%`);
  }
  lines.push(dashes);

  lines.push('Mission Weights');
  for (const [k, v] of Object.entries(health.missionWeights)) {
    lines.push(`  ${k.padEnd(28)} : ${v}`);
  }
  lines.push(dashes);

  lines.push('Strategy Weights');
  for (const [mission, weights] of Object.entries(health.strategyWeights)) {
    lines.push(`  ${mission}`);
    for (const w of weights) {
      lines.push(`    ${w.strategy.padEnd(12)} : ${w.weight} ${w.enabled ? '' : '(disabled)'}`);
    }
  }
  lines.push(dashes);

  lines.push('Budget Usage');
  lines.push(`  Total     : ${health.budgetUsage.totalBudget}`);
  lines.push(`  Allocated : ${health.budgetUsage.allocated}`);
  lines.push(`  Unused    : ${health.budgetUsage.unused}`);
  lines.push(`  Avg Rank  : ${health.averageBudgetRank}`);
  lines.push(dashes);

  lines.push('Distribution');
  for (const [k, v] of Object.entries(health.distribution)) {
    lines.push(`  ${k.padEnd(12)} : ${v}`);
  }
  lines.push(dashes);

  lines.push('Top 20 Queries');
  health.top20.forEach((q, i) => {
    lines.push(`  ${String(i + 1).padStart(2)}. [${q.budgetRank}] ${q.query} (${q.mission})`);
  });
  lines.push(dashes);

  lines.push('Lowest 20 Queries');
  health.lowest20.forEach((q, i) => {
    lines.push(`  ${String(i + 1).padStart(2)}. [${q.budgetRank}] ${q.query} (${q.mission})`);
  });
  lines.push(sep);

  return lines.join('\n');
}
