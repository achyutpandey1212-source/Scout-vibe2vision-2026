import { DiscoveryMission, PlannedQuery, SearchStrategy } from '../types/query.types';
import { OpportunityYield, Priority } from '../ecosystem-intelligence/ecosystem.types';
import { BUDGET_CONFIG, getMissionWeight, getStrategyWeights } from './budget-config';
import { AllocatedBudget, allocateBudget, slotsFor } from './budget-allocator';
import { BudgetRankedQuery, BudgetScoreSignals, MissionAllocation } from './budget.types';

/**
 * Budget Engine — decides which planned queries deserve API calls.
 *
 * Two stages, both deterministic and LLM-free:
 *
 *   1. Allocation (budget-allocator): how many searches each mission/strategy gets.
 *   2. Ranking (here): every planned query gets a `budgetRank` (0-100) combining
 *      priorityScore, company/ecosystem/strategy/mission/city metadata into one
 *      deterministic budget score. Queries are then funded in rank order until each
 *      strategy's slot budget is exhausted.
 *
 * `priorityScore` answers "how good is this query?". `budgetRank` answers
 * "should Scout spend money here?".
 */

/** Normalize an arbitrary number to 0-1 against an expected range. */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/** Resolve the mission priority from config (1 = highest). */
export function missionPriority(mission: DiscoveryMission): Priority {
  const cfg = getMissionWeight(mission);
  // Lower weight → lower priority. Map enabled-mission order to a 1..3 band.
  if (!cfg) return 3;
  const order = BUDGET_CONFIG.missions
    .filter((m) => m.enabled)
    .sort((a, b) => b.weight - a.weight)
    .findIndex((m) => m.mission === mission);
  const band =
    order < 0
      ? 3
      : Math.min(
          3,
          Math.floor(
            order / Math.max(1, BUDGET_CONFIG.missions.filter((m) => m.enabled).length / 3),
          ) + 1,
        );
  return (band as Priority) || 1;
}

/** Resolve the strategy priority from config (1 = highest weight). */
export function strategyPriority(mission: DiscoveryMission, strategy: SearchStrategy): Priority {
  const weights = getStrategyWeights(mission) || [];
  const active = weights.filter((s) => s.enabled);
  if (active.length === 0) return 3;
  const sorted = [...active].sort((a, b) => b.weight - a.weight);
  const idx = sorted.findIndex((s) => s.strategy === strategy);
  const band = idx < 0 ? 3 : Math.min(3, Math.floor(idx / Math.max(1, sorted.length / 3)) + 1);
  return (band as Priority) || 1;
}

/**
 * Compute the deterministic budget score (0-100) for a query from its metadata.
 *
 * Formula (weighted, configurable):
 *   score = 100 * Σ w_i * normalizedSignal_i
 *
 * Signals (each normalized 0-1):
 *   - queryPriority   : priorityScore / 100
 *   - companyPriority : companyPriority / 100 (0 if unknown)
 *   - ecosystemYield  : yieldWeights[ecosystemYield]
 *   - strategyPriority: priorityWeights[strategyPriority]
 *   - missionPriority : priorityWeights[missionPriority]
 *   - cityPriority    : cityPriority / 100 (0 if unknown)
 */
export function computeBudgetScore(
  signals: BudgetScoreSignals,
  scoreWeights = BUDGET_CONFIG.scoreWeights,
): number {
  const queryPriorityN = normalize(signals.queryPriority, 0, 100);
  const companyPriorityN = normalize(signals.companyPriority, 0, 100);
  const ecosystemYieldN = BUDGET_CONFIG.yieldWeights[signals.ecosystemYield] ?? 0.5;
  const strategyPriorityN = BUDGET_CONFIG.priorityWeights[signals.strategyPriority] ?? 0.5;
  const missionPriorityN = BUDGET_CONFIG.priorityWeights[signals.missionPriority] ?? 0.5;
  const cityPriorityN = normalize(signals.cityPriority, 0, 100);

  const weighted =
    scoreWeights.queryPriority * queryPriorityN +
    scoreWeights.companyPriority * companyPriorityN +
    scoreWeights.ecosystemYield * ecosystemYieldN +
    scoreWeights.strategyPriority * strategyPriorityN +
    scoreWeights.missionPriority * missionPriorityN +
    scoreWeights.cityPriority * cityPriorityN;

  return Math.round(Math.min(100, Math.max(0, weighted * 100)));
}

/**
 * Build the deterministic budget-score signals for a planned query.
 *
 * Company / city / ecosystem priorities are taken from the query's existing
 * metadata when present; otherwise they default to 0. The ecosystem yield is
 * inferred from the query's expectedEcosystem (resolved by the engine) or falls
 * back to MEDIUM. Mission and strategy priorities come from config.
 */
export function buildSignals(
  query: PlannedQuery,
  mission: DiscoveryMission,
  ecosystemYield: OpportunityYield = 'MEDIUM',
): BudgetScoreSignals {
  return {
    queryPriority: query.priorityScore,
    companyPriority: query.expectedCompanyPriority ?? 0,
    ecosystemYield,
    strategyPriority: strategyPriority(mission, query.strategy),
    missionPriority: missionPriority(mission),
    cityPriority: query.expectedCityPriority ?? 0,
  };
}

/**
 * Run the full budget engine over a mission's planned queries.
 *
 * Returns:
 *   - the allocation (mission/strategy slot counts)
 *   - every query ranked by budget score (highest first)
 *   - which queries are funded (survive within their strategy's slot budget)
 */
export interface BudgetEngineResult {
  allocation: AllocatedBudget;
  ranked: BudgetRankedQuery[];
  funded: BudgetRankedQuery[];
  unfunded: BudgetRankedQuery[];
}

export function runBudgetEngine(
  mission: DiscoveryMission,
  queries: PlannedQuery[],
  ecosystemYieldFor: (query: PlannedQuery) => OpportunityYield = () => 'MEDIUM',
): BudgetEngineResult {
  const allocation = allocateBudget(queries.length || 0);

  // 1. Score + rank every query.
  const scored: BudgetRankedQuery[] = queries.map((q) => {
    const signals = buildSignals(q, mission, ecosystemYieldFor(q));
    const score = computeBudgetScore(signals);
    return {
      query: q.query,
      mission,
      strategy: q.strategy,
      priorityScore: q.priorityScore,
      budgetScore: score,
      budgetRank: 0, // assigned after sort
      signals,
      funded: false,
    };
  });

  scored.sort(
    (a, b) =>
      b.budgetScore - a.budgetScore ||
      b.priorityScore - a.priorityScore ||
      a.query.localeCompare(b.query),
  );
  scored.forEach((q, idx) => {
    q.budgetRank = scored.length - idx; // 1 = highest
  });

  // 2. Fund in rank order, respecting each strategy's slot budget.
  const usedByStrategy: Record<string, number> = {};
  const funded: BudgetRankedQuery[] = [];
  const unfunded: BudgetRankedQuery[] = [];

  for (const q of scored) {
    const key = q.strategy;
    const cap = strategyCap(allocation, mission, q.strategy);
    const used = usedByStrategy[key] || 0;
    if (used < cap) {
      q.funded = true;
      usedByStrategy[key] = used + 1;
      funded.push(q);
    } else {
      unfunded.push(q);
    }
  }

  return { allocation, ranked: scored, funded, unfunded };
}

/** Resolve the slot cap for a strategy from the allocation (0 if absent). */
function strategyCap(
  allocation: AllocatedBudget,
  mission: DiscoveryMission,
  strategy: SearchStrategy,
): number {
  return slotsFor(allocation, mission, strategy);
}

/** Convenience: rank only (no funding) for a single query. */
export function rankQuery(
  mission: DiscoveryMission,
  query: PlannedQuery,
  ecosystemYield: OpportunityYield = 'MEDIUM',
): BudgetRankedQuery {
  const signals = buildSignals(query, mission, ecosystemYield);
  return {
    query: query.query,
    mission,
    strategy: query.strategy,
    priorityScore: query.priorityScore,
    budgetScore: computeBudgetScore(signals),
    budgetRank: 0,
    signals,
    funded: false,
  };
}

/** Re-export for callers that only need the allocation view. */
export { allocateBudget };
export type { MissionAllocation };
