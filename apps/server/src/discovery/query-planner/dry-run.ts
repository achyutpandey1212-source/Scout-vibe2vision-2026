import { generateSearchQueries } from './query-planner';
import { ACTIVE_SOURCE_CATEGORIES, CANONICAL_TARGET_AUDIENCE } from '@scout/shared';
import { DiscoveryMission } from '../types/query.types';

const MISSION = (process.argv[2] || 'ENGINEERING_INTERNSHIPS') as DiscoveryMission;

async function main() {
  const validMissions: DiscoveryMission[] = [
    'ENGINEERING_INTERNSHIPS',
    'STARTUP_INTERNSHIPS',
    'GOVERNMENT_TECH_INTERNSHIPS',
    'RESEARCH_INTERNSHIPS',
    'HACKATHONS',
  ];

  if (!validMissions.includes(MISSION)) {
    console.error(`Invalid mission: ${MISSION}`);
    console.error(`Valid missions: ${validMissions.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🧪 Planner Dry Run — Mission: ${MISSION}\n`);

  const plan = await generateSearchQueries({
    mission: MISSION,
    categories: ACTIVE_SOURCE_CATEGORIES,
    targetAudience: CANONICAL_TARGET_AUDIENCE,
    country: 'India',
    maxQueries: 25,
  });

  console.log(`\n📊 Statistics`);
  console.log(`  Total Generated    : ${plan.meta.totalGenerated}`);
  console.log(`  Duplicates Removed : ${plan.meta.duplicatesRemoved}`);
  console.log(`  Final Queries      : ${plan.meta.finalQueries}`);
  console.log(`  Average Priority   : ${plan.meta.averagePriority}`);
  console.log(`  Budget Utilization : ${plan.meta.budgetUtilization}%`);
  console.log(`  Mission Coverage   : ${plan.meta.missionCoverage}%`);

  console.log(`\n🗺️  Budget Allocation`);
  for (const [strategy, count] of Object.entries(plan.meta.strategiesUsed)) {
    if (count > 0) {
      console.log(`  ${strategy.padEnd(20)}: ${count}`);
    }
  }

  console.log(`\n🌍 Coverage`);
  console.log(`  Cities             : ${plan.meta.citiesCovered.join(', ') || 'N/A'}`);
  console.log(`  Engineering Domains: ${plan.meta.engineeringDomainsCovered.join(', ') || 'N/A'}`);
  console.log(`  ATS Providers      : ${plan.meta.atsProviders.join(', ') || 'N/A'}`);
  console.log(`  Ecosystems         : ${plan.meta.ecosystemsCovered.join(', ') || 'N/A'}`);

  console.log(`\n🔍 Top 10 Queries`);
  plan.plannedQueries.slice(0, 10).forEach((q, i) => {
    console.log(
      `  ${(i + 1).toString().padStart(2)}. [${q.priority.toUpperCase().padEnd(6)}] (${q.priorityScore}) ${q.query}`,
    );
    console.log(`      Purpose: ${q.purpose}`);
    console.log(`      Why   : ${q.explanation}`);
  });

  console.log(`\n✅ Dry run complete. No APIs called.\n`);
}

main().catch((err) => {
  console.error('Dry run failed:', err);
  process.exit(1);
});
