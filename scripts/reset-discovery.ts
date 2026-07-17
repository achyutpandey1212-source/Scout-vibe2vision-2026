import { db } from '../apps/server/src/config/db';
import { OpportunityModel } from '../apps/server/src/discovery/extraction/models/opportunity.model';
import { DiscoveryRunModel } from '../apps/server/src/discovery/persistence/discovery-run.model';
import { RawPageModel } from '../apps/server/src/discovery/firecrawl/raw-page.model';
import { SourceRegistryModel } from '../apps/server/src/discovery/sources/source-registry.model';
import dotenv from 'dotenv';
import path from 'path';

// Load server environment
dotenv.config({ path: path.join(__dirname, '../apps/server/.env') });

async function run() {
  const args = process.argv.slice(2);
  const wipeAll = args.includes('--wipe-all');
  const keepRegistry = args.includes('--keep-registry');

  if (!wipeAll && !keepRegistry) {
    console.error('❌ Error: Please specify either --wipe-all or --keep-registry.');
    console.log('Usage:');
    console.log('  pnpm ts-node scripts/reset-discovery.ts --wipe-all');
    console.log('  pnpm ts-node scripts/reset-discovery.ts --keep-registry');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await db.connect();

  console.log('🧹 Safely clearing Discovery-related collections...');

  console.log('- Opportunities: clearing...');
  const oppResult = await OpportunityModel.deleteMany({});
  console.log(`  Deleted ${oppResult.deletedCount} Opportunities.`);

  console.log('- RawPages: clearing...');
  const rawPageResult = await RawPageModel.deleteMany({});
  console.log(`  Deleted ${rawPageResult.deletedCount} RawPages.`);

  console.log('- DiscoveryRuns: clearing...');
  const runResult = await DiscoveryRunModel.deleteMany({});
  console.log(`  Deleted ${runResult.deletedCount} DiscoveryRuns.`);

  if (wipeAll) {
    console.log('- SourceRegistry: clearing...');
    const sourceResult = await SourceRegistryModel.deleteMany({});
    console.log(`  Deleted ${sourceResult.deletedCount} SourceRegistry entries.`);
  } else {
    console.log('- SourceRegistry: keeping (skipped).');
  }

  console.log('Disconnecting from database...');
  await db.disconnect();
  console.log('✅ Discovery database reset completed successfully.');
}

run().catch((err) => {
  console.error('❌ Database reset failed:', err);
  process.exit(1);
});
