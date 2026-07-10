import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { OpportunityModel } from '../../discovery';
import { enrichOpportunity } from '../../intelligence/enrichment';

async function runEnrichmentPlayground() {
  console.log('🏁 Starting Opportunity Enrichment Engine Playground...\n');

  // Connect database and cache
  await db.connect();
  redis.connect();

  try {
    // 1. Load opportunities from database
    const opportunities = await OpportunityModel.find().limit(10);

    if (opportunities.length === 0) {
      console.warn(
        '⚠️ No opportunity records found in the database. Please run the Stage 4 extraction playground first to populate opportunities.',
      );
      return;
    }

    console.log(
      `📂 Loaded ${opportunities.length} Opportunity records from MongoDB for enrichment.\n`,
    );

    let organizationNormalizedCount = 0;
    let deadlinesParsedCount = 0;
    let categoriesAssignedCount = 0;
    let metadataGeneratedCount = 0;
    let expiredOpportunitiesCount = 0;

    let totalLatencyMs = 0;

    for (const doc of opportunities) {
      const opportunity = doc.toObject();

      const startTime = Date.now();
      // Run deterministic enrichment
      // Reference date set to 2026-07-10 as per user metadata if we want relative testing,
      // or we can let it default to current system time. Let's use the current user's local date time.
      const enrichedOpp = enrichOpportunity(opportunity, '2026-07-10T12:35:50+05:30');
      const latency = Date.now() - startTime;
      totalLatencyMs += latency;

      // Track stats
      if (enrichedOpp.intelligence?.normalizedOrganization !== opportunity.organization) {
        organizationNormalizedCount++;
      }
      if (enrichedOpp.intelligence?.normalizedDeadline) {
        deadlinesParsedCount++;
      }
      if (enrichedOpp.category && enrichedOpp.category !== 'General') {
        categoriesAssignedCount++;
      }
      if (enrichedOpp.intelligence?.metadata) {
        metadataGeneratedCount++;
      }
      if (enrichedOpp.intelligence?.expired) {
        expiredOpportunitiesCount++;
      }

      // Print satisfying Before/After comparison
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Opportunity: "${opportunity.title}"`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Before\n');
      console.log(`  Organization:  ${opportunity.organization}`);
      console.log(`  Deadline:      ${opportunity.deadline}`);
      console.log(`  Category:      ${opportunity.category}`);
      console.log('\n------------------\n');
      console.log('After\n');
      console.log(`  Organization:   ${enrichedOpp.intelligence?.normalizedOrganization}`);
      console.log(`  Deadline:       ${enrichedOpp.intelligence?.normalizedDeadline}`);
      console.log(`  Days Remaining: ${enrichedOpp.intelligence?.daysRemaining}`);
      console.log(`  Expired:        ${enrichedOpp.intelligence?.expired}`);
      console.log(`  Category:       ${enrichedOpp.category}`);
      console.log(`  Source Type:    ${enrichedOpp.sourceType}`);
      console.log(`  Country:        ${enrichedOpp.intelligence?.metadata?.country}`);
      console.log(`  Is Remote:      ${enrichedOpp.intelligence?.metadata?.isRemote}`);
      console.log(`  Is Paid:        ${enrichedOpp.intelligence?.metadata?.isPaid}`);
      console.log(`  Requires Res:   ${enrichedOpp.intelligence?.metadata?.requiresResume}`);
      console.log(`  Requires Port:  ${enrichedOpp.intelligence?.metadata?.requiresPortfolio}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Update in database
      await OpportunityModel.findByIdAndUpdate(doc._id, { $set: enrichedOpp });
    }

    const avgRuntime = (totalLatencyMs / opportunities.length).toFixed(1);

    // 5. Final Statistics Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Opportunity Enrichment Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Loaded Opportunities:  ${opportunities.length}`);
    console.log(`Organization Normalized: ${organizationNormalizedCount}`);
    console.log(`Deadlines Parsed:      ${deadlinesParsedCount}`);
    console.log(`Categories Assigned:   ${categoriesAssignedCount}`);
    console.log(`Metadata Generated:    ${metadataGeneratedCount}`);
    console.log(`Expired Opportunities:  ${expiredOpportunitiesCount}`);
    console.log(`Average Runtime:        ${avgRuntime}ms/opportunity`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Playground execution failed:', errMsg);
  } finally {
    // Cleanly close database and cache connections
    console.log('🔌 Disconnecting database and cache connections...');
    await db.disconnect();
    await redis.disconnect();
    console.log('👋 Done.');
  }
}

runEnrichmentPlayground().catch((err: unknown) => {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error('Fatal playground error:', errMsg);
  db.disconnect().catch(() => {});
  redis.disconnect().catch(() => {});
});
