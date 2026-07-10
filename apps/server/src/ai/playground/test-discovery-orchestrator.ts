import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { discoverOpportunities } from '../../discovery';

async function runDiscoveryOrchestratorPlayground() {
  console.log('🏁 Starting Discovery Orchestrator E2E pipeline test...\n');

  // Connect database and cache
  await db.connect();
  redis.connect();

  try {
    // RUN 1: Full E2E Discovery
    console.log('🚀 === RUN 1: Full End-to-End Pipeline Execution ===');
    const result1 = await discoverOpportunities({
      targetAudience: 'Women',
      country: 'India',
      categories: ['internships', 'scholarships'],
      maxQueries: 2, // Keep queries count low to conserve API credits during E2E verification
    });

    console.log('\nRun 1 Response Summary:');
    console.log(`Run ID:   ${result1.runId}`);
    console.log(`Metrics:`, JSON.stringify(result1.metrics, null, 2));
    console.log(`Failures: ${result1.failedItems.length}`);

    // RUN 2: Duplicate detection run
    console.log('\n🔄 === RUN 2: Verification of Deduplication (Duplicate Run) ===');
    console.log(
      'This execution should hit search query caches and mark existing records as unchanged.',
    );
    const result2 = await discoverOpportunities({
      targetAudience: 'Women',
      country: 'India',
      categories: ['internships', 'scholarships'],
      maxQueries: 2,
    });

    console.log('\nRun 2 Response Summary:');
    console.log(`Run ID:   ${result2.runId}`);
    console.log(`Metrics:`, JSON.stringify(result2.metrics, null, 2));
    console.log(`Failures: ${result2.failedItems.length}`);
  } catch (error: any) {
    console.error('\n❌ E2E Pipeline execution failed:', error.message);
  } finally {
    // Cleanly close database and cache connections
    console.log('\n🔌 Disconnecting database and cache connections...');
    await db.disconnect();
    await redis.disconnect();
    console.log('👋 Done.');
  }
}

runDiscoveryOrchestratorPlayground().catch((err) => {
  console.error('Fatal playground error:', err);
  db.disconnect().catch(() => {});
  redis.disconnect().catch(() => {});
});
