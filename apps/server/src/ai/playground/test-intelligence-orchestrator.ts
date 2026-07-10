import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { runOpportunityIntelligence } from '../../intelligence';

async function runOrchestratorPlayground() {
  console.log('🏁 Starting Opportunity Intelligence Orchestrator Playground...\n');

  // Connect database and cache
  await db.connect();
  redis.connect();

  try {
    // Run 1: Run with force=true to ensure everything gets processed/re-processed
    console.log('🚀 [Run 1] Running intelligence pipeline with force = true...');
    const result1 = await runOpportunityIntelligence({ force: true, batchSize: 50 });

    if (!result1.success) {
      console.error('❌ Run 1 failed with errors:', result1.errors);
    } else {
      console.log('✅ Run 1 finished successfully.');
    }

    // Run 2: Run with force=false to check if already processed items are correctly skipped
    console.log(
      '\n🚀 [Run 2] Running intelligence pipeline with force = false (skipping processed)...',
    );
    const result2 = await runOpportunityIntelligence({ force: false, batchSize: 50 });

    if (!result2.success) {
      console.error('❌ Run 2 failed with errors:', result2.errors);
    } else {
      console.log('✅ Run 2 finished successfully.');
      console.log(
        `ℹ️ Skip Validation: Loaded ${result2.metrics.loaded}, Skipped: ${result2.metrics.skipped}, Enriched: ${result2.metrics.enriched}`,
      );
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Playground execution failed:', errMsg);
  } finally {
    console.log('\n🔌 Disconnecting database and cache connections...');
    await db.disconnect();
    await redis.disconnect();
    console.log('👋 Done.');
  }
}

runOrchestratorPlayground().catch((err: unknown) => {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error('Fatal playground error:', errMsg);
  db.disconnect().catch(() => {});
  redis.disconnect().catch(() => {});
});
