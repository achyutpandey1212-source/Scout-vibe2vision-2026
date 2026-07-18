/**
 * Budget Health CLI.
 *
 * Usage:
 *   npm run budget:health
 *
 * Generates planned queries for every configured mission via the Query Planner,
 * runs the deterministic Budget Allocation Engine over them, and prints the
 * budget health report (mission weights, strategy weights, budget usage,
 * average budget rank, distribution, top/lowest 20 queries).
 */
import { DiscoveryMission } from '../src/discovery/types/query.types';
import { generateSearchQueries } from '../src/discovery/query-planner/query-planner';
import { buildBudgetHealth, renderBudgetHealth } from '../src/discovery/budget/budget-health';
import { ACTIVE_SOURCE_CATEGORIES, CANONICAL_TARGET_AUDIENCE } from '@scout/shared';

async function main(): Promise<void> {
  const missions: DiscoveryMission[] = [
    'ENGINEERING_INTERNSHIPS',
    'STARTUP_INTERNSHIPS',
    'GOVERNMENT_TECH_INTERNSHIPS',
    'RESEARCH_INTERNSHIPS',
    'HACKATHONS',
  ];

  const queriesByMission: Partial<
    Record<DiscoveryMission, Awaited<ReturnType<typeof generateSearchQueries>>['plannedQueries']>
  > = {};

  for (const mission of missions) {
    const plan = await generateSearchQueries({
      categories: ACTIVE_SOURCE_CATEGORIES,
      targetAudience: CANONICAL_TARGET_AUDIENCE,
      country: 'India',
      mission,
      maxQueries: 60,
    });
    queriesByMission[mission] = plan.plannedQueries;
  }

  const health = buildBudgetHealth({ queriesByMission });
  console.log(renderBudgetHealth(health));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
