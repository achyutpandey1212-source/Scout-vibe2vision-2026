import { redis } from '../../config/redis';
import { DISCOVERY_CONFIG } from '../config/discovery.config';
import { TavilyClient } from './tavily.client';
import {
  CandidateSearchResult,
  RejectedSearchResult,
  OrchestratorSearchResponse,
  ScoreBreakdown,
} from './search.types';
import { QueryPlannerResponse, CompanyDerivedUrl } from '../types/query.types';

const JUNK_KEYWORDS = [
  '/login',
  '/signin',
  '/signup',
  '/register',
  '/logout',
  '/privacy',
  '/terms',
  '/cookie',
  '/policy',
  '/legal',
  '/contact',
  '/about',
  '/help',
  '/support',
  '/faq',
  '/advertisement',
  '/ads',
  '/subscribe',
  '/newsletter',
  '/archive',
  '/tag/',
  '/category/',
  '/author/',
];

const HIGH_TRUST_DOMAINS = ['.gov.in', '.nic.in', '.ac.in', '.edu'];
const MEDIUM_TRUST_DOMAINS = [
  'unstop.com',
  'devfolio.co',
  'linkedin.com',
  'wellfound.com',
  'internshala.com',
  'indeed.com',
  'naukri.com',
  'foundit.in',
  'devpost.com',
];

const OPPORTUNITY_KEYWORDS = [
  'careers',
  'jobs',
  'internship',
  'fellowship',
  'scholarship',
  'apply',
  'recruitment',
  'opportunity',
  'grant',
  'apprenticeship',
  'competition',
  'admissions',
  'hiring',
  // Student-specific expansion (PR5.6 - Part 3)
  'students',
  'intern',
  'graduates',
  'campus',
  'early-careers',
  'early-career',
  'university',
  'research',
  'young-professionals',
  'new-grad',
  'newgrad',
  'bootcamp',
  'academy',
  'talent-program',
  'learning-program',
  'summer-internship',
  'winter-internship',
  'trainee',
  'apprentice',
  'fresher',
];

const FRESHNESS_KEYWORDS = ['2026', 'july', 'august', 'apply now', 'last date', 'deadline'];

/**
 * Normalizes URLs for accurate comparison and deduplication.
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const cleanUrl = rawUrl.split('#')[0]; // Remove hash anchors
    const parsed = new URL(cleanUrl);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }
    const params = new URLSearchParams(parsed.search);
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ref',
      'source',
      'gclid',
      'fbclid',
    ];
    for (const p of trackingParams) {
      params.delete(p);
    }

    // Also remove common tracking parameters dynamically (starts with utm_)
    const keysToDelete: string[] = [];
    params.forEach((value, key) => {
      if (
        key.toLowerCase().startsWith('utm_') ||
        key.toLowerCase() === 'ref' ||
        key.toLowerCase() === 'source'
      ) {
        keysToDelete.push(key);
      }
    });
    for (const k of keysToDelete) {
      params.delete(k);
    }

    let path = parsed.pathname.toLowerCase();
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1);
    }
    const cleanSearch = params.toString();
    return `${parsed.protocol}//${host}${path}${cleanSearch ? '?' + cleanSearch : ''}`;
  } catch {
    return rawUrl.trim().toLowerCase().split('#')[0].replace(/\/+$/, '');
  }
}

/**
 * Scans page details to determine if it is obvious junk.
 */
function checkJunk(
  url: string,
  title: string,
  snippet: string,
): { junk: boolean; reason?: string } {
  const normalizedUrl = url.toLowerCase();
  const normalizedTitle = title.toLowerCase();
  const normalizedSnippet = snippet.toLowerCase();

  for (const keyword of JUNK_KEYWORDS) {
    if (normalizedUrl.includes(keyword)) {
      return { junk: true, reason: `URL contains junk path: ${keyword}` };
    }
  }

  if (
    normalizedTitle.includes('login') ||
    normalizedTitle.includes('sign in') ||
    normalizedTitle.includes('sign up')
  ) {
    return { junk: true, reason: 'Title contains login/sign-in keywords' };
  }

  if (
    normalizedTitle.includes('privacy policy') ||
    normalizedTitle.includes('terms of service') ||
    normalizedTitle.includes('terms and conditions')
  ) {
    return { junk: true, reason: 'Title indicates privacy/terms page' };
  }

  if (
    normalizedUrl.includes('search?') ||
    normalizedUrl.includes('/search/') ||
    normalizedSnippet.includes('search results')
  ) {
    return { junk: true, reason: 'Indicates search results page' };
  }

  return { junk: false };
}

/**
 * Deterministically computes an opportunity relevance score.
 */
function calculateScore(
  url: string,
  title: string,
  snippet: string,
): { score: number; breakdown: ScoreBreakdown } {
  let trust = DISCOVERY_CONFIG.HEURISTICS.TRUST.LOW;
  let keyword = 0;
  let freshness = 0;
  let urlQuality = 0;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const urlPath = parsed.pathname.toLowerCase();
    const normalizedTitle = title.toLowerCase();
    const normalizedSnippet = snippet.toLowerCase();

    // 1. Domain Trust
    if (HIGH_TRUST_DOMAINS.some((domain) => hostname.endsWith(domain))) {
      trust = DISCOVERY_CONFIG.HEURISTICS.TRUST.HIGH;
    } else if (MEDIUM_TRUST_DOMAINS.some((domain) => hostname.includes(domain))) {
      trust = DISCOVERY_CONFIG.HEURISTICS.TRUST.MEDIUM;
    }

    // 2. Keyword Boost
    const hasOpportunityKeyword = OPPORTUNITY_KEYWORDS.some(
      (kw) =>
        urlPath.includes(kw) || normalizedTitle.includes(kw) || normalizedSnippet.includes(kw),
    );
    if (hasOpportunityKeyword) {
      keyword = DISCOVERY_CONFIG.HEURISTICS.KEYWORD_BOOST;
    }

    // 3. Freshness Boost
    const hasFreshnessKeyword = FRESHNESS_KEYWORDS.some(
      (kw) => normalizedTitle.includes(kw) || normalizedSnippet.includes(kw),
    );
    if (hasFreshnessKeyword) {
      freshness = DISCOVERY_CONFIG.HEURISTICS.FRESHNESS_BOOST;
    }

    // 4. URL Quality
    const pathSegments = urlPath.split('/').filter(Boolean);
    if (pathSegments.length >= 2) {
      urlQuality = DISCOVERY_CONFIG.HEURISTICS.URL_QUALITY_BOOST;
    }

    // ── Experienced-Hire Down-Ranking (PR5.6 - Part 2) ──
    const hasExperiencedKeyword = [
      'senior',
      'lead',
      'principal',
      'manager',
      'director',
      'architect',
      'experienced',
      '5+ years',
      'mba',
      'finance',
      'hr',
      'sales',
      'marketing',
      'faculty',
      'professor',
      'permanent position',
      'full-time experienced',
    ].some(
      (kw) =>
        urlPath.includes(kw) || normalizedTitle.includes(kw) || normalizedSnippet.includes(kw),
    );

    const hasStudentKeyword = [
      'intern',
      'student',
      'campus',
      'graduate program',
      'trainee',
      'apprentice',
      'early careers',
      'university recruiting',
      'fresher',
    ].some(
      (kw) =>
        urlPath.includes(kw) || normalizedTitle.includes(kw) || normalizedSnippet.includes(kw),
    );

    if (hasExperiencedKeyword && !hasStudentKeyword) {
      trust -= 60; // Pull down rank heavily
    }
  } catch {
    // Graceful fallback if URL parsing fails during score calculation
  }

  return {
    score: Math.max(0, trust + keyword + freshness + urlQuality),
    breakdown: { trust, keyword, freshness, urlQuality },
  };
}

/**
 * Search Orchestrator fetching candidate pages for given search queries.
 *
 * It merges three deterministic sources into a single execution plan:
 *   1. Mission queries (generic job search)
 *   2. Company-derived career URLs (Company Discovery Engine)
 *   3. Company-derived ATS + portfolio URLs
 * Nothing bypasses the planner.
 */
export async function searchOpportunities(
  plannerResponse: QueryPlannerResponse,
): Promise<OrchestratorSearchResponse> {
  const client = new TavilyClient();
  const redisClient = redis.getClient();

  const accepted: CandidateSearchResult[] = [];
  const rejected: RejectedSearchResult[] = [];
  const processedUrls = new Set<string>();

  let totalLatencyMs = 0;
  let totalSearches = 0;

  const queries = plannerResponse.queries.slice(0, DISCOVERY_CONFIG.MAX_SEARCH_QUERIES);

  // Process queries in concurrency chunks
  const chunkLimit = DISCOVERY_CONFIG.CONCURRENCY_LIMIT;

  // ── Merge Company Discovery Engine outputs into the execution plan ──
  // Company-derived career/ATS/portfolio URLs are injected as accepted
  // candidates (deterministic priority from the engine) so they are crawled
  // before/with generic search results. Never bypasses the planner.
  const companyDerived = (
    plannerResponse as QueryPlannerResponse & {
      companyDerivedUrls?: CompanyDerivedUrl[];
    }
  ).companyDerivedUrls;

  let companyMerged = 0;
  if (companyDerived && companyDerived.length > 0) {
    for (const cd of companyDerived) {
      const normalized = normalizeUrl(cd.url);
      if (processedUrls.has(normalized)) continue;
      processedUrls.add(normalized);
      let domain = '';
      try {
        domain = new URL(cd.url).hostname;
      } catch {
        domain = cd.url;
      }
      accepted.push({
        title: `${cd.type} — ${cd.company}`,
        url: cd.url,
        snippet: `Company-derived ${cd.type.toLowerCase()} target from ${cd.company}.`,
        domain,
        queryUsed: `company-discovery:${cd.type.toLowerCase()}`,
        score: Math.min(100, Math.max(0, cd.priority)),
        scoreBreakdown: { trust: 0, keyword: 0, freshness: 0, urlQuality: 0 },
        retrievedAt: new Date().toISOString(),
        source: 'company-discovery',
        searchRank: 0,
      });
      companyMerged++;
    }
  }

  if (companyMerged > 0) {
    console.log(`\n[Search Orchestrator] Merged ${companyMerged} company-derived URLs.`);
  }

  for (let i = 0; i < queries.length; i += chunkLimit) {
    const chunk = queries.slice(i, i + chunkLimit);

    const chunkPromises = chunk.map(async (query) => {
      const cacheKey = `search:${query}`;
      let searchResults: any[] = [];
      let latency = 0;

      try {
        // 1. Try Cache
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          searchResults = JSON.parse(cached);
        } else {
          // 2. Call Tavily
          const startTime = Date.now();
          const response = await client.search(
            query,
            DISCOVERY_CONFIG.MAX_TAVILY_RESULTS_PER_QUERY,
          );
          latency = Date.now() - startTime;
          searchResults = response.results;

          // 3. Cache results
          await redisClient.setex(
            cacheKey,
            DISCOVERY_CONFIG.CACHE_TTL_SECONDS,
            JSON.stringify(searchResults),
          );
        }
      } catch (error: any) {
        console.error(`[Search Orchestrator] Search failed for query "${query}":`, error.message);
        return { query, results: [], latency, error: true };
      }

      return { query, results: searchResults, latency, error: false };
    });

    const chunkResponses = await Promise.all(chunkPromises);

    // Process chunk responses
    for (const res of chunkResponses) {
      if (res.latency > 0) {
        totalLatencyMs += res.latency;
        totalSearches++;
      }

      let queryAcceptedCount = 0;
      let queryDiscardedCount = 0;

      console.log(`\nQuery: "${res.query}"`);

      for (let index = 0; index < res.results.length; index++) {
        const item = res.results[index];
        const rawUrl = item.url;
        const normalized = normalizeUrl(rawUrl);
        const domain = new URL(rawUrl).hostname;
        const retrievedAt = new Date().toISOString();

        // Check for duplicates
        if (processedUrls.has(normalized)) {
          rejected.push({
            title: item.title,
            url: rawUrl,
            snippet: item.content,
            domain,
            queryUsed: res.query,
            score: 0,
            scoreBreakdown: { trust: 0, keyword: 0, freshness: 0, urlQuality: 0 },
            retrievedAt,
            source: 'tavily',
            searchRank: index + 1,
            rejectionReason: 'Duplicate URL',
          });
          queryDiscardedCount++;
          continue;
        }

        processedUrls.add(normalized);

        // Check for Junk
        const junkCheck = checkJunk(rawUrl, item.title, item.content);
        const { score, breakdown } = calculateScore(rawUrl, item.title, item.content);

        const baseResult = {
          title: item.title,
          url: rawUrl,
          snippet: item.content,
          domain,
          queryUsed: res.query,
          score,
          scoreBreakdown: breakdown,
          retrievedAt,
          searchRank: index + 1,
        };

        if (junkCheck.junk) {
          rejected.push({
            ...baseResult,
            source: 'tavily',
            rejectionReason: junkCheck.reason || 'Junk filter triggered',
          });
          queryDiscardedCount++;
        } else {
          accepted.push({
            ...baseResult,
            source: 'tavily',
          });
          queryAcceptedCount++;
        }
      }

      console.log(`  ↓ ${res.results.length} results`);
      console.log(`  ↓ ${queryAcceptedCount} accepted`);
      console.log(`  ↓ ${queryDiscardedCount} discarded`);
    }
  }

  // Sort accepted candidates by score descending
  accepted.sort((a, b) => b.score - a.score);

  // Cap final response lists
  const finalAccepted = accepted.slice(0, DISCOVERY_CONFIG.MAX_PAGES_RETURNED_OVERALL);

  // If any elements were dropped due to cap, move them to rejected
  const cappedAcceptedUrls = new Set(finalAccepted.map((a) => a.url));
  for (const item of accepted) {
    if (!cappedAcceptedUrls.has(item.url)) {
      rejected.push({
        ...item,
        rejectionReason: 'Exceeded max overall results cap',
      });
    }
  }

  const avgLatency =
    totalSearches > 0 ? (totalLatencyMs / totalSearches / 1000).toFixed(2) : '0.00';

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Search Orchestrator Metrics Summary:');
  console.log(`Queries searched:   ${queries.length}`);
  console.log(`Total URLs found:   ${processedUrls.size}`);
  console.log(
    `Duplicates removed: ${rejected.filter((r) => r.rejectionReason === 'Duplicate URL').length}`,
  );
  console.log(`Accepted candidates: ${finalAccepted.length}`);
  console.log(`Rejected candidates: ${rejected.length}`);
  console.log(`Avg search latency:  ${avgLatency}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    accepted: finalAccepted,
    rejected,
  };
}
