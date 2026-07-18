import { DiscoveryMission, SearchStrategy } from '../types/query.types';
import { MissionAllocation, BudgetValidation } from './budget.types';
import { allocateMissions } from './mission-budget';
import { applyStrategyAllocation } from './strategy-budget';

/**
 * Budget Allocator — top-level deterministic allocation.
 *
 * Given a requested search budget (e.g. 60), it:
 *   1. Splits the budget across missions (mission-budget).
 *   2. Splits each mission across its strategies (strategy-budget).
 *   3. Validates the result (percentages sum to 100, no overflow, no unused,
 *      no duplicates, budget equals requested).
 *
 * Everything scales proportionally with the requested budget. No hardcoded counts.
 */

export interface AllocatedBudget {
  totalBudget: number;
  missions: MissionAllocation[];
  validation: BudgetValidation;
}

/** Allocate the full budget across missions and strategies. */
export function allocateBudget(totalBudget: number): AllocatedBudget {
  const missions = applyStrategyAllocation(allocateMissions(totalBudget));
  const validation = validateAllocation(totalBudget, missions);
  return { totalBudget, missions, validation };
}

/**
 * Validate an allocation against the determinism invariants:
 *   - mission shares sum to 1 (100%)
 *   - total allocated equals requested budget (no unused, no overflow)
 *   - no strategy exceeds its computed budget
 *   - no duplicate allocations
 *   - no negative values
 */
export function validateAllocation(
  totalBudget: number,
  missions: MissionAllocation[],
): BudgetValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Mission shares sum to ~1.
  const missionShareSum = missions.reduce((s, m) => s + m.share, 0);
  const sharesOk = Math.abs(missionShareSum - 1) < 1e-9;
  if (!sharesOk) {
    errors.push(`Mission shares sum to ${missionShareSum.toFixed(4)} (expected 1).`);
  }

  // No negative values.
  for (const m of missions) {
    if (m.slots < 0) errors.push(`Mission ${m.mission} has negative slots.`);
    for (const s of m.strategies) {
      if (s.slots < 0) {
        errors.push(`Strategy ${s.strategy} in ${m.mission} has negative slots.`);
      }
    }
  }

  // Sum of mission slots equals requested budget.
  const allocated = missions.reduce((s, m) => s + m.slots, 0);
  const budgetMatches = allocated === totalBudget;
  if (!budgetMatches) {
    errors.push(`Allocated ${allocated} slots but requested budget is ${totalBudget}.`);
  }

  // Strategy totals per mission equal the mission's slots (no overflow / no unused).
  let noStrategyOverflow = true;
  for (const m of missions) {
    const stratTotal = m.strategies.reduce((s, x) => s + x.slots, 0);
    if (stratTotal !== m.slots) {
      noStrategyOverflow = false;
      errors.push(
        `Mission ${m.mission}: strategy slots sum to ${stratTotal} but mission has ${m.slots}.`,
      );
    }

    // No duplicate strategy allocations.
    const seen = new Set<SearchStrategy>();
    for (const s of m.strategies) {
      if (seen.has(s.strategy)) {
        errors.push(`Duplicate strategy ${s.strategy} in ${m.mission}.`);
      }
      seen.add(s.strategy);
    }
  }

  // No duplicate mission allocations.
  const missionSeen = new Set<DiscoveryMission>();
  for (const m of missions) {
    if (missionSeen.has(m.mission)) {
      errors.push(`Duplicate mission ${m.mission}.`);
    }
    missionSeen.add(m.mission);
  }

  // Warn on any unused budget (should never happen with largest-remainder).
  const noUnusedBudget = allocated === totalBudget;
  if (!noUnusedBudget && allocated < totalBudget) {
    warnings.push(`${totalBudget - allocated} unused budget slots.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missionShareSum,
    budgetMatches,
    noStrategyOverflow,
    noUnusedBudget,
    noDuplicates: errors.every((e) => !e.includes('Duplicate')),
  };
}

/** Resolve the slot count for a given mission + strategy from an allocation. */
export function slotsFor(
  allocation: AllocatedBudget,
  mission: DiscoveryMission,
  strategy: SearchStrategy,
): number {
  const m = allocation.missions.find((x) => x.mission === mission);
  if (!m) return 0;
  const s = m.strategies.find((x) => x.strategy === strategy);
  return s ? s.slots : 0;
}
