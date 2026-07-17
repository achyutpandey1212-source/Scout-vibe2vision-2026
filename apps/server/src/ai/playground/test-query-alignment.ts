import { generateSearchQueries } from '../../discovery/query-planner/query-planner';

async function verifyQueryPlanner() {
  console.log('=== VERIFYING QUERY PLANNER ALIGNMENT ===\n');

  // Test Case 1: INTERNSHIPS
  console.log('Category: [INTERNSHIPS]');
  const internsRes = await generateSearchQueries({
    categories: ['INTERNSHIPS'],
    maxQueries: 10,
    targetAudience: 'students',
    country: 'India',
  });
  console.log('Generated queries:', internsRes.queries);
  console.log('-----------------------------------------\n');

  // Test Case 2: STARTUP_INTERNSHIPS
  console.log('Category: [STARTUP_INTERNSHIPS]');
  const startupRes = await generateSearchQueries({
    categories: ['STARTUP_INTERNSHIPS'],
    maxQueries: 10,
    targetAudience: 'students',
    country: 'India',
  });
  console.log('Generated queries:', startupRes.queries);
  console.log('-----------------------------------------\n');

  // Test Case 3: GOVERNMENT_INTERNSHIP
  console.log('Category: [GOVERNMENT_INTERNSHIP]');
  const govRes = await generateSearchQueries({
    categories: ['GOVERNMENT_INTERNSHIP'],
    maxQueries: 10,
    targetAudience: 'students',
    country: 'India',
  });
  console.log('Generated queries:', govRes.queries);
  console.log('-----------------------------------------\n');
}

verifyQueryPlanner().then(() => console.log('👋 Verified.'));
