import { generateSearchQueries } from '../../discovery';

async function runPlayground() {
  console.log('🏁 Starting Query Planner Playground test...\n');

  const context = {
    categories: ['Jobs', 'Scholarships', 'Grants', 'Fellowships', 'Freelance', 'Internships'],
    targetAudience: 'Women',
    country: 'India',
    maxQueries: 25,
  };

  console.log('📥 Discovery Context:');
  console.log(JSON.stringify(context, null, 2));
  console.log('\n🧠 Generating Search Queries (calling AI Gateway)...');

  try {
    const startTime = Date.now();
    const result = await generateSearchQueries(context);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n🎉 Success! Generated ${result.queries.length} queries in ${duration}s:\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    result.queries.forEach((query, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. "${query}"`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Basic assertion checks
    const hasDuplicates = new Set(result.queries).size !== result.queries.length;
    console.log(`\n🔍 Quality Assertions:`);
    console.log(
      `- Duplicate Check: ${hasDuplicates ? '❌ FAILED' : '✅ PASSED (All queries are unique)'}`,
    );
    console.log(
      `- Budget Check: ${result.queries.length <= 25 ? '✅ PASSED' : '❌ FAILED'} (${result.queries.length}/25 queries)`,
    );
    console.log(
      `- Empty string Check: ${result.queries.some((q) => q === '') ? '❌ FAILED' : '✅ PASSED'}`,
    );
  } catch (error: any) {
    console.error('\n❌ Query Planner test failed:', error.message);
  }
}

runPlayground().catch((err) => {
  console.error('Fatal playground error:', err);
});
