import { normalizeUrl } from '../search/search-orchestrator';

export interface ExtractedListing {
  title: string;
  company: string;
  listingUrl: string;
  location: string;
  source: string;
}

export class JobBoardExtractor {
  // Max listings per board page limit
  private static readonly MAX_LISTINGS_PER_BOARD_PAGE = parseInt(
    process.env.MAX_LISTINGS_PER_BOARD_PAGE || '50',
    10,
  );

  // Reusable Domain-Specific opportunity and listing patterns
  private static readonly DOMAIN_PATTERNS: Record<
    string,
    { details: RegExp[]; listings: RegExp[] }
  > = {
    'devfolio.co': {
      details: [
        /\/hackathons\/[\w-]+/i,
        /\/hackathon\/[\w-]+/i,
        /\/jobs\/[\w-]+/i,
        /\/opportunity\/[\w-]+/i,
        /\/hiring\/[\w-]+/i,
      ],
      listings: [/^\/$/i, /^\/hackathons$/i, /^\/jobs$/i],
    },
    'unstop.com': {
      details: [
        /\/competition\/[\w-]+/i,
        /\/internship\/[\w-]+/i,
        /\/job\/[\w-]+/i,
        /\/hackathon\/[\w-]+/i,
        /\/fellowship\/[\w-]+/i,
        /\/opportunities\/[\w-]+/i,
      ],
      listings: [/^\/$/i, /^\/jobs$/i, /^\/internships$/i, /^\/opportunities$/i],
    },
    'indeed.com': {
      details: [/\/viewjob/i, /\/rc\/clk/i, /\/job\/[\w-]+/i],
      listings: [/^\/$/i, /\/jobs/i, /\/q-/i, /\/l-/i],
    },
    'glassdoor.co': {
      details: [
        /\/job-listing\/[\w-]+/i,
        /\/job-details\/[\w-]+/i,
        /\/partner\/joblisting/i,
        /\/jobs\//i,
        /-job-/i,
      ],
      listings: [/^\/$/i, /\/jobs/i, /\/job/i],
    },
    'internshala.com': {
      details: [/\/internship\/detail\/[\w-]+/i, /\/job\/detail\/[\w-]+/i],
      listings: [/^\/$/i, /\/internships/i, /\/jobs/i],
    },
    'hackerrank.com': {
      details: [/\/jobs\/[\w-]+/i, /\/careers\/[\w-]+/i],
      listings: [/^\/$/i, /\/jobs$/i, /\/careers$/i],
    },
    'greenhouse.io': {
      details: [/\/jobs\/\d+/i, /\/requisitions\/\d+/i],
      listings: [/^\/$/i],
    },
    'lever.co': {
      details: [/\/[^/]+\/[0-9a-f-]{36}/i, /\/[^/]+\/[a-f0-9-]{12,}/i],
      listings: [/^\/$/i],
    },
    'ashbyhq.com': {
      details: [/\/jobs\/[\w-]+/i],
      listings: [/^\/$/i],
    },
    'wellfound.com': {
      details: [/\/jobs\/[\w-]+/i],
      listings: [/^\/$/i, /\/jobs$/i, /\/role/i, /\/company/i],
    },
  };

  /**
   * Safe URL normalization that retains only vital keys
   * and strips all tracking, source, and attribution params.
   */
  public static cleanUrl(urlStr: string): string {
    try {
      const url = new URL(urlStr);
      const cleanParams = new URLSearchParams();

      // Only allow parameter keys that identify the specific job post
      const vitalParams = ['jk', 'id', 'jobid', 'oppid', 'r', 'requisition', 'postid'];

      url.searchParams.forEach((val, key) => {
        const kLower = key.toLowerCase();
        if (vitalParams.includes(kLower)) {
          cleanParams.append(kLower, val);
        }
      });

      url.search = cleanParams.toString();
      return url.toString().replace(/\/$/, '');
    } catch {
      return urlStr.replace(/\/$/, '');
    }
  }

  /**
   * Extracts clean domain name as the board identifier to prevent recursive crawls.
   */
  public static getBoardIdentifier(urlStr: string): string {
    try {
      const url = new URL(urlStr);
      let host = url.hostname.toLowerCase();
      if (host.startsWith('www.')) {
        host = host.slice(4);
      }
      return host;
    } catch {
      return urlStr;
    }
  }

  /**
   * Rejects asset URLs (images, cdn subdomains, media extensions).
   */
  public static isAssetUrl(urlStr: string): boolean {
    try {
      const url = new URL(urlStr);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();

      const isAssetHost =
        host.startsWith('cdn.') ||
        host.startsWith('images.') ||
        host.startsWith('assets.') ||
        host.startsWith('static.') ||
        host.startsWith('media.') ||
        host.includes('cloudfront.net') ||
        host.includes('s3.amazonaws.com') ||
        host.includes('wp-content');
      if (isAssetHost) {
        return true;
      }

      const ext = path.split('.').pop() || '';
      const assetExtensions = [
        'jpg',
        'jpeg',
        'png',
        'webp',
        'svg',
        'gif',
        'ico',
        'css',
        'js',
        'pdf',
        'woff',
        'woff2',
        'ttf',
        'otf',
        'mp4',
        'mp3',
        'zip',
      ];
      if (assetExtensions.includes(ext)) {
        return true;
      }

      return false;
    } catch {
      return true;
    }
  }

  /**
   * Scores discovered links using Step 3 Candidate scoring rules.
   */
  public static scoreCandidateLink(
    urlStr: string,
    linkText: string,
    contextText: string,
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const urlLower = urlStr.toLowerCase();
    const textLower = linkText.toLowerCase();
    const ctxLower = contextText.toLowerCase();

    // Step 4: Asset check
    if (this.isAssetUrl(urlStr)) {
      return { score: -999, reasons: ['Asset URL/Extension matched'] };
    }

    // Opportunity keywords check
    if (urlLower.includes('internship') || urlLower.includes('intern')) {
      score += 40;
      reasons.push('+40 URL contains internship/intern');
    }
    if (urlLower.includes('job') || urlLower.includes('careers') || urlLower.includes('vacancy')) {
      score += 40;
      reasons.push('+40 URL contains job/career');
    }
    if (urlLower.includes('hiring') || urlLower.includes('recruit')) {
      score += 30;
      reasons.push('+30 URL contains hiring/recruit');
    }
    if (urlLower.includes('apply')) {
      score += 20;
      reasons.push('+20 URL contains apply');
    }

    // Step 1: Platform specific pattern matches
    try {
      const url = new URL(urlStr);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();

      for (const [domainKey, patterns] of Object.entries(this.DOMAIN_PATTERNS)) {
        if (host.includes(domainKey)) {
          for (const rx of patterns.details) {
            if (rx.test(path) || rx.test(url.pathname + url.search)) {
              score += 50;
              reasons.push(`+50 Platform ${domainKey} match`);
              break;
            }
          }
        }
      }
    } catch {
      // Ignored
    }

    // Step 2: Context / DOM-based scoring
    const oppKeywords = [
      'apply',
      'internship',
      'intern',
      'job',
      'hackathon',
      'competition',
      'hiring',
      'register',
      'apply now',
      'stipend',
      'salary',
    ];
    const hasOppKeywordInCtx = oppKeywords.some((kw) => ctxLower.includes(kw));
    if (hasOppKeywordInCtx) {
      score += 20;
      reasons.push('+20 Context contains opportunity keywords');
    }

    const applyTexts = [
      'apply',
      'apply now',
      'register',
      'view details',
      'learn more',
      'apply link',
    ];
    const hasApplyText = applyTexts.some((at) => textLower.includes(at) || textLower === 'apply');
    if (hasApplyText) {
      score += 20;
      reasons.push('+20 Button/link matches apply/register');
    }

    // Negative filters
    if (urlLower.includes('/search') || urlLower.includes('/jobs-in-')) {
      score -= 50;
      reasons.push('-50 List page keyword matched');
    }

    return { score, reasons };
  }

  /**
   * Classifies url to enforce only queueing real opportunity pages.
   */
  public static classifyUrl(
    urlStr: string,
  ):
    | 'JOB_DETAIL'
    | 'LISTING_BOARD'
    | 'SEARCH_PAGE'
    | 'PAGINATION'
    | 'CATEGORY'
    | 'FILTER'
    | 'UNKNOWN' {
    if (this.isAssetUrl(urlStr)) {
      return 'UNKNOWN';
    }

    try {
      const url = new URL(urlStr);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();

      // Check pagination patterns
      const hasPageParam =
        url.searchParams.has('page') ||
        url.searchParams.has('p') ||
        url.searchParams.has('start') ||
        url.searchParams.has('pg') ||
        path.includes('/page/') ||
        path.includes('/p/');
      if (hasPageParam) {
        return 'PAGINATION';
      }

      // Check search parameters
      if (
        url.searchParams.has('q') ||
        url.searchParams.has('query') ||
        url.searchParams.has('search') ||
        path.includes('/search')
      ) {
        return 'SEARCH_PAGE';
      }

      // Check filters
      if (
        url.searchParams.has('loc') ||
        url.searchParams.has('radius') ||
        url.searchParams.has('fromage') ||
        url.searchParams.has('fromAge') ||
        path.includes('/filter/') ||
        path.includes('/filters/')
      ) {
        return 'FILTER';
      }

      // Check categories
      if (
        path.includes('/category/') ||
        path.includes('/categories/') ||
        path.includes('/tag/') ||
        path.includes('/tags/')
      ) {
        return 'CATEGORY';
      }

      // 1. Domain-specific pattern checks
      for (const [domainKey, patterns] of Object.entries(this.DOMAIN_PATTERNS)) {
        if (host.includes(domainKey)) {
          // Check detail patterns
          for (const rx of patterns.details) {
            if (rx.test(path) || rx.test(url.pathname + url.search)) {
              return 'JOB_DETAIL';
            }
          }
          // Check listing patterns
          for (const rx of patterns.listings) {
            if (rx.test(path)) {
              return 'LISTING_BOARD';
            }
          }

          if (domainKey === 'lever.co') {
            const segments = path.split('/').filter(Boolean);
            if (segments.length >= 2) {
              return 'JOB_DETAIL';
            }
          }

          if (domainKey === 'ashbyhq.com') {
            const segments = path.split('/').filter(Boolean);
            if (segments.includes('jobs') && segments.length > segments.indexOf('jobs') + 1) {
              return 'JOB_DETAIL';
            }
          }

          return 'LISTING_BOARD';
        }
      }

      // 2. Generic opportunity keywords fallback
      const isJobPath =
        path.match(/\/(job|opening|vacancy|opportunity|detail)\//) || path.match(/\/\d{5,}/);
      if (isJobPath) {
        return 'JOB_DETAIL';
      }

      if (
        path.includes('/jobs') ||
        path.includes('/careers') ||
        path.includes('/openings') ||
        path.includes('/work-with-us') ||
        path.includes('/join-us')
      ) {
        return 'LISTING_BOARD';
      }

      return 'UNKNOWN';
    } catch {
      return 'UNKNOWN';
    }
  }

  /**
   * Classifies if the page is a job board listing page based on DOM/markdown heuristics.
   */
  public static isBoardPage(url: string, markdown: string): boolean {
    const u = url.toLowerCase();

    // Check known job boards domains
    const isKnownJobBoard =
      u.includes('indeed.com') ||
      u.includes('internshala.com') ||
      u.includes('unstop.com') ||
      u.includes('wellfound.com') ||
      u.includes('greenhouse.io') ||
      u.includes('lever.co') ||
      u.includes('ashbyhq.com') ||
      u.includes('glassdoor.co') ||
      u.includes('devfolio.co') ||
      u.includes('hackerrank.com');

    if (isKnownJobBoard) {
      const classification = this.classifyUrl(url);
      if (classification === 'JOB_DETAIL') {
        return false;
      }
      return true; // Any non-JOB_DETAIL page on a known job board is by definition a LISTING_BOARD
    }

    // Heuristics: require multiple strong signals
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const matches = markdown.match(linkRegex) || [];

    let jobUrlCount = 0;
    for (const m of matches) {
      const matchUrl = m.match(/\((https?:\/\/[^\s)]+)\)/)?.[1];
      if (matchUrl && this.classifyUrl(matchUrl) === 'JOB_DETAIL') {
        jobUrlCount++;
      }
    }

    let signals = 0;
    if (jobUrlCount >= 5) signals++;

    const textStatsCount = (markdown.match(/company|employer|location|stipend|salary/gi) || [])
      .length;
    if (textStatsCount >= 8) signals++;

    const applyCount = (markdown.match(/apply|apply now|view details/gi) || []).length;
    if (applyCount >= 5) signals++;

    return signals >= 2;
  }

  /**
   * Extracts list of opportunities from job board page markdown using Layered Harvesting Strategy.
   */
  public static extractListings(markdown: string, url: string): ExtractedListing[] {
    const listings: ExtractedListing[] = [];
    const seenUrls = new Set<string>();
    const sourceDomain = this.getBoardIdentifier(url);

    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

    let cardsFound = 0;
    let cardsWithApplyButton = 0;
    let cardsWithOpportunityKeywords = 0;
    let linksExtracted = 0;

    const acceptedList: { url: string; score: number; reasons: string[] }[] = [];
    const rejectedList: { url: string; score: number; reasons: string[] }[] = [];
    const paginationUrls = new Set<string>();

    // Step 2: Context / DOM-based block scanning
    const paragraphs = markdown.split(/\n\s*\n/);

    for (const paragraph of paragraphs) {
      const pLinks: { text: string; url: string }[] = [];
      let linkMatch;
      while ((linkMatch = linkRegex.exec(paragraph)) !== null) {
        pLinks.push({ text: linkMatch[1].trim(), url: linkMatch[2].trim() });
      }

      if (pLinks.length === 0) continue;

      cardsFound++;
      const hasApply =
        paragraph.toLowerCase().includes('apply') || paragraph.toLowerCase().includes('register');
      if (hasApply) cardsWithApplyButton++;

      const oppKeywords = [
        'apply',
        'internship',
        'intern',
        'job',
        'hackathon',
        'competition',
        'hiring',
        'stipend',
        'salary',
      ];
      const hasKeywords = oppKeywords.some((kw) => paragraph.toLowerCase().includes(kw));
      if (hasKeywords) cardsWithOpportunityKeywords++;

      for (const link of pLinks) {
        linksExtracted++;
        let cleanUrlStr = link.url;
        try {
          const parsed = new URL(link.url);
          const linkDomain = parsed.hostname.replace('www.', '');

          if (
            linkDomain !== sourceDomain &&
            !linkDomain.endsWith('.' + sourceDomain) &&
            !sourceDomain.endsWith('.' + linkDomain)
          ) {
            rejectedList.push({
              url: link.url,
              score: -100,
              reasons: ['External domain'],
            });
            continue;
          }
          cleanUrlStr = this.cleanUrl(link.url);
        } catch {
          rejectedList.push({
            url: link.url,
            score: -999,
            reasons: ['Invalid URL'],
          });
          continue;
        }

        // Step 6: Pagination detection
        const paginationRegex = /[?&](page|p|start|offset)=\d+/i;
        if (paginationRegex.test(cleanUrlStr) || cleanUrlStr.includes('/page/')) {
          paginationUrls.add(cleanUrlStr);
        }

        // Strict classification filter first
        const classification = this.classifyUrl(cleanUrlStr);
        const scoring = this.scoreCandidateLink(cleanUrlStr, link.text, paragraph);

        if (classification !== 'JOB_DETAIL') {
          rejectedList.push({
            url: cleanUrlStr,
            score: scoring.score - 100,
            reasons: [
              ...scoring.reasons,
              `Classification is ${classification} (Must be JOB_DETAIL)`,
            ],
          });
          continue;
        }

        if (scoring.score >= 30) {
          acceptedList.push({
            url: cleanUrlStr,
            score: scoring.score,
            reasons: scoring.reasons,
          });

          const cleanUrlLower = cleanUrlStr.toLowerCase();
          if (!seenUrls.has(cleanUrlLower)) {
            seenUrls.add(cleanUrlLower);
            listings.push({
              title: link.text,
              company: sourceDomain.split('.')[0],
              listingUrl: cleanUrlStr,
              location: 'Remote',
              source: sourceDomain,
            });
          }
        } else {
          rejectedList.push({
            url: cleanUrlStr,
            score: scoring.score,
            reasons: scoring.reasons,
          });
        }
      }
    }

    // Step 5: Platform debugging logs
    console.log(`
Platform:                        ${sourceDomain}
Cards Found:                     ${cardsFound}
Cards With Apply Button:         ${cardsWithApplyButton}
Cards With Opportunity Keywords: ${cardsWithOpportunityKeywords}
Links Extracted:                 ${linksExtracted}
Links Accepted:                  ${acceptedList.length}
Links Rejected:                  ${rejectedList.length}

Pagination URLs Discovered (${paginationUrls.size}):
${
  Array.from(paginationUrls)
    .slice(0, 5)
    .map((u) => ` - ${u}`)
    .join('\n') || 'None'
}

Top 5 Accepted URLs:
${
  acceptedList
    .slice(0, 5)
    .map(
      (item) =>
        ` - URL: ${item.url}\n   Score: ${item.score}\n   Reasons: ${item.reasons.join(', ')}`,
    )
    .join('\n') || 'None'
}

Top 5 Rejected URLs:
${
  rejectedList
    .slice(0, 5)
    .map(
      (item) =>
        ` - URL: ${item.url}\n   Score: ${item.score}\n   Reasons: ${item.reasons.join(', ')}`,
    )
    .join('\n') || 'None'
}
`);

    if (listings.length === 0) {
      console.log(`No opportunity detail pages discovered.`);
    }

    return listings.slice(0, this.MAX_LISTINGS_PER_BOARD_PAGE);
  }
}
export default JobBoardExtractor;
