import { db } from '../../config/db';
import { OpportunityModel } from '../extraction/models/opportunity.model';
import { DiscoveryRunModel } from '../persistence/discovery-run.model';
import { SourceRegistryModel } from '../sources/source-registry.model';
import { TRUSTED_SOURCES } from '../sources/registry';
import {
  SourceType,
  CrawlFrequency,
  SourcePriority,
  CrawlStrategy,
} from '../sources/source-registry.types';
import { SourceCategory, CATEGORY_REGISTRY } from '@scout/shared';

// Helper to extract domain from homepage
function extractDomain(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return urlStr.toLowerCase();
  }
}

// Category inference from tags targeting active categories in V2
function inferCategoryFromTags(tags: string[]): SourceCategory {
  const tagStr = tags.join(' ').toLowerCase();
  if (tagStr.includes('women-in-tech') || tagStr.includes('women-focused')) return 'WOMEN_IN_TECH';
  if (tagStr.includes('government') && tagStr.includes('internship'))
    return 'GOVERNMENT_INTERNSHIP';
  if (tagStr.includes('research') && tagStr.includes('internship')) return 'RESEARCH_INTERNSHIP';
  if (tagStr.includes('open-source') || tagStr.includes('open source'))
    return 'OPEN_SOURCE_PROGRAM';
  if (tagStr.includes('ambassador')) return 'CAMPUS_AMBASSADOR';
  if (tagStr.includes('bootcamp')) return 'BOOTCAMP';
  if (tagStr.includes('hackathon') || tagStr.includes('competition')) return 'HACKATHONS';
  if (tagStr.includes('scholarship')) return 'SCHOLARSHIPS';
  if (tagStr.includes('fellowship')) return 'FELLOWSHIPS';
  if (tagStr.includes('government') || tagStr.includes('gov')) return 'GOVERNMENT_INTERNSHIP';
  if (tagStr.includes('research') || tagStr.includes('scientific')) return 'RESEARCH_INTERNSHIP';
  if (tagStr.includes('technology') || tagStr.includes('tech')) return 'INTERNSHIPS';
  return 'INTERNSHIPS';
}

function derivePriorityFromTrustScore(score: number): SourcePriority {
  if (score >= 90) return 'critical';
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

async function run() {
  console.log('Connecting to database...');
  await db.connect();

  console.log('Clearing Opportunity documents...');
  const oppResult = await OpportunityModel.deleteMany({});
  console.log(`Deleted ${oppResult.deletedCount} Opportunity documents.`);

  console.log('Clearing DiscoveryRun documents...');
  const runResult = await DiscoveryRunModel.deleteMany({});
  console.log(`Deleted ${runResult.deletedCount} DiscoveryRun documents.`);

  console.log('Deactivating senior/mid-career/job-board sources...');
  const deactivateResult = await SourceRegistryModel.updateMany(
    {
      $or: [
        {
          defaultTags: {
            $in: [
              'senior',
              'experienced',
              'mid-level',
              'executive',
              'manager',
              'experienced-hiring',
            ],
          },
        },
        { sourceType: { $in: ['Job Board', 'Other'] } },
        { organization: { $regex: /indeed|naukri|monster|glassdoor|linkedin/i } },
      ],
    },
    { $set: { isActive: false } },
  );
  console.log(`Deactivated ${deactivateResult.modifiedCount} irrelevant sources.`);

  console.log('Deactivating sources associated with inactive categories...');
  const inactiveCategories = CATEGORY_REGISTRY.filter((c) => !c.isActive).map((c) => c.id);
  const inactiveCatsResult = await SourceRegistryModel.updateMany(
    { category: { $in: inactiveCategories } },
    { $set: { isActive: false } },
  );
  console.log(
    `Deactivated ${inactiveCatsResult.modifiedCount} sources in inactive categories: ${inactiveCategories.join(', ')}.`,
  );

  console.log(`Syncing ${TRUSTED_SOURCES.length} pre-vetted V2 sources in database...`);
  let inserted = 0;
  let updated = 0;

  for (const source of TRUSTED_SOURCES) {
    const domain = extractDomain(source.homepage);
    const priority = derivePriorityFromTrustScore(source.trustScore);
    const category = inferCategoryFromTags(source.defaultTags);
    const crawlFrequency =
      source.refreshFrequency === 'low'
        ? 'monthly'
        : source.refreshFrequency === 'medium'
          ? 'weekly'
          : 'daily';

    const existing = await SourceRegistryModel.findOne({ domain });
    if (!existing) {
      await SourceRegistryModel.create({
        domain,
        organization: source.organization,
        homepage: source.homepage,
        sourceType: 'Organization' as SourceType,
        crawlFrequency: crawlFrequency as CrawlFrequency,
        strategy: source.strategy as CrawlStrategy,
        trustScore: source.trustScore,
        priority,
        confidence: 95,
        reason: 'Pre-vetted V2 seed source',
        discoveredBy: 'seed',
        discoveredAt: new Date(),
        nextCrawlAt: new Date(),
        defaultTags: source.defaultTags,
        isActive: true,
        category,
        consecutiveFailures: 0,
        totalRuns: 0,
        totalPagesCrawled: 0,
        totalOpportunitiesFound: 0,
        opportunityDensity: 0,
        verifiedByAIAt: null,
        lastVerifiedAt: null,
        lastCrawledAt: null,
      });
      inserted++;
    } else {
      // Update fields to match V2 defaults
      existing.organization = source.organization;
      existing.homepage = source.homepage;
      existing.trustScore = source.trustScore;
      existing.priority = priority;
      existing.defaultTags = Array.from(new Set([...existing.defaultTags, ...source.defaultTags]));
      existing.category = category;
      existing.isActive = true; // Ensure active
      await existing.save();
      updated++;
    }
  }

  console.log(`Sources Synced: ${inserted} inserted, ${updated} updated.`);

  console.log('Disconnecting database...');
  await db.disconnect();
  console.log('Database cleanup and V2 transition completed successfully.');
}

run().catch((err) => {
  console.error('Database cleanup failed:', err);
  process.exit(1);
});
