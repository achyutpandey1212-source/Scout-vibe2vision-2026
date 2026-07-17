import { generateSearchQueries, searchOpportunities, extractCandidatePages } from '../../discovery';
import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { CANONICAL_TARGET_AUDIENCE, ACTIVE_SOURCE_CATEGORIES } from '@scout/shared';

async function runExtractionPlayground() {
  console.log(
    '🏁 Starting E2E Scraper Playground (Query Planner + Search Orchestrator + Firecrawl Extractor)...\n',
  );

  await db.connect();
  redis.connect();

  const context = {
    categories: ACTIVE_SOURCE_CATEGORIES,
    targetAudience: CANONICAL_TARGET_AUDIENCE,
    country: 'India',
    maxQueries: 3,
  };

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
    console.log(`✅ Search complete. Accepted candidates: ${searchResponse.accepted.length}`);

    // 3. Stage 3: Firecrawl Extraction
    console.log('\n🔥 Stage 3: Running Firecrawl Extraction Layer...');
    const extractionResponse = await extractCandidatePages(searchResponse.accepted);

    const totalRuntime = ((Date.now() - totalStartTime) / 1000).toFixed(2);

    // 4. Print Extracted Pages
    console.log(
      `\n🏆 Scraped Page details (Extracted successfully: ${extractionResponse.extracted.length}):\n`,
    );
    extractionResponse.extracted.forEach((page, idx) => {
      console.log(`[${(idx + 1).toString().padStart(2, '0')}] URL:      ${page.url}`);
      console.log(`     Title:    ${page.title}`);
      console.log(`     Source:   ${page.source} (Needs Extraction: ${page.needsExtraction})`);
      console.log(`     Hash:     ${page.hash}`);
      console.log(`     Metadata: Description = ${page.metadata.description?.slice(0, 80)}...`);
      console.log(`     Markdown: ${page.markdown.slice(0, 200)}...\n`);
    });

    // 5. Final Statistics Summary
    console.log('\n=============================================');
    console.log(`Total Runtime:        ${totalRuntime}s`);
    console.log(
      `Total Pages Processed: ${extractionResponse.extracted.length + extractionResponse.failed.length}`,
    );
    console.log(`Successfully Crawled:  ${extractionResponse.extracted.length}`);
    console.log(`Failed Crawls:        ${extractionResponse.failed.length}`);
    console.log('=============================================');
  } catch (error: any) {
    console.error('\n❌ Playground execution failed:', error.message);
  } finally {
    // Crucial: Disconnect connections to allow clean script termination
    console.log('\n🔌 Disconnecting database and cache connections...');
    await db.disconnect();
    await redis.disconnect();
    console.log('👋 Done.');
  }
}

runExtractionPlayground().catch((err) => {
  console.error('Fatal playground error:', err);
  db.disconnect().catch(() => {});
  redis.disconnect().catch(() => {});
});
