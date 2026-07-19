import { DiscoveryRunModel } from '../persistence/discovery-run.model';
import { RawPageModel } from '../firecrawl/raw-page.model';
import { DiscoveryContext } from '../types/query.types';
import { DiscoveryOptions, DiscoveryOrchestratorResponse, PipelineMetrics } from './pipeline.types';
import { TRUSTED_SOURCES } from '../sources/registry';
import { Stage1Discovery, CandidateURL } from '../stages/stage1';
import { Stage2Crawling, CrawledPage } from '../stages/stage2';
import { Stage3Extraction } from '../stages/stage3';
import { Stage4QualityAcceptance } from '../stages/stage4';
import { Stage5Persistence } from '../stages/stage5';
import { DashboardStateInstance } from '../utils/dashboard-state';
import { sourceRegistryService } from '../sources/source-registry.service';
import { CANONICAL_TARGET_AUDIENCE, VERSION_CONSTANTS } from '@scout/shared';
import crypto from 'crypto';

function extractDomain(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    return host;
  } catch {
    return null;
  }
}

/**
 * Immediately updates crawl metadata (markCrawled / markFailed) for each candidate domain.
 * Runs in a try/finally block so registry state updates immediately even if execution is interrupted.
 */
async function updateDomainCrawlStates(
  candidates: CandidateURL[],
  crawledPages: CrawledPage[],
  evaluatedOpps: any[],
): Promise<void> {
  const domainMap = new Map<string, { pages: CrawledPage[]; oppsCount: number }>();

  // 1. Map candidates by domain
  for (const c of candidates) {
    const dom = c.domain || extractDomain(c.url);
    if (!dom) continue;
    const cleanDom = dom.toLowerCase().trim();
    if (!domainMap.has(cleanDom)) {
      domainMap.set(cleanDom, { pages: [], oppsCount: 0 });
    }
  }

  // 2. Map crawled pages to domain
  for (const page of crawledPages) {
    const dom = extractDomain(page.url);
    if (!dom) continue;
    const cleanDom = dom.toLowerCase().trim();
    if (domainMap.has(cleanDom)) {
      domainMap.get(cleanDom)!.pages.push(page);
    } else {
      domainMap.set(cleanDom, { pages: [page], oppsCount: 0 });
    }
  }

  // 3. Map evaluated opportunities to domain
  for (const opp of evaluatedOpps) {
    const dom = extractDomain(opp.opportunityUrl || opp.sourceUrl || '');
    if (!dom) continue;
    const cleanDom = dom.toLowerCase().trim();
    if (domainMap.has(cleanDom)) {
      domainMap.get(cleanDom)!.oppsCount++;
    }
  }

  // 4. Update each domain in SourceRegistry immediately
  for (const [dom, data] of domainMap.entries()) {
    const hasSuccessfulPage = data.pages.some((p) => p.crawlStatus === 'SUCCESS');
    if (hasSuccessfulPage || data.pages.length > 0) {
      await sourceRegistryService.markCrawled(dom, {
        pagesCrawled: data.pages.length,
        opportunitiesFound: data.oppsCount,
      });
    } else {
      await sourceRegistryService.markFailed(dom);
    }
  }
}

/**
 * Persists raw crawled pages to MongoDB to maintain E2E database audits
 */
async function persistRawPagesCompatibility(crawledPages: CrawledPage[]): Promise<void> {
  for (const page of crawledPages) {
    if (page.crawlStatus === 'SUCCESS') {
      try {
        const hash = crypto.createHash('sha256').update(page.markdown).digest('hex');
        await RawPageModel.findOneAndUpdate(
          { url: page.url },
          {
            url: page.url,
            title: page.title,
            markdown: page.markdown,
            metadata: page.metadata,
            crawledAt: new Date(),
            hash,
          },
          { upsert: true, new: true },
        );
      } catch (dbErr: any) {
        console.error(
          `[DB Error] Failed to persist legacy RawPage for ${page.url}:`,
          dbErr.message,
        );
      }
    }
  }
}

/**
 * Discovery Orchestrator coordinating Pipeline Stages
 */
export async function discoverOpportunities(
  context: DiscoveryContext,
  options?: DiscoveryOptions,
): Promise<DiscoveryOrchestratorResponse> {
  const startedAt = new Date();
  const startTime = Date.now();

  // Initialize/Update Live Dashboard State
  DashboardStateInstance.updateState({
    isRunning: true,
    currentStage: 'STAGE_1_DISCOVERY',
    startedAt,
    urlsFound: 0,
    pagesCrawled: 0,
    detectorSkipped: 0,
    aiProcessed: 0,
    inserted: 0,
    updated: 0,
    archived: 0,
    failures: 0,
  });

  // 1. Execute Stage 1 (Modular Discovery)
  const stage1 = new Stage1Discovery();
  const candidates = await stage1.execute(context, options);
  DashboardStateInstance.updateState({ urlsFound: candidates.length });

  let crawledPages: CrawledPage[] = [];
  let evaluatedOpps: any[] = [];

  try {
    // 2. Execute Stage 2 (Modular Crawling)
    const stage2 = new Stage2Crawling();
    crawledPages = await stage2.execute(candidates, {
      maxExtractions: (options as any)?.maxExtractions || 15,
    });

    // DB Backwards compatibility raw page saves
    await persistRawPagesCompatibility(crawledPages);

    // 3. Execute Stage 3 (Modular AI Extraction)
    const stage3 = new Stage3Extraction();
    const extractions = await stage3.execute(crawledPages, options);

    // 4. Execute Stage 4 (Modular Quality & Acceptance)
    const stage4 = new Stage4QualityAcceptance();
    evaluatedOpps = await stage4.execute(extractions, options);
  } finally {
    // Task 1 & 2: Immediate per-domain crawl state persistence
    await updateDomainCrawlStates(candidates, crawledPages, evaluatedOpps);
  }

  const rejectedCount = evaluatedOpps.filter((o) => o.decision === 'REJECT').length;
  const reviewCount = evaluatedOpps.filter((o) => o.decision === 'REVIEW').length;

  // 5. Execute Stage 5 (Modular Persistence, Deduplication & Archiving)
  const stage5 = new Stage5Persistence();
  const runResult = await stage5.execute(evaluatedOpps, {
    startedAt,
    urlsFound: candidates.length,
    crawledPagesCount: crawledPages.length,
    crawledPages: crawledPages,
    detectorSkipped: DashboardStateInstance.getState().detectorSkipped,
    aiProcessed: DashboardStateInstance.getState().aiProcessed,
    geminiCalls: 0, // Injected metrics
    groqCalls: 0,
    cacheHits: crawledPages.filter((p) => p.fetchMethod === 'cache').length,
    MERGE_THRESHOLD: 95,
    REVIEW_THRESHOLD: 80,
  });

  const durationSec = runResult.durationMs / 1000;
  const durationMinutes = Math.floor(durationSec / 60);
  const durationRemainingSeconds = Math.round(durationSec % 60);
  const durationStr =
    durationMinutes > 0
      ? `${durationMinutes}m ${durationRemainingSeconds}s`
      : `${durationRemainingSeconds}s`;

  // ─── Phase 10: Expanded Discovery Metrics & Highlights ────────────────
  const metricsByEcosystem = new Map<string, number>();
  const metricsByOrgSize = new Map<string, number>();
  const metricsByLocation = new Map<string, number>();
  const metricsByDomain = new Map<string, number>();
  const metricsByHiddenGem = new Map<string, number>();
  const metricsBySuitability = new Map<string, number>();

  const acceptedOpps = evaluatedOpps.filter(
    (o) => o.decision === 'ACCEPT' || o.decision === 'REVIEW',
  );

  // Build lookups for domains to get SourceRegistry data quickly
  const domains = Array.from(
    new Set(
      acceptedOpps
        .map((o) =>
          o.sourceURL
            ? o.sourceURL
                .toLowerCase()
                .replace(/^https?:\/\/(www\.)?/, '')
                .split('/')[0]
            : '',
        )
        .filter(Boolean),
    ),
  );
  const { SourceRegistryModel } = await import('../sources/source-registry.model');
  const dbSources = await SourceRegistryModel.find({ domain: { $in: domains } }).lean();
  const sourceByDomain = new Map(dbSources.map((s) => [s.domain, s]));

  // Counters
  const ecosystemCounts: Record<string, number> = {};
  const orgSizeCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};
  const domainCounts: Record<string, number> = {};
  const hiddenGemCounts: Record<string, number> = { Excellent: 0, High: 0, Medium: 0, Low: 0 };
  const suitabilityCounts: Record<string, number> = {};

  const startupEcosystems: string[] = [];
  const universities: string[] = [];
  const governmentOrgs: string[] = [];
  const domainsList: string[] = [];
  const opportunityTypes: string[] = [];

  for (const opp of acceptedOpps) {
    // 1. Ecosystem
    const domain = opp.sourceURL
      ? opp.sourceURL
          .toLowerCase()
          .replace(/^https?:\/\/(www\.)?/, '')
          .split('/')[0]
      : '';
    const src = sourceByDomain.get(domain);
    const ecoType = src?.ecosystemType || 'UNIVERSITY';
    ecosystemCounts[ecoType] = (ecosystemCounts[ecoType] || 0) + 1;
    domainsList.push(opp.organization || 'Unknown');

    if (ecoType === 'STARTUP' || ecoType === 'INCUBATOR') {
      startupEcosystems.push(src?.organization || opp.organization || 'Startup');
    }
    if (ecoType === 'UNIVERSITY') {
      universities.push(src?.organization || opp.organization || 'University');
    }
    if (ecoType === 'GOVERNMENT') {
      governmentOrgs.push(src?.organization || opp.organization || 'Government');
    }

    let orgSize = 'SME';
    if (ecoType === 'STARTUP' || ecoType === 'INCUBATOR') {
      orgSize = 'Startup';
    } else if (opp.organizationType === 'MNC' || opp.organizationStage === 'ENTERPRISE') {
      orgSize = 'Large Company';
    } else if (ecoType === 'GOVERNMENT') {
      orgSize = 'Government';
    } else if (ecoType === 'UNIVERSITY') {
      orgSize = 'University';
    }
    orgSizeCounts[orgSize] = (orgSizeCounts[orgSize] || 0) + 1;

    // 3. Location
    const loc = opp.workMode === 'REMOTE' ? 'Remote' : opp.city || 'Other';
    const locKey =
      loc.toLowerCase().includes('bangalore') || loc.toLowerCase().includes('bengaluru')
        ? 'Bangalore'
        : loc.toLowerCase().includes('gurugram') || loc.toLowerCase().includes('gurgaon')
          ? 'Gurugram'
          : loc.toLowerCase().includes('hyderabad')
            ? 'Hyderabad'
            : loc.toLowerCase().includes('pune')
              ? 'Pune'
              : loc.toLowerCase().includes('noida') || loc.toLowerCase().includes('delhi')
                ? 'Delhi NCR'
                : loc.toLowerCase().includes('chennai')
                  ? 'Chennai'
                  : loc.toLowerCase().includes('mumbai')
                    ? 'Mumbai'
                    : loc.toLowerCase().includes('remote')
                      ? 'Remote'
                      : 'Other';
    locationCounts[locKey] = (locationCounts[locKey] || 0) + 1;

    // 4. Engineering Domain
    const titleLower = opp.title.toLowerCase();
    let engDomain = 'Backend';
    if (
      titleLower.includes('ai') ||
      titleLower.includes('ml') ||
      titleLower.includes('machine learning') ||
      titleLower.includes('deep learning') ||
      titleLower.includes('vision') ||
      titleLower.includes('nlp')
    ) {
      engDomain = 'AI';
    } else if (
      titleLower.includes('front') ||
      titleLower.includes('react') ||
      titleLower.includes('ui') ||
      titleLower.includes('web')
    ) {
      engDomain = 'Frontend';
    } else if (
      titleLower.includes('embed') ||
      titleLower.includes('iot') ||
      titleLower.includes('hardware') ||
      titleLower.includes('firmware')
    ) {
      engDomain = 'Embedded';
    } else if (
      titleLower.includes('cyber') ||
      titleLower.includes('security') ||
      titleLower.includes('pentest')
    ) {
      engDomain = 'Cybersecurity';
    } else if (
      titleLower.includes('cloud') ||
      titleLower.includes('aws') ||
      titleLower.includes('azure') ||
      titleLower.includes('gcp')
    ) {
      engDomain = 'Cloud';
    } else if (
      titleLower.includes('data') ||
      titleLower.includes('sql') ||
      titleLower.includes('analyst')
    ) {
      engDomain = 'Data';
    } else if (
      titleLower.includes('mobile') ||
      titleLower.includes('android') ||
      titleLower.includes('ios') ||
      titleLower.includes('flutter') ||
      titleLower.includes('react native')
    ) {
      engDomain = 'Mobile';
    } else if (
      titleLower.includes('devops') ||
      titleLower.includes('ci/cd') ||
      titleLower.includes('sre')
    ) {
      engDomain = 'DevOps';
    } else if (titleLower.includes('robot') || titleLower.includes('ros')) {
      engDomain = 'Robotics';
    } else if (
      titleLower.includes('semiconductor') ||
      titleLower.includes('vlsi') ||
      titleLower.includes('fpga')
    ) {
      engDomain = 'Semiconductor';
    }
    domainCounts[engDomain] = (domainCounts[engDomain] || 0) + 1;

    // 5. Hidden Gem
    const qScore = opp.qualityScore || 0;
    if (qScore >= 80) hiddenGemCounts.Excellent++;
    else if (qScore >= 70) hiddenGemCounts.High++;
    else if (qScore >= 60) hiddenGemCounts.Medium++;
    else hiddenGemCounts.Low++;

    // 6. Suitability
    const eligibilityLower = (opp.eligibility || '').toLowerCase();
    const suitabilities: string[] = [];
    if (eligibilityLower.includes('1st') || eligibilityLower.includes('first'))
      suitabilities.push('1st Year');
    if (eligibilityLower.includes('2nd') || eligibilityLower.includes('second'))
      suitabilities.push('2nd Year');
    if (eligibilityLower.includes('3rd') || eligibilityLower.includes('third'))
      suitabilities.push('3rd Year');
    if (
      eligibilityLower.includes('4th') ||
      eligibilityLower.includes('final') ||
      eligibilityLower.includes('fourth')
    )
      suitabilities.push('4th Year');
    if (
      eligibilityLower.includes('graduate') ||
      eligibilityLower.includes('passout') ||
      eligibilityLower.includes('alumni')
    )
      suitabilities.push('Fresh Graduate');

    if (suitabilities.length === 0) {
      suitabilities.push('3rd Year', '4th Year');
    }
    for (const suit of suitabilities) {
      suitabilityCounts[suit] = (suitabilityCounts[suit] || 0) + 1;
    }

    if (opp.category) {
      opportunityTypes.push(opp.category);
    }
  }

  Object.entries(ecosystemCounts).forEach(([k, v]) => metricsByEcosystem.set(k, v));
  Object.entries(orgSizeCounts).forEach(([k, v]) => metricsByOrgSize.set(k, v));
  Object.entries(locationCounts).forEach(([k, v]) => metricsByLocation.set(k, v));
  Object.entries(domainCounts).forEach(([k, v]) => metricsByDomain.set(k, v));
  Object.entries(hiddenGemCounts).forEach(([k, v]) => metricsByHiddenGem.set(k, v));
  Object.entries(suitabilityCounts).forEach(([k, v]) => metricsBySuitability.set(k, v));

  const getUniqueRatio = (counts: Record<string, number>, maxCategories: number) => {
    const keys = Object.keys(counts).filter((k) => counts[k] > 0);
    return Math.min(100, Math.round((keys.length / maxCategories) * 100)) || 0;
  };
  const searchDiversityScore =
    context.categories && context.categories.length > 0
      ? getUniqueRatio(Object.fromEntries(context.categories.map((c) => [c, 1])), 13)
      : 100;
  const sourceDiversityScore = getUniqueRatio(ecosystemCounts, 9);
  const opportunityDiversityScore = getUniqueRatio(
    Object.fromEntries(opportunityTypes.map((t) => [t, 1])),
    13,
  );
  const locationDiversityScore = getUniqueRatio(locationCounts, 8);
  const engineeringDiversityScore = getUniqueRatio(domainCounts, 16);
  const studentCoverageScore = getUniqueRatio(suitabilityCounts, 5);

  const getTopKeys = (counts: Record<string, number>, limit = 3): string[] => {
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([k]) => k);
  };
  const getTopRawList = (list: string[], limit = 3): string[] => {
    const counts: Record<string, number> = {};
    list.forEach((item) => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return getTopKeys(counts, limit);
  };

  const highlights = {
    topEcosystems: getTopKeys(ecosystemCounts, 3),
    topCities: getTopKeys(locationCounts, 3),
    topDomains: getTopRawList(domainsList, 3),
    topEngineeringFields: getTopKeys(domainCounts, 3),
    topOpportunityTypes: getTopRawList(opportunityTypes, 3),
    topStartupEcosystems: getTopRawList(startupEcosystems, 3),
    topUniversities: getTopRawList(universities, 3),
    topGovernmentOrganizations: getTopRawList(governmentOrgs, 3),
  };

  // Averages for V2 Opportunity Intelligence Audit
  const totalHiddenGem = acceptedOpps.reduce((sum, o) => sum + (o.hiddenGemScore || 0), 0);
  const avgHiddenGem =
    acceptedOpps.length > 0 ? Math.round(totalHiddenGem / acceptedOpps.length) : 0;

  const totalReadiness = acceptedOpps.reduce((sum, o) => sum + (o.readinessScore || 0), 0);
  const avgReadiness =
    acceptedOpps.length > 0 ? Math.round(totalReadiness / acceptedOpps.length) : 0;

  const diffCounts: Record<string, number> = {};
  acceptedOpps.forEach((o) => {
    const diff = o.difficulty || 'MEDIUM';
    diffCounts[diff] = (diffCounts[diff] || 0) + 1;
  });
  const avgDifficulty = getTopKeys(diffCounts, 1)[0] || 'MEDIUM';

  const skillCounts: Record<string, number> = {};
  acceptedOpps.forEach((o) => {
    const sList = o.skills || [];
    sList.forEach((sk: string) => {
      skillCounts[sk] = (skillCounts[sk] || 0) + 1;
    });
  });
  const topSkills = getTopKeys(skillCounts, 5);

  const topGemsList = acceptedOpps
    .sort((a, b) => (b.hiddenGemScore || 0) - (a.hiddenGemScore || 0))
    .slice(0, 3)
    .map((o) => `${o.title} (${o.organization}) - Gem: ${o.hiddenGemScore || 0}`);

  // ── Daily Discovery Success Metrics (PR5.6 - Part 8) ──
  const engineeringInternships = acceptedOpps.filter(
    (o) =>
      o.opportunityType === 'INTERNSHIP' &&
      (['engineer', 'developer', 'software', 'programmer', 'coder', 'sde', 'tech'].some((kw) =>
        o.title.toLowerCase().includes(kw),
      ) ||
        o.skills.length > 0),
  ).length;

  const startupInternships = acceptedOpps.filter(
    (o) =>
      o.opportunityType === 'INTERNSHIP' &&
      (o.sourceType === 'COMPANY' ||
        o.sourceURL.toLowerCase().includes('yc') ||
        o.sourceURL.toLowerCase().includes('wellfound')),
  ).length;

  const remoteInternships = acceptedOpps.filter(
    (o) => o.opportunityType === 'INTERNSHIP' && o.remote,
  ).length;

  const studentPrograms = acceptedOpps.filter((o) =>
    ['program', 'fellowship', 'scholarship', 'camp', 'academy'].some(
      (t) => o.title.toLowerCase().includes(t) || (o.opportunityType as string) === t.toUpperCase(),
    ),
  ).length;

  const portfolioBuildingOpps = acceptedOpps.filter(
    (o) =>
      (o.stipend !== null && o.stipend > 0) ||
      (o.benefits && o.benefits.toLowerCase().includes('portfolio')),
  ).length;

  const internshipRelevanceSum = acceptedOpps
    .filter((o) => o.opportunityType === 'INTERNSHIP')
    .reduce((sum, o) => sum + (o.qualityScore || 0), 0);
  const avgInternshipRelevance =
    acceptedOpps.filter((o) => o.opportunityType === 'INTERNSHIP').length > 0
      ? Math.round(
          internshipRelevanceSum /
            acceptedOpps.filter((o) => o.opportunityType === 'INTERNSHIP').length,
        )
      : 0;

  const targetCategoryList = context.categories || [];
  const matchedPurity = acceptedOpps.filter(
    (o) =>
      targetCategoryList.length === 0 ||
      targetCategoryList.some((tc) =>
        o.title.toLowerCase().includes(tc.toLowerCase().split('_')[0]),
      ),
  ).length;
  const categoryPurity =
    acceptedOpps.length > 0 ? Math.round((matchedPurity / acceptedOpps.length) * 100) : 100;

  console.log(`
========== Scout Discovery Report (V2) ==========
Sources Crawled:          ${TRUSTED_SOURCES.length}
Pages Discovered:        ${candidates.length}
Pages Fetched:           ${runResult.crawledPages}
Successful Extractions:  ${extractions.length}
New Opportunities:       ${runResult.inserted}
Updated Opportunities:   ${runResult.updated}
Duplicates Merged:       ${runResult.duplicatesMerged}
Archived Opportunities:   ${runResult.archived}
Rejected (Low Quality):   ${rejectedCount}
Average Quality Score:   ${runResult.averageQuality}
Duration:                ${durationStr}

─── Daily Discovery Success Metrics ───
Engineering Internships Found:  ${engineeringInternships}
Startup Internships Found:      ${startupInternships}
Remote Internships:             ${remoteInternships}
Student Programs:               ${studentPrograms}
Portfolio-Building Opps:        ${portfolioBuildingOpps}
Average Internship Relevance:   ${avgInternshipRelevance}%
Category Purity:                ${categoryPurity}%
False Positives (Rejected):     ${rejectedCount}

─── V2 Diversity Health Scores ───
Search Diversity Score:       ${searchDiversityScore}%
Source Diversity Score:       ${sourceDiversityScore}%
Opportunity Diversity Score:  ${opportunityDiversityScore}%
Location Diversity Score:     ${locationDiversityScore}%
Engineering Diversity Score:  ${engineeringDiversityScore}%
Student Coverage Score:       ${studentCoverageScore}%

─── V2 Highlights & Top Items ───
Top Ecosystems:          ${highlights.topEcosystems.join(', ') || 'N/A'}
Top Cities:              ${highlights.topCities.join(', ') || 'N/A'}
Top Domains:              ${highlights.topDomains.join(', ') || 'N/A'}
Top Engineering Fields:  ${highlights.topEngineeringFields.join(', ') || 'N/A'}
Top Opportunity Types:   ${highlights.topOpportunityTypes.join(', ') || 'N/A'}
Top Startup Ecosystems:  ${highlights.topStartupEcosystems.join(', ') || 'N/A'}
Top Universities:        ${highlights.topUniversities.join(', ') || 'N/A'}
Top Government Orgs:     ${highlights.topGovernmentOrganizations.join(', ') || 'N/A'}

─── V2 Opportunity Intelligence Audit ───
Average Difficulty:            ${avgDifficulty}
Average Hidden Gem Score:      ${avgHiddenGem}/100
Average Rec Readiness:         ${avgReadiness}/100
Most Common Domains:           ${highlights.topEngineeringFields.join(', ') || 'N/A'}
Most Common Skills:            ${topSkills.join(', ') || 'N/A'}
Most Common Locations:         ${highlights.topCities.join(', ') || 'N/A'}
Student Suitability Spread:    ${
    Object.entries(suitabilityCounts)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ') || 'N/A'
  }
Organization Types Spread:     ${
    Object.entries(orgSizeCounts)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ') || 'N/A'
  }
Top Hidden Gems:
  ${topGemsList.join('\n  ') || 'None'}
================================================`);

  // Log summary metrics details to DB
  let runId = 'mock_run_id';
  try {
    const runDoc = await DiscoveryRunModel.create({
      startedAt,
      finishedAt: runResult.finishedAt,
      targetAudience: CANONICAL_TARGET_AUDIENCE,
      categories: context.categories,
      totalQueries: TRUSTED_SOURCES.length,
      inserted: runResult.inserted,
      updated: runResult.duplicatesMerged,
      failures: rejectedCount,
      duration: durationSec,
      metricsByEcosystem,
      metricsByOrgSize,
      metricsByLocation,
      metricsByDomain,
      metricsByHiddenGem,
      metricsBySuitability,
      searchDiversityScore,
      sourceDiversityScore,
      opportunityDiversityScore,
      locationDiversityScore,
      engineeringDiversityScore,
      studentCoverageScore,
      highlights,
      missionVersion: VERSION_CONSTANTS.mission,
      categoryVersion: VERSION_CONSTANTS.category,
      schemaVersion: VERSION_CONSTANTS.schema,
      promptVersion: VERSION_CONSTANTS.prompt,
      registryVersion: VERSION_CONSTANTS.registry,
    });
    runId = runDoc._id.toString();
  } catch (runErr: any) {
    console.error('[Orchestrator] Failed logging run details:', runErr.message);
  }

  const metrics: PipelineMetrics = {
    queriesGenerated: TRUSTED_SOURCES.length,
    searchResults: candidates.length,
    acceptedCandidates: candidates.length,
    crawledPages: crawledPages.length,
    snippetBypasses: crawledPages.filter((p) => p.fetchMethod === 'snippet').length,
    extracted: extractions.length,
    inserted: runResult.inserted,
    updated: runResult.duplicatesMerged,
    unchanged: runResult.updated, // mapping unchanged count
    cacheHits: crawledPages.filter((p) => p.fetchMethod === 'cache').length,
    cacheMisses: crawledPages.filter((p) => p.fetchMethod === 'firecrawl').length,
    aiFailures: 0,
    crawlFailures: crawledPages.filter((p) => p.crawlStatus === 'FAILED').length,
    totalLatency: runResult.durationMs,
  };

  return {
    runId,
    metrics,
    failedItems: [],
  };
}
