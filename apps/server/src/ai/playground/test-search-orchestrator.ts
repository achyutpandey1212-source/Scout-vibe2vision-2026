import { generateSearchQueries, searchOpportunities } from '../../discovery';
import { redis } from '../../config/redis';

async function runSearchPlayground() {
  console.log('🏁 Starting E2E Query Planner + Search Orchestrator Playground test...\n');

  // Initialize Redis connection
  redis.connect();

  const context = {
    categories: ['Jobs', 'Scholarships', 'Grants', 'Fellowships', 'Freelance', 'Internships'],
    targetAudience: 'Women',
    country: 'India',
    maxQueries: 5, // Keep queries count small to save credits during testing
  };

  console.log('📥 Discovery Context:');
  console.log(JSON.stringify(context, null, 2));

  try {
    const totalStartTime = Date.now();

    // 1. Stage 1: Generate Queries
    console.log('\n🧠 Stage 1: Generating Search Queries...');
    const plannerResponse = await generateSearchQueries(context);
    console.log(`✅ Generated ${plannerResponse.queries.length} queries:`);
    plannerResponse.queries.forEach((q, idx) => console.log(`   - [${idx + 1}] ${q}`));

    // 2. Stage 2: Orchestrate Search
    console.log('\n🔍 Stage 2: Running Search Orchestrator...');
    const searchResponse = await searchOpportunities(plannerResponse);

    const totalExecutionTime = ((Date.now() - totalStartTime) / 1000).toFixed(2);

    // 3. Print Top Ranked Accepted Candidates
    console.log(
      `\n🏆 Top Ranked Candidates (Accepted count: ${searchResponse.accepted.length}):\n`,
    );
    searchResponse.accepted.slice(0, 15).forEach((item, idx) => {
      console.log(`[${(idx + 1).toString().padStart(2, '0')}] Title:   ${item.title}`);
      console.log(`     URL:     ${item.url}`);
      console.log(
        `     Score:   ${item.score} (Trust: ${item.scoreBreakdown.trust}, Keyword: ${item.scoreBreakdown.keyword}, Freshness: ${item.scoreBreakdown.freshness}, Quality: ${item.scoreBreakdown.urlQuality})`,
      );
      console.log(`     Query:   "${item.queryUsed}"`);
      console.log(`     Rank:    Tavily Rank #${item.searchRank}`);
      console.log(`     Snippet: ${item.snippet.slice(0, 120)}...\n`);
    });

    // 4. Print Sample Rejected Candidates (for heuristic tuning)
    if (searchResponse.rejected.length > 0) {
      console.log(
        `\n🚫 Sample Rejected Candidates (Total Rejected count: ${searchResponse.rejected.length}):\n`,
      );
      searchResponse.rejected.slice(0, 5).forEach((item, idx) => {
        console.log(`   - URL:    ${item.url}`);
        console.log(`     Reason: [${item.rejectionReason}] (Query Used: "${item.queryUsed}")`);
      });
    }

    console.log(`\n⚡ Total Execution Time: ${totalExecutionTime}s`);
  } catch (error: any) {
    console.error('\n❌ Test execution failed:', error.message);
  } finally {
    // Crucial: Disconnect from Redis so process terminates cleanly
    console.log('\n🔌 Disconnecting from Redis...');
    await redis.disconnect();
    console.log('👋 Done.');
  }
}

runSearchPlayground().catch((err) => {
  console.error('Fatal playground error:', err);
  redis.disconnect().catch(() => {});
});
