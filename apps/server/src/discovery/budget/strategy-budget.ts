import { DiscoveryMission, SearchStrategy } from '../types/query.types';
import { BUDGET_CONFIG, getStrategyWeights } from './budget-config';
import { MissionAllocation, StrategyAllocation, StrategyWeight } from './budget.types';
import { assignWithGuarantee } from './mission-budget';

/**
 * Strategy Budget — deterministic allocation of a mission's slots across its
 * search strategies. Each mission defines its own strategy weights in config;
 * they are normalized to 100% of that mission's slot count. No hardcoded counts.
 */

/** Active (enabled) strategy weights for a mission. */
export function getActiveStrategies(mission: DiscoveryMission): StrategyWeight[] {
  const weights = getStrategyWeights(mission) || [];
  return weights.filter((s) => s.enabled);
}

/**
 * Compute strategy-level shares (0-1) for a mission. Sums to exactly 1 across
 * the enabled strategies of that mission.
 */
export function computeStrategyShares(mission: DiscoveryMission): Record<SearchStrategy, number> {
  const active = getActiveStrategies(mission);
  const totalWeight = active.reduce((sum, s) => sum + Math.max(0, s.weight), 0);

  const shares = {} as Record<SearchStrategy, number>;
  if (totalWeight <= 0) {
    const even = active.length > 0 ? 1 / active.length : 0;
    for (const s of active) shares[s.strategy] = even;
    return shares;
  }

  for (const s of active) {
    shares[s.strategy] = Math.max(0, s.weight) / totalWeight;
  }
  return shares;
}

/**
 * Allocate a mission's `missionSlots` across its strategies.
 *
 * - Scales proportionally to the mission slot count (dynamic scaling).
 * - Minimum guarantee: every enabled strategy with share > 0 gets at least
 *   `minStrategyGuarantee` slots.
 * - Uses largest-remainder so strategy slots sum exactly to `missionSlots`.
 */
export function allocateStrategies(
  mission: DiscoveryMission,
  missionSlots: number,
): StrategyAllocation[] {
  const active = getActiveStrategies(mission);
  const shares = computeStrategyShares(mission);

  if (active.length === 0 || missionSlots <= 0) {
    return [];
  }

  const minGuarantee = BUDGET_CONFIG.minStrategyGuarantee;
  const slots = assignWithGuarantee(
    active.map((s) => ({ key: s.strategy, weight: shares[s.strategy] })),
    missionSlots,
    minGuarantee,
  );

  return active.map((s) => ({
    strategy: s.strategy,
    share: shares[s.strategy],
    slots: slots[s.strategy],
  }));
}

/**
 * Fill in the strategy allocations for every mission allocation in place and
 * return the enriched list.
 */
export function applyStrategyAllocation(missions: MissionAllocation[]): MissionAllocation[] {
  for (const m of missions) {
    m.strategies = allocateStrategies(m.mission, m.slots);
  }
  return missions;
}
