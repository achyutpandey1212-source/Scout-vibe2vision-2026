import { DiscoveryContext, QueryPlannerResponse } from '../types/query.types';
import { ACTIVE_SOURCE_CATEGORIES } from '@scout/shared';

function getCategoriesQueryPlannerBuckets(requestedCategories: string[]): string[] {
  return requestedCategories.filter((c) => ACTIVE_SOURCE_CATEGORIES.includes(c as any));
}

/**
 * Generates deterministic search queries to guarantee category distribution
 * and prevent AI drift.
 */
export async function generateSearchQueries(
  context: DiscoveryContext,
): Promise<QueryPlannerResponse> {
  const targetCountry = context.country || 'India';
  const limit = context.maxQueries || 50;

  // ─── Dimensions Setup ──────────────────────────────────────────────────
  const locations = [
    'Bangalore',
    'Bengaluru',
    'Gurugram',
    'Gurgaon',
    'Hyderabad',
    'Pune',
    'Noida',
    'Delhi NCR',
    'Chennai',
    'Mumbai',
    'Ahmedabad',
    'Coimbatore',
    'Kochi',
    'Remote',
  ];

  const startupDomains = [
    'AI',
    'SaaS',
    'Developer Tools',
    'Cybersecurity',
    'Cloud',
    'Fintech',
    'HealthTech',
    'EdTech',
    'ClimateTech',
    'Robotics',
    'Semiconductor',
    'IoT',
    'DeepTech',
    'Embedded Systems',
    'Frontend',
    'Backend',
  ];

  const generalDomains = [
    'Software Engineering',
    'Frontend',
    'Backend',
    'Full Stack',
    'Cloud',
    'DevOps',
    'Mobile Development',
    'Data Science',
    'SDE',
  ];

  const startupEcosystems = [
    'Startup India',
    'T-Hub',
    'NSRCEL',
    'Y Combinator',
    'Peak XV',
    'Accel',
    'Blume',
    'Antler',
    'IIT Incubator',
    'IIIT Incubator',
  ];

  const govAgencies = ['ISRO', 'DRDO', 'AICTE', 'MeitY', 'NIC', 'C-DAC', 'RBI', 'SEBI'];

  const researchInstitutions = ['IISc', 'CSIR', 'DST', 'CERN', 'Research Lab'];

  const hackathonPlatforms = ['Devfolio', 'MLH', 'Unstop', 'HackerEarth', 'HackerRank', 'Kaggle'];

  const openSourcePrograms = [
    'Google Summer of Code',
    'Outreachy',
    'LFX Mentorship',
    'Season of KDE',
  ];

  // Helper to pick a random item deterministically for variety
  const pickRandom = <T>(arr: T[], index: number): T => arr[index % arr.length];

  const queryBuckets: Record<string, string[]> = {
    STARTUP_INTERNSHIPS: [],
    INTERNSHIPS: [],
    GOVERNMENT_INTERNSHIP: [],
    RESEARCH_INTERNSHIP: [],
    HACKATHONS: [],
    OPEN_SOURCE_PROGRAM: [],
    CAMPUS_AMBASSADOR: [],
    WOMEN_IN_TECH: [],
  };

  // 1. Startup Internships (30%)
  for (let i = 0; i < 40; i++) {
    const loc = pickRandom(locations, i);
    const domain = pickRandom(startupDomains, i + 1);
    const eco = pickRandom(startupEcosystems, i + 2);
    queryBuckets.STARTUP_INTERNSHIPS.push(`${domain} startup internship ${loc}`.toLowerCase());
    queryBuckets.STARTUP_INTERNSHIPS.push(`${domain} intern ${eco}`.toLowerCase());
    queryBuckets.STARTUP_INTERNSHIPS.push(`founding engineer intern ${loc}`.toLowerCase());
    queryBuckets.STARTUP_INTERNSHIPS.push(
      `early stage startup ${domain} intern ${targetCountry}`.toLowerCase(),
    );
  }

  // 2. General Internships (20%)
  for (let i = 0; i < 30; i++) {
    const loc = pickRandom(locations, i);
    const domain = pickRandom(generalDomains, i + 1);
    queryBuckets.INTERNSHIPS.push(`${domain} internship ${loc}`.toLowerCase());
    queryBuckets.INTERNSHIPS.push(`${domain} developer intern ${targetCountry}`.toLowerCase());
    queryBuckets.INTERNSHIPS.push(`software engineering student internship ${loc}`.toLowerCase());
  }

  // 3. Government (15%)
  for (let i = 0; i < 20; i++) {
    const agency = pickRandom(govAgencies, i);
    queryBuckets.GOVERNMENT_INTERNSHIP.push(`${agency} student internship`.toLowerCase());
    queryBuckets.GOVERNMENT_INTERNSHIP.push(
      `${agency} technology training internship program`.toLowerCase(),
    );
    queryBuckets.GOVERNMENT_INTERNSHIP.push(
      `government student internship ${agency}`.toLowerCase(),
    );
  }

  // 4. Research (10%)
  for (let i = 0; i < 20; i++) {
    const inst = pickRandom(researchInstitutions, i);
    queryBuckets.RESEARCH_INTERNSHIP.push(`research internship ${inst}`.toLowerCase());
    queryBuckets.RESEARCH_INTERNSHIP.push(`summer research fellowship ${inst}`.toLowerCase());
    queryBuckets.RESEARCH_INTERNSHIP.push(
      `scientific student internship program ${inst}`.toLowerCase(),
    );
  }

  // 5. Hackathons (10%)
  for (let i = 0; i < 20; i++) {
    const plat = pickRandom(hackathonPlatforms, i);
    queryBuckets.HACKATHONS.push(`student coding hackathon ${plat}`.toLowerCase());
    queryBuckets.HACKATHONS.push(`national technology competition ${plat}`.toLowerCase());
    queryBuckets.HACKATHONS.push(`developer challenge registration ${plat}`.toLowerCase());
  }

  // 6. Open Source (5%)
  for (let i = 0; i < 15; i++) {
    const prog = pickRandom(openSourcePrograms, i);
    queryBuckets.OPEN_SOURCE_PROGRAM.push(`${prog} student projects application`.toLowerCase());
    queryBuckets.OPEN_SOURCE_PROGRAM.push(
      `open source student internship program ${prog}`.toLowerCase(),
    );
  }

  // 7. Campus Ambassador (5%)
  queryBuckets.CAMPUS_AMBASSADOR.push('campus ambassador student program');
  queryBuckets.CAMPUS_AMBASSADOR.push('github campus expert student representative');
  queryBuckets.CAMPUS_AMBASSADOR.push('student advocate ambassador internship');

  // 8. Women Programs (5%)
  queryBuckets.WOMEN_IN_TECH.push('women techmakers scholar program');
  queryBuckets.WOMEN_IN_TECH.push('outreachy internship open source women');
  queryBuckets.WOMEN_IN_TECH.push('adobe women in technology scholarship');
  queryBuckets.WOMEN_IN_TECH.push('grace hopper celebration student scholarship');
  queryBuckets.WOMEN_IN_TECH.push('microsoft women engineers program mentorship');

  // Deduplicate buckets
  Object.keys(queryBuckets).forEach((k) => {
    queryBuckets[k] = Array.from(new Set(queryBuckets[k]));
  });

  const defaultBudgetRatio: Record<string, number> = {
    STARTUP_INTERNSHIPS: 0.3,
    INTERNSHIPS: 0.2,
    GOVERNMENT_INTERNSHIP: 0.15,
    RESEARCH_INTERNSHIP: 0.1,
    HACKATHONS: 0.1,
    OPEN_SOURCE_PROGRAM: 0.05,
    CAMPUS_AMBASSADOR: 0.05,
    WOMEN_IN_TECH: 0.05,
  };

  const activeBuckets =
    context.categories && context.categories.length > 0
      ? getCategoriesQueryPlannerBuckets(context.categories)
      : [];

  const budgetRatio: Record<string, number> = {};
  if (activeBuckets.length > 0) {
    const sumActiveRatios = activeBuckets.reduce(
      (sum, b) => sum + (defaultBudgetRatio[b] || 0.1),
      0,
    );
    Object.keys(defaultBudgetRatio).forEach((b) => {
      if (activeBuckets.includes(b)) {
        budgetRatio[b] = (defaultBudgetRatio[b] || 0.1) / sumActiveRatios;
      } else {
        budgetRatio[b] = 0;
      }
    });
  } else {
    Object.assign(budgetRatio, defaultBudgetRatio);
  }

  const queries: string[] = [];
  Object.entries(budgetRatio).forEach(([bucketName, ratio]) => {
    if (ratio <= 0) return;
    const slotCount = Math.max(1, Math.round(limit * ratio));
    const bucketQueries = queryBuckets[bucketName] || [];
    queries.push(...bucketQueries.slice(0, slotCount));
  });

  const deduplicated = Array.from(new Set(queries)).slice(0, limit);

  console.log(
    `[Query Planner V2] Generated ${deduplicated.length} queries aligned with categories: ${context.categories?.join(', ') || 'ALL'}.`,
  );

  return {
    queries: deduplicated,
  };
}
