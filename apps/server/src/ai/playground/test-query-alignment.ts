import { generateSearchQueries } from '../../discovery/query-planner/query-planner';
import { CANONICAL_TARGET_AUDIENCE } from '@scout/shared';

async function verifyQueryPlanner() {
  console.log('=== VERIFYING QUERY PLANNER ALIGNMENT ===\n');

  console.log('Category: [INTERNSHIPS]');
  const internsRes = await generateSearchQueries({
    categories: ['INTERNSHIPS'],
    maxQueries: 10,
    targetAudience: CANONICAL_TARGET_AUDIENCE,
    country: 'India',
  });
  console.log('Generated queries:', internsRes.queries);
  console.log('-----------------------------------------\n');

  console.log('Category: [STARTUP_INTERNSHIPS]');
  const startupRes = await generateSearchQueries({
    categories: ['STARTUP_INTERNSHIPS'],
    maxQueries: 10,
    targetAudience: CANONICAL_TARGET_AUDIENCE,
    country: 'India',
  });
  console.log('Generated queries:', startupRes.queries);
  console.log('-----------------------------------------\n');

  console.log('Category: [GOVERNMENT_INTERNSHIP]');
  const govRes = await generateSearchQueries({
    categories: ['GOVERNMENT_INTERNSHIP'],
    maxQueries: 10,
    targetAudience: CANONICAL_TARGET_AUDIENCE,
    country: 'India',
  });
  console.log('Generated queries:', govRes.queries);
  console.log('-----------------------------------------\n');
}

verifyQueryPlanner().then(() => console.log('👋 Verified.'));
