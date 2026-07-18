import { DiscoveryMission, SearchStrategy } from '../types/query.types';
import { OpportunityYield, Priority } from '../ecosystem-intelligence/ecosystem.types';

/**
 * Deterministic Budget Allocation Engine — types.
 *
 * No LLM, no AI, no randomness. Every percentage, mission, and strategy lives
 * in configuration (budget-config.ts). The engine only computes deterministic
 * allocations and ranks from metadata already available on planned queries.
 */

/** A single mission weight entry in configuration. Weights are normalized to 100%. */
export interface MissionWeight {
  mission: DiscoveryMission;
  /** Relative weight (any positive number; normalized internally). */
  weight: number;
  /** When false the mission is excluded from allocation. */
  enabled: boolean;
}

/** A single strategy weight entry for one mission. */
export interface StrategyWeight {
  strategy: SearchStrategy;
  /** Relative weight (any positive number; normalized internally). */
  weight: number;
  /** When false the strategy is excluded from this mission's allocation. */
  enabled: boolean;
}

/** Full configurable strategy-weight map keyed by mission. */
export type StrategyWeightsByMission = Partial<Record<DiscoveryMission, StrategyWeight[]>>;

/** Top-level budget configuration. Adding a mission/strategy is config-only. */
export interface BudgetConfiguration {
  /** Mission weights. Sum is normalized to 100%. */
  missions: MissionWeight[];
  /** Per-mission strategy weights. */
  strategyWeights: StrategyWeightsByMission;
  /** Opportunity-yield multiplier map (deterministic, configurable). */
  yieldWeights: Record<OpportunityYield, number>;
  /** Priority multiplier map (1 = highest, 3 = lowest). */
  priorityWeights: Record<number, number>;
  /** Minimum guaranteed slots per enabled mission (>=1 when allocation > 0). */
  minMissionGuarantee: number;
  /** Minimum guaranteed slots per enabled strategy (>=1 when allocation > 0). */
  minStrategyGuarantee: number;
  /**
   * Weighted formula weights for the budget score.
   * budgetScore = Σ(weight_i * normalizedSignal_i), clamped to 0-100.
   */
  scoreWeights: {
    queryPriority: number;
    companyPriority: number;
    ecosystemYield: number;
    strategyPriority: number;
    missionPriority: number;
    cityPriority: number;
  };
}

/** One mission's computed allocation. */
export interface MissionAllocation {
  mission: DiscoveryMission;
  /** Normalized 0-1 share of the total search budget. */
  share: number;
  /** Absolute slot count after scaling to the requested budget. */
  slots: number;
  /** Strategy-level allocations within this mission. */
  strategies: StrategyAllocation[];
}

/** One strategy's computed allocation within a mission. */
export interface StrategyAllocation {
  strategy: SearchStrategy;
  /** Normalized 0-1 share of the mission's slot count. */
  share: number;
  /** Absolute slot count after scaling. */
  slots: number;
}

/** Per-query metadata used by the deterministic budget score. */
export interface BudgetScoreSignals {
  queryPriority: number;
  companyPriority: number;
  ecosystemYield: OpportunityYield;
  strategyPriority: number;
  missionPriority: Priority;
  cityPriority: number;
}

/** A planned query enriched with its deterministic budget rank. */
export interface BudgetRankedQuery {
  query: string;
  mission: DiscoveryMission;
  strategy: SearchStrategy;
  priorityScore: number;
  budgetScore: number;
  budgetRank: number;
  signals: BudgetScoreSignals;
  /** Whether this query survives the budget (gets a real slot). */
  funded: boolean;
}

/** Strategy-level rollup in the utilization report. */
export interface StrategyBudgetUsage {
  strategy: SearchStrategy;
  slots: number;
  averageRank: number;
  highestRank: number;
  lowestRank: number;
}

/** Mission-level rollup in the utilization report. */
export interface MissionBudgetUsage {
  mission: DiscoveryMission;
  totalBudget: number;
  allocated: number;
  unused: number;
  strategies: StrategyBudgetUsage[];
  averageRank: number;
  highestRank: number;
  lowestRank: number;
}

/** Full budget utilization report printed at end of planning. */
export interface BudgetUtilizationReport {
  totalBudget: number;
  allocated: number;
  unused: number;
  missions: MissionBudgetUsage[];
}

/** Validation result for a budget allocation. */
export interface BudgetValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  /** Sum of mission shares before rounding (should equal 1). */
  missionShareSum: number;
  /** Whether total allocated equals requested budget. */
  budgetMatches: boolean;
  /** Whether any strategy overran its computed budget. */
  noStrategyOverflow: boolean;
  /** Whether there is unused budget. */
  noUnusedBudget: boolean;
  /** Whether there are duplicate allocations. */
  noDuplicates: boolean;
}

/** Health report emitted by `npm run budget:health`. */
export interface BudgetHealth {
  configuredMissions: { mission: DiscoveryMission; weight: number; share: number }[];
  missionWeights: Record<string, number>;
  strategyWeights: StrategyWeightsByMission;
  budgetUsage: { totalBudget: number; allocated: number; unused: number };
  averageBudgetRank: number;
  distribution: Record<SearchStrategy, number>;
  top20: { query: string; budgetRank: number; mission: DiscoveryMission }[];
  lowest20: { query: string; budgetRank: number; mission: DiscoveryMission }[];
}
