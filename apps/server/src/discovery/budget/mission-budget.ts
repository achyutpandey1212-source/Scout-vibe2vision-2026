import { DiscoveryMission } from '../types/query.types';
import { BUDGET_CONFIG } from './budget-config';
import { MissionAllocation, MissionWeight } from './budget.types';

/**
 * Mission Budget — deterministic allocation of the total search budget across
 * missions. Weights are relative and normalized to 100% over the *enabled*
 * missions only. Adding a mission is a config-only change.
 */

/** Active (enabled) mission weights. */
export function getActiveMissions(): MissionWeight[] {
  return BUDGET_CONFIG.missions.filter((m) => m.enabled);
}

/**
 * Compute mission-level shares (0-1) for all enabled missions.
 * Returns a map keyed by mission. Always sums to exactly 1 across enabled missions.
 */
export function computeMissionShares(): Record<DiscoveryMission, number> {
  const active = getActiveMissions();
  const totalWeight = active.reduce((sum, m) => sum + Math.max(0, m.weight), 0);

  const shares = {} as Record<DiscoveryMission, number>;
  if (totalWeight <= 0) {
    // Degenerate fallback: split evenly across enabled missions.
    const even = active.length > 0 ? 1 / active.length : 0;
    for (const m of active) shares[m.mission] = even;
    return shares;
  }

  for (const m of active) {
    shares[m.mission] = Math.max(0, m.weight) / totalWeight;
  }
  return shares;
}

/**
 * Allocate the total budget across missions.
 *
 * - Scales all shares proportionally to `totalBudget` (no hardcoded counts).
 * - Applies the minimum guarantee: every enabled mission with share > 0 receives
 *   at least `minMissionGuarantee` slots.
 * - The remaining budget (after guarantees) is distributed by relative share.
 * - Fractional slots are rounded using largest-remainder so the total exactly
 *   equals `totalBudget` (no unused budget, no overflow).
 */
export function allocateMissions(totalBudget: number): MissionAllocation[] {
  const active = getActiveMissions();
  const shares = computeMissionShares();

  if (active.length === 0 || totalBudget <= 0) {
    return [];
  }

  const minGuarantee = BUDGET_CONFIG.minMissionGuarantee;
  const slots = assignWithGuarantee(
    active.map((m) => ({ key: m.mission, weight: shares[m.mission] })),
    totalBudget,
    minGuarantee,
  );

  return active.map((m) => ({
    mission: m.mission,
    share: shares[m.mission],
    slots: slots[m.mission],
    strategies: [],
  }));
}

/**
 * Distribute an integer `total` across items by `weight` with a minimum guarantee
 * per item, using the largest-remainder method so the parts sum exactly to `total`.
 */
export function assignWithGuarantee<T extends string>(
  items: { key: T; weight: number }[],
  total: number,
  minGuarantee: number,
): Record<T, number> {
  const result = {} as Record<T, number>;
  const eligible = items.filter((i) => i.weight > 0);

  if (eligible.length === 0) {
    return result;
  }

  // Reserve minimum guarantees first (capped so we never exceed total).
  const reserved = Math.min(total, eligible.length * minGuarantee);
  const remaining = total - reserved;

  const base = eligible.map((i) => ({ key: i.key, weight: i.weight, floor: minGuarantee }));
  const weightSum = eligible.reduce((s, i) => s + i.weight, 0) || 1;

  // Extra allocation proportional to weight over the remaining budget.
  for (const b of base) {
    const exact = (b.weight / weightSum) * remaining;
    b.floor += Math.floor(exact);
    (b as unknown as { remainder: number }).remainder = exact - Math.floor(exact);
  }

  const assigned = base.reduce((s, b) => s + b.floor, 0);
  let leftover = total - assigned;

  // Distribute leftover by largest remainder (deterministic, stable order).
  const sorted = [...base].sort(
    (a, b) =>
      (b as unknown as { remainder: number }).remainder -
      (a as unknown as { remainder: number }).remainder,
  );
  let idx = 0;
  while (leftover > 0 && sorted.length > 0) {
    sorted[idx % sorted.length].floor += 1;
    leftover -= 1;
    idx += 1;
  }

  for (const b of base) {
    result[b.key] = b.floor;
  }
  return result;
}
