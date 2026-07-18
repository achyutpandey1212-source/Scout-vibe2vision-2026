import { DiscoveryMission } from '../types/query.types';
import { BudgetEngineResult } from './budget-engine';
import { BudgetUtilizationReport, MissionBudgetUsage, StrategyBudgetUsage } from './budget.types';

/**
 * Budget Utilization Report — deterministic end-of-planning report.
 *
 * Prints, per mission: total budget, allocated, unused, and a per-strategy
 * breakdown with average / highest / lowest budget rank.
 */

function strategyUsage(
  result: BudgetEngineResult,
  mission: DiscoveryMission,
  strategy: string,
  slots: number,
): StrategyBudgetUsage {
  const inStrategy = result.ranked.filter((q) => q.mission === mission && q.strategy === strategy);
  const ranks = inStrategy.map((q) => q.budgetScore);
  const avg = ranks.length > 0 ? Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length) : 0;
  return {
    strategy: strategy as StrategyBudgetUsage['strategy'],
    slots,
    averageRank: avg,
    highestRank: ranks.length > 0 ? Math.max(...ranks) : 0,
    lowestRank: ranks.length > 0 ? Math.min(...ranks) : 0,
  };
}

/** Build the structured utilization report from an engine result. */
export function buildUtilizationReport(
  result: BudgetEngineResult,
  totalBudget: number,
): BudgetUtilizationReport {
  const missions: MissionBudgetUsage[] = result.allocation.missions.map((m) => {
    const strategies: StrategyBudgetUsage[] = m.strategies.map((s) =>
      strategyUsage(result, m.mission, s.strategy, s.slots),
    );
    const allRanks = result.ranked.filter((q) => q.mission === m.mission).map((q) => q.budgetScore);
    const avg =
      allRanks.length > 0 ? Math.round(allRanks.reduce((a, b) => a + b, 0) / allRanks.length) : 0;
    return {
      mission: m.mission,
      totalBudget: m.slots,
      allocated: m.slots,
      unused: 0,
      strategies,
      averageRank: avg,
      highestRank: allRanks.length > 0 ? Math.max(...allRanks) : 0,
      lowestRank: allRanks.length > 0 ? Math.min(...allRanks) : 0,
    };
  });

  const allocated = missions.reduce((s, m) => s + m.allocated, 0);
  return {
    totalBudget,
    allocated,
    unused: Math.max(0, totalBudget - allocated),
    missions,
  };
}

/** Render the utilization report as the spec'd ASCII block. */
export function renderUtilizationReport(report: BudgetUtilizationReport): string {
  const sep = '=================================';
  const dashes = '---------------------------------';
  const lines: string[] = [];

  lines.push(sep);
  lines.push('Budget Allocation');
  lines.push(sep);
  lines.push(`Total Budget          : ${report.totalBudget}`);
  lines.push(`Allocated             : ${report.allocated}`);
  lines.push(`Unused                : ${report.unused}`);
  lines.push('');

  for (const m of report.missions) {
    lines.push('Mission');
    lines.push(m.mission);
    lines.push(`Total Budget          : ${m.totalBudget}`);
    lines.push(`Allocated             : ${m.allocated}`);
    lines.push(`Unused                : ${m.unused}`);
    lines.push(dashes);
    lines.push('Strategy');
    for (const s of m.strategies) {
      lines.push(`${s.strategy.padEnd(12)} : ${s.slots}`);
    }
    lines.push(dashes);
    lines.push(`Average Rank          : ${m.averageRank}`);
    lines.push(`Highest               : ${m.highestRank}`);
    lines.push(`Lowest                : ${m.lowestRank}`);
    lines.push('');
  }

  return lines.join('\n');
}

/** Format the funded budget queue (highest budget rank first). */
export function renderBudgetQueue(
  result: BudgetEngineResult,
  limit = Number.MAX_SAFE_INTEGER,
): string {
  const lines: string[] = [];
  lines.push('=================================');
  lines.push('Budget Queue (funded first)');
  lines.push('=================================');

  const funded = result.funded
    .slice()
    .sort((a, b) => b.budgetScore - a.budgetScore || a.query.localeCompare(b.query));

  funded.slice(0, limit).forEach((q, i) => {
    lines.push(`${i + 1}`);
    lines.push(`${q.query}`);
    lines.push(`${q.budgetScore}`);
    lines.push('');
  });

  return lines.join('\n');
}
