import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { RawPageModel, extractOpportunityFromPage, OpportunityModel } from '../../discovery';

async function runOpportunityExtractionPlayground() {
  console.log('🏁 Starting Opportunity Extraction Playground test...\n');

  // Connect database and cache
  await db.connect();
  redis.connect();

  try {
    // 1. Fetch raw scraped pages from MongoDB
    const rawPages = await RawPageModel.find().limit(3);

    if (rawPages.length === 0) {
      console.warn(
        '⚠️ No raw crawled pages found in the database. Please run the Stage 3 scraper playground first to populate pages.',
      );
      return;
    }

    console.log(`📂 Loaded ${rawPages.length} RawPage records from MongoDB for AI extraction.\n`);

    let processedCount = 0;
    let successCount = 0;
    let validationFailures = 0;
    let totalLatencyMs = 0;
    let totalConfidence = 0;

    const totalStartTime = Date.now();

    for (const rawPage of rawPages) {
      processedCount++;
      const score = 14; // Mock original relevance score
      const query = 'scholarships women education india'; // Mock original query used

      try {
        const startTime = Date.now();
        // Extract Opportunity
        const opportunity = await extractOpportunityFromPage(rawPage, score, query);
        const latency = Date.now() - startTime;

        totalLatencyMs += latency;
        totalConfidence += opportunity.confidence;

        // Persist structured Opportunity object to database
        await OpportunityModel.findOneAndUpdate({ sourceURL: opportunity.sourceURL }, opportunity, {
          upsert: true,
          new: true,
        });
        successCount++;
      } catch (err: any) {
        validationFailures++;
        console.error(`❌ Extraction failed for page "${rawPage.title}":`, err.message);
      }
    }

    const totalRuntime = ((Date.now() - totalStartTime) / 1000).toFixed(2);
    const avgLatency =
      successCount > 0 ? (totalLatencyMs / successCount / 1000).toFixed(2) : '0.00';
    const avgConfidence = successCount > 0 ? (totalConfidence / successCount).toFixed(2) : '0.00';

    // 5. Final Statistics Summary
    console.log('\n=============================================');
    console.log('Opportunity Extraction Metrics Summary:');
    console.log(`Pages Processed:      ${processedCount}`);
    console.log(`Successful:           ${successCount}`);
    console.log(`Validation Failures:  ${validationFailures}`);
    console.log(`Saved Opportunity:    ${successCount}`);
    console.log(`Average AI Latency:   ${avgLatency}s`);
    console.log(`Average Confidence:   ${avgConfidence}`);
    console.log(`Total Runtime:        ${totalRuntime}s`);
    console.log('=============================================');
  } catch (error: any) {
    console.error('\n❌ Playground execution failed:', error.message);
  } finally {
    // Cleanly close database and cache connections
    console.log('\n🔌 Disconnecting database and cache connections...');
    await db.disconnect();
    await redis.disconnect();
    console.log('👋 Done.');
  }
}

runOpportunityExtractionPlayground().catch((err) => {
  console.error('Fatal playground error:', err);
  db.disconnect().catch(() => {});
  redis.disconnect().catch(() => {});
});
