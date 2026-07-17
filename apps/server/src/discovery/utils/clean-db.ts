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
  SourceTier,
  EcosystemType,
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

interface SourceV2Metadata {
  sourceTier: SourceTier;
  ecosystemType: EcosystemType;
  discoveryValue: number;
  studentRelevance: number;
  freshnessScore: number;
  sourceReason: string;
}

function deriveV2Metadata(
  org: string,
  domain: string,
  defaultTags: string[],
  crawlFrequency: string,
): SourceV2Metadata {
  const orgLower = org.toLowerCase();
  const domainLower = domain.toLowerCase();
  const tagsStr = defaultTags.join(' ').toLowerCase();

  // Initialize defaults
  let sourceTier: SourceTier = 'B';
  let ecosystemType: EcosystemType = 'BIG_TECH';
  let discoveryValue = 50;
  let studentRelevance = 50;
  let freshnessScore = 50;
  let sourceReason = 'Official tech organization offering student pathways';

  // 1. Tier and Ecosystem Type Classification
  // Tier A: Ecosystems
  if (
    orgLower.includes('startup india') ||
    orgLower.includes('t-hub') ||
    orgLower.includes('nsrcel') ||
    orgLower.includes('ciie') ||
    orgLower.includes('kerala startup mission') ||
    orgLower.includes('y combinator') ||
    orgLower.includes('peak xv') ||
    orgLower.includes('accel') ||
    orgLower.includes('blume') ||
    orgLower.includes('antler') ||
    orgLower.includes('nexus') ||
    orgLower.includes('elevation') ||
    orgLower.includes('100x') ||
    domainLower.includes('yc') ||
    domainLower.includes('devfolio') ||
    domainLower.includes('unstop') ||
    domainLower.includes('wellfound') ||
    tagsStr.includes('incubator') ||
    tagsStr.includes('accelerator') ||
    tagsStr.includes('vc-portfolio')
  ) {
    sourceTier = 'A';
    discoveryValue = 95;
    studentRelevance = 90;

    if (
      orgLower.includes('incubator') ||
      orgLower.includes('t-hub') ||
      orgLower.includes('nsrcel') ||
      orgLower.includes('kerala startup mission') ||
      orgLower.includes('startup india')
    ) {
      ecosystemType = 'INCUBATOR';
      sourceReason = 'IIT/IIIT or national startup incubator ecosystem';
    } else if (
      orgLower.includes('y combinator') ||
      orgLower.includes('peak xv') ||
      orgLower.includes('accel') ||
      orgLower.includes('blume') ||
      orgLower.includes('antler') ||
      orgLower.includes('venture') ||
      orgLower.includes('capital')
    ) {
      ecosystemType = 'VC_PORTFOLIO';
      sourceReason = 'Top-tier startup VC portfolio ecosystem';
    } else if (
      domainLower.includes('devfolio') ||
      domainLower.includes('unstop') ||
      domainLower.includes('wellfound')
    ) {
      ecosystemType = 'STARTUP';
      sourceReason = 'Premier startup and hackathon ecosystem platform';
    } else {
      ecosystemType = 'STARTUP';
      sourceReason = 'High-potential startup hiring ecosystem';
    }
  }
  // Tier C: Aggregators
  else if (
    domainLower.includes('indeed') ||
    domainLower.includes('linkedin') ||
    domainLower.includes('internshala') ||
    domainLower.includes('naukri') ||
    domainLower.includes('glassdoor') ||
    domainLower.includes('monster')
  ) {
    sourceTier = 'C';
    ecosystemType = 'AGGREGATOR';
    discoveryValue = 25;
    studentRelevance = 70;
    sourceReason = 'General recruitment aggregator for discovery phase';
  }
  // Tier B: Direct Organizations (default)
  else {
    sourceTier = 'B';
    discoveryValue = 60;
    studentRelevance = 80;

    if (
      tagsStr.includes('government') ||
      tagsStr.includes('gov') ||
      domainLower.includes('.gov') ||
      domainLower.includes('.nic.in')
    ) {
      ecosystemType = 'GOVERNMENT';
      discoveryValue = 85;
      studentRelevance = 90;
      sourceReason = 'Official government body with student training and internships';
    } else if (
      tagsStr.includes('research') ||
      tagsStr.includes('scientific') ||
      orgLower.includes('cern') ||
      orgLower.includes('barc') ||
      orgLower.includes('csir') ||
      orgLower.includes('dst')
    ) {
      ecosystemType = 'RESEARCH';
      discoveryValue = 90;
      studentRelevance = 90;
      sourceReason = 'Academic research institution with recurring student projects';
    } else if (
      tagsStr.includes('university') ||
      domainLower.includes('.edu') ||
      domainLower.includes('.ac.in') ||
      orgLower.includes('iisc') ||
      orgLower.includes('iit') ||
      orgLower.includes('nit') ||
      orgLower.includes('iiit')
    ) {
      ecosystemType = 'UNIVERSITY';
      discoveryValue = 85;
      studentRelevance = 90;
      sourceReason = 'Premier engineering university/placement hub';
    } else if (
      tagsStr.includes('community') ||
      orgLower.includes('ieee') ||
      orgLower.includes('acm') ||
      orgLower.includes('gdg') ||
      orgLower.includes('gdsc') ||
      orgLower.includes('mozilla') ||
      orgLower.includes('linux foundation')
    ) {
      ecosystemType = 'COMMUNITY';
      discoveryValue = 80;
      studentRelevance = 90;
      sourceReason = 'Global developer community offering student pathways';
    } else if (
      tagsStr.includes('open-source') ||
      orgLower.includes('outreachy') ||
      orgLower.includes('kde')
    ) {
      ecosystemType = 'OPEN_SOURCE';
      discoveryValue = 85;
      studentRelevance = 95;
      sourceReason = 'Structured open-source mentorship program';
    } else if (
      tagsStr.includes('ngo') ||
      orgLower.includes('anitab') ||
      orgLower.includes('foundation')
    ) {
      ecosystemType = 'NON_PROFIT';
      discoveryValue = 75;
      studentRelevance = 85;
      sourceReason = 'Non-profit organization/foundation supporting tech diversity';
    } else {
      ecosystemType = 'BIG_TECH';
      sourceReason = 'Established technology company career board';
    }
  }

  // 2. Freshness Score calculation (based on crawl frequency)
  if (crawlFrequency === 'daily') {
    freshnessScore = 80;
  } else if (crawlFrequency === 'weekly') {
    freshnessScore = 60;
  } else {
    freshnessScore = 40;
  }

  return {
    sourceTier,
    ecosystemType,
    discoveryValue,
    studentRelevance,
    freshnessScore,
    sourceReason,
  };
}

function derivePriority(
  trustScore: number,
  discoveryValue: number,
  freshnessScore: number,
  studentRelevance: number,
): SourcePriority {
  const composite = trustScore + discoveryValue + freshnessScore + studentRelevance;
  if (composite >= 320) return 'critical';
  if (composite >= 260) return 'high';
  if (composite >= 180) return 'medium';
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
    const crawlFrequency =
      source.refreshFrequency === 'low'
        ? 'monthly'
        : source.refreshFrequency === 'medium'
          ? 'weekly'
          : 'daily';

    const category = inferCategoryFromTags(source.defaultTags);
    const v2Meta = deriveV2Metadata(
      source.organization,
      domain,
      source.defaultTags,
      crawlFrequency,
    );
    const priority = derivePriority(
      source.trustScore,
      v2Meta.discoveryValue,
      v2Meta.freshnessScore,
      v2Meta.studentRelevance,
    );

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
        // Source Intelligence V2 Metadata
        sourceTier: v2Meta.sourceTier,
        discoveryValue: v2Meta.discoveryValue,
        studentRelevance: v2Meta.studentRelevance,
        freshnessScore: v2Meta.freshnessScore,
        ecosystemType: v2Meta.ecosystemType,
        ecosystemName: null,
        startupStage: null,
        region: null,
        engineeringFocus: [],
        remoteFriendly: false,
        internshipFriendly: true,
        averageOpportunityQuality: null,
        averageHiddenGemScore: null,
        sourceReason: v2Meta.sourceReason,
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

      // Update Source Intelligence V2 Metadata
      existing.sourceTier = v2Meta.sourceTier;
      existing.discoveryValue = v2Meta.discoveryValue;
      existing.studentRelevance = v2Meta.studentRelevance;
      existing.freshnessScore = v2Meta.freshnessScore;
      existing.ecosystemType = v2Meta.ecosystemType;
      existing.sourceReason = v2Meta.sourceReason;

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
