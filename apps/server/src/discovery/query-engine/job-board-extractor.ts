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
        /\/hiring\/[\w-]+/i,
        /\/jobs\/[\w-]+/i,
        /\/opportunity\/[\w-]+/i,
        /\/projects\/[\w-]+/i,
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
      details: [/\/job-listing\/[\w-]+/i, /\/job-details\/[\w-]+/i],
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
      const search = url.search.toLowerCase();

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

          // Lever specific fallback: lever detail pages have at least 2 segments
          if (domainKey === 'lever.co') {
            const segments = path.split('/').filter(Boolean);
            if (segments.length >= 2) {
              return 'JOB_DETAIL';
            }
          }

          // Ashby specific fallback: ashby detail pages have jobs/id
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
   * Extracts list of opportunities from job board page markdown.
   */
  public static extractListings(markdown: string, url: string): ExtractedListing[] {
    const listings: ExtractedListing[] = [];
    const seenUrls = new Set<string>();
    const sourceDomain = new URL(url).hostname.replace('www.', '');

    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let match;

    let cardsFound = 0;
    const candidateLinks: string[] = [];
    const jobDetailUrls: string[] = [];
    const listingUrls: string[] = [];
    const externalUrls: string[] = [];
    const rejectedUrls: string[] = [];

    while ((match = linkRegex.exec(markdown)) !== null) {
      cardsFound++;
      const titleText = match[1].trim();
      const rawUrl = match[2].trim();

      let cleanUrlStr = rawUrl;
      try {
        const parsed = new URL(rawUrl);
        const linkDomain = parsed.hostname.replace('www.', '');
        if (
          linkDomain !== sourceDomain &&
          !linkDomain.endsWith('.' + sourceDomain) &&
          !sourceDomain.endsWith('.' + linkDomain)
        ) {
          externalUrls.push(rawUrl);
          continue;
        }
        cleanUrlStr = this.cleanUrl(rawUrl);
      } catch {
        rejectedUrls.push(rawUrl);
        continue;
      }

      const cleanUrlLower = cleanUrlStr.toLowerCase();
      candidateLinks.push(cleanUrlStr);

      const classification = this.classifyUrl(cleanUrlStr);

      if (classification === 'JOB_DETAIL') {
        if (titleText.length > 2) {
          const lowerTitle = titleText.toLowerCase();
          const isGeneric =
            lowerTitle === 'apply' ||
            lowerTitle === 'apply now' ||
            lowerTitle === 'view' ||
            lowerTitle === 'view details' ||
            lowerTitle === 'learn more' ||
            lowerTitle.includes('sign in') ||
            lowerTitle.includes('login') ||
            lowerTitle.includes('cookie') ||
            lowerTitle.includes('privacy') ||
            lowerTitle.includes('terms');

          if (!isGeneric) {
            jobDetailUrls.push(cleanUrlStr);
            if (!seenUrls.has(cleanUrlLower)) {
              seenUrls.add(cleanUrlLower);
              listings.push({
                title: titleText,
                company: sourceDomain.split('.')[0],
                listingUrl: cleanUrlStr,
                location: 'Remote',
                source: sourceDomain,
              });
            }
          } else {
            rejectedUrls.push(`${cleanUrlStr} (Reason: generic title)`);
          }
        } else {
          rejectedUrls.push(`${cleanUrlStr} (Reason: title too short)`);
        }
      } else if (
        classification === 'LISTING_BOARD' ||
        classification === 'SEARCH_PAGE' ||
        classification === 'PAGINATION'
      ) {
        listingUrls.push(cleanUrlStr);
      } else {
        rejectedUrls.push(`${cleanUrlStr} (Reason: ${classification})`);
      }
    }

    // Print diagnostics
    console.log(`
[Harvesting Diagnostics] Domain: ${sourceDomain}
Cards Found:                   ${cardsFound}
Candidate Links:               ${candidateLinks.length}
Job Detail URLs:               ${jobDetailUrls.length}
Listing URLs:                  ${listingUrls.length}
External URLs:                 ${externalUrls.length}
Rejected Non-opportunity URLs: ${rejectedUrls.length}

Example Accepted URLs (first 5):
${
  jobDetailUrls
    .slice(0, 5)
    .map((l) => ` - ${l}`)
    .join('\n') || 'None'
}

Example Rejected URLs (first 5):
${
  rejectedUrls
    .slice(0, 5)
    .map((l) => ` - ${l}`)
    .join('\n') || 'None'
}
`);

    if (jobDetailUrls.length === 0) {
      console.log(`No opportunity detail pages discovered.`);
    }

    return listings.slice(0, this.MAX_LISTINGS_PER_BOARD_PAGE);
  }
}
export default JobBoardExtractor;
