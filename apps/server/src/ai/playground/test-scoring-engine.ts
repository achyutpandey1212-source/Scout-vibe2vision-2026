import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { OpportunityModel } from '../../discovery';
import { scoreOpportunity } from '../../intelligence/scoring';

async function runScoringPlayground() {
  console.log('🏁 Starting Trust & Quality Scoring Engine Playground...\n');

  // Connect database and cache
  await db.connect();
  redis.connect();

  try {
    // 1. Fetch opportunities
    const opportunities = await OpportunityModel.find().limit(10);

    if (opportunities.length === 0) {
      console.warn(
        '⚠️ No opportunity records found in the database. Please run the Stage 1 enrichment playground first to populate enriched opportunities.',
      );
      return;
    }

    console.log(
      `📂 Loaded ${opportunities.length} Opportunity records from MongoDB for evaluation.\n`,
    );

    let totalLatencyMs = 0;

    for (const doc of opportunities) {
      const opportunity = doc.toObject();

      const startTime = Date.now();
      const scoredOpp = scoreOpportunity(opportunity);
      const latency = Date.now() - startTime;
      totalLatencyMs += latency;

      const scores = scoredOpp.intelligence?.scores;
      const breakdown = scoredOpp.intelligence?.scoreBreakdown;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Opportunity: "${opportunity.title}"`);
      console.log(
        `Organization: ${opportunity.organization} | Source Type: ${opportunity.sourceType}`,
      );
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Trust Score:       ${scores?.trust}/100`);
      console.log('  Factors:', JSON.stringify(breakdown?.trustFactors));
      console.log(`Popularity Score:  ${scores?.popularity}/100`);
      console.log('  Factors:', JSON.stringify(breakdown?.popularityFactors));
      console.log(`Hidden Score:      ${scores?.hidden}/100`);
      console.log('  Factors:', JSON.stringify(breakdown?.hiddenFactors));
      console.log(`Quality Score:     ${scores?.quality}/100`);
      console.log('  Factors:', JSON.stringify(breakdown?.qualityFactors));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Save back to DB
      await OpportunityModel.findByIdAndUpdate(doc._id, { $set: scoredOpp });
    }

    const avgRuntime = (totalLatencyMs / opportunities.length).toFixed(2);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Opportunity Scoring Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Scored:      ${opportunities.length}`);
    console.log(`Average Runtime:   ${avgRuntime}ms/opportunity`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Playground execution failed:', errMsg);
  } finally {
    console.log('🔌 Disconnecting database and cache connections...');
    await db.disconnect();
    await redis.disconnect();
    console.log('👋 Done.');
  }
}

runScoringPlayground().catch((err: unknown) => {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error('Fatal playground error:', errMsg);
  db.disconnect().catch(() => {});
  redis.disconnect().catch(() => {});
});
