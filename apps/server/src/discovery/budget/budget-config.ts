import { DiscoveryMission, SearchStrategy } from '../types/query.types';
import { BudgetConfiguration, StrategyWeight } from './budget.types';

/**
 * Deterministic Budget Configuration.
 *
 * This is the ONLY place where percentages, missions, and strategies are defined.
 * Adding a mission requires editing config only — no code changes anywhere else:
 *   1. Add a MissionWeight entry to `missions`.
 *   2. Add a StrategyWeight[] entry to `strategyWeights[mission]`.
 *
 * All weights are relative and normalized to 100% internally. No hardcoded counts.
 */

export const BUDGET_CONFIG: BudgetConfiguration = {
  // ─── Mission Budgets ──────────────────────────────────────────────────
  // Relative weights. Normalized so the active (enabled) missions sum to 100%.
  // Defaults: Engineering 40%, Startup 25%, Government 15%, Research 10%, Hackathons 10%.
  missions: [
    { mission: 'ENGINEERING_INTERNSHIPS', weight: 40, enabled: true },
    { mission: 'STARTUP_INTERNSHIPS', weight: 25, enabled: true },
    { mission: 'GOVERNMENT_TECH_INTERNSHIPS', weight: 15, enabled: true },
    { mission: 'RESEARCH_INTERNSHIPS', weight: 10, enabled: true },
    { mission: 'HACKATHONS', weight: 10, enabled: true },
  ],

  // ─── Strategy Budgets (per mission) ─────────────────────────────────
  // Relative weights normalized to 100% of that mission's slot count.
  strategyWeights: {
    ENGINEERING_INTERNSHIPS: [
      { strategy: 'ATS', weight: 35, enabled: true },
      { strategy: 'COMPANY', weight: 30, enabled: true },
      { strategy: 'LOCATION', weight: 15, enabled: true },
      { strategy: 'INTENT', weight: 10, enabled: true },
      { strategy: 'COMMUNITY', weight: 5, enabled: true },
      { strategy: 'ECOSYSTEM', weight: 5, enabled: true },
    ],
    STARTUP_INTERNSHIPS: [
      { strategy: 'ECOSYSTEM', weight: 40, enabled: true },
      { strategy: 'COMPANY', weight: 25, enabled: true },
      { strategy: 'ATS', weight: 15, enabled: true },
      { strategy: 'LOCATION', weight: 10, enabled: true },
      { strategy: 'INTENT', weight: 10, enabled: true },
    ],
    GOVERNMENT_TECH_INTERNSHIPS: [
      { strategy: 'OFFICIAL', weight: 40, enabled: true },
      { strategy: 'LOCATION', weight: 20, enabled: true },
      { strategy: 'COMPANY', weight: 15, enabled: true },
      { strategy: 'ATS', weight: 15, enabled: true },
      { strategy: 'INTENT', weight: 10, enabled: true },
    ],
    RESEARCH_INTERNSHIPS: [
      { strategy: 'ECOSYSTEM', weight: 45, enabled: true },
      { strategy: 'OFFICIAL', weight: 20, enabled: true },
      { strategy: 'LOCATION', weight: 15, enabled: true },
      { strategy: 'COMPANY', weight: 10, enabled: true },
      { strategy: 'INTENT', weight: 10, enabled: true },
    ],
    HACKATHONS: [
      { strategy: 'ECOSYSTEM', weight: 50, enabled: true },
      { strategy: 'COMMUNITY', weight: 20, enabled: true },
      { strategy: 'LOCATION', weight: 15, enabled: true },
      { strategy: 'INTENT', weight: 15, enabled: true },
    ],
  },

  // ─── Opportunity Yield Multipliers ───────────────────────────────────
  // Deterministic mapping of ecosystem opportunityYield → budget multiplier.
  yieldWeights: {
    VERY_HIGH: 1.0,
    HIGH: 0.8,
    MEDIUM: 0.55,
    LOW: 0.35,
  },

  // ─── Priority Multipliers ────────────────────────────────────────────
  // Key is the priority band (1 = highest). Lower priority → smaller multiplier.
  priorityWeights: {
    1: 1.0,
    2: 0.75,
    3: 0.5,
  },

  // ─── Minimum Guarantees (anti-starvation) ───────────────────────────
  minMissionGuarantee: 1,
  minStrategyGuarantee: 1,

  // ─── Budget Score Weights ────────────────────────────────────────────
  // Weighted deterministic formula. Each signal is normalized 0-1 then combined.
  scoreWeights: {
    queryPriority: 0.3,
    companyPriority: 0.2,
    ecosystemYield: 0.2,
    strategyPriority: 0.1,
    missionPriority: 0.1,
    cityPriority: 0.1,
  },
};

/** Convenience: list of all configurable strategy keys for validation. */
export const ALL_STRATEGIES: SearchStrategy[] = [
  'INTENT',
  'ECOSYSTEM',
  'LOCATION',
  'COMPANY',
  'ATS',
  'OFFICIAL',
  'COMMUNITY',
];

/** Look up a strategy weight config for a mission (undefined if absent). */
export function getStrategyWeights(mission: DiscoveryMission): StrategyWeight[] | undefined {
  return BUDGET_CONFIG.strategyWeights[mission];
}

/** Look up a mission weight config (undefined if absent). */
export function getMissionWeight(mission: DiscoveryMission) {
  return BUDGET_CONFIG.missions.find((m) => m.mission === mission);
}
