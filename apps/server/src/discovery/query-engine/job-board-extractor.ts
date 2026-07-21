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
    try {
      const url = new URL(urlStr);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();
      const search = url.search.toLowerCase();

      // Pagination indicators
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

      // Search engine / query filters
      if (
        url.searchParams.has('q') ||
        url.searchParams.has('query') ||
        url.searchParams.has('search') ||
        path.includes('/search')
      ) {
        return 'SEARCH_PAGE';
      }

      // Geo / age / radius filters
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

      // Category paths
      if (
        path.includes('/category/') ||
        path.includes('/categories/') ||
        path.includes('/tag/') ||
        path.includes('/tags/')
      ) {
        return 'CATEGORY';
      }

      // Glassdoor
      if (host.includes('glassdoor.co')) {
        if (path.includes('/job-listing/') || path.includes('/job-details/')) {
          return 'JOB_DETAIL';
        }
        return 'LISTING_BOARD';
      }

      // Indeed
      if (host.includes('indeed.com')) {
        if (path.includes('/viewjob') || search.includes('jk=')) {
          return 'JOB_DETAIL';
        }
        return 'LISTING_BOARD';
      }

      // Internshala
      if (host.includes('internshala.com')) {
        if (path.includes('/internship/detail/') || path.includes('/job/detail/')) {
          return 'JOB_DETAIL';
        }
        return 'LISTING_BOARD';
      }

      // Unstop
      if (host.includes('unstop.com')) {
        if (path.match(/\/jobs\/[\w-]+-\d+/) || path.match(/\/internships\/[\w-]+-\d+/)) {
          return 'JOB_DETAIL';
        }
        return 'LISTING_BOARD';
      }

      // Greenhouse
      if (host.includes('greenhouse.io')) {
        if (path.match(/\/jobs\/\d+/)) {
          return 'JOB_DETAIL';
        }
        return 'LISTING_BOARD';
      }

      // Lever
      if (host.includes('lever.co')) {
        const segments = path.split('/').filter(Boolean);
        if (segments.length >= 2) {
          return 'JOB_DETAIL';
        }
        return 'LISTING_BOARD';
      }

      // Ashby
      if (host.includes('ashbyhq.com')) {
        const segments = path.split('/').filter(Boolean);
        if (segments.includes('jobs') && segments.length > segments.indexOf('jobs') + 1) {
          return 'JOB_DETAIL';
        }
        return 'LISTING_BOARD';
      }

      // Wellfound
      if (host.includes('wellfound.com')) {
        if (path.includes('/jobs') || path.includes('/role') || path.includes('/company')) {
          return 'LISTING_BOARD';
        }
      }

      // Devfolio
      if (host.includes('devfolio.co')) {
        if (path.includes('/jobs/') || path.includes('/internships/')) {
          return 'JOB_DETAIL';
        }
        return 'LISTING_BOARD';
      }

      // Hackerrank
      if (host.includes('hackerrank.com')) {
        if (path.includes('/jobs/') || path.includes('/careers/')) {
          return 'JOB_DETAIL';
        }
        return 'LISTING_BOARD';
      }

      // General fallback
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

    while ((match = linkRegex.exec(markdown)) !== null) {
      const titleText = match[1].trim();
      const rawUrl = match[2].trim();
      const cleanUrlStr = this.cleanUrl(rawUrl);
      const cleanUrlLower = cleanUrlStr.toLowerCase();

      if (seenUrls.has(cleanUrlLower)) continue;

      let isJobLink = false;
      const company = '';
      const location = 'Remote';

      // Domain-specific job link filters
      if (sourceDomain.includes('indeed.com')) {
        isJobLink =
          cleanUrlLower.includes('/rc/clk') ||
          cleanUrlLower.includes('/viewjob') ||
          cleanUrlLower.includes('/jobs/');
      } else if (sourceDomain.includes('internshala.com')) {
        isJobLink =
          cleanUrlLower.includes('/internship/detail/') || cleanUrlLower.includes('/job/detail/');
      } else if (sourceDomain.includes('unstop.com')) {
        isJobLink = cleanUrlLower.includes('/jobs/') || cleanUrlLower.includes('/internships/');
      } else if (sourceDomain.includes('wellfound.com')) {
        isJobLink = cleanUrlLower.includes('/jobs') || cleanUrlLower.includes('/company/');
      } else if (sourceDomain.includes('devfolio.co')) {
        isJobLink = cleanUrlLower.includes('/jobs/') || cleanUrlLower.includes('/internships/');
      } else if (sourceDomain.includes('hackerrank.com')) {
        isJobLink = cleanUrlLower.includes('/jobs/') || cleanUrlLower.includes('/careers/');
      } else if (
        sourceDomain.includes('greenhouse.io') ||
        sourceDomain.includes('lever.co') ||
        sourceDomain.includes('ashbyhq.com')
      ) {
        isJobLink = !!(
          cleanUrlLower.match(/\/(jobs|requisitions|job|careers)\/\d+/) ||
          cleanUrlLower.match(/\/[a-f0-9-]{12,}/) ||
          (cleanUrlLower.includes('lever.co') && cleanUrlLower.split('/').length > 4)
        );
      } else {
        isJobLink =
          cleanUrlLower.includes('/job/') ||
          cleanUrlLower.includes('/jobs/') ||
          cleanUrlLower.includes('/careers/') ||
          cleanUrlLower.includes('/career/') ||
          cleanUrlLower.includes('/opening/') ||
          cleanUrlLower.includes('/openings/');
      }

      if (isJobLink && titleText.length > 2) {
        const lowerTitle = titleText.toLowerCase();
        if (
          lowerTitle === 'apply' ||
          lowerTitle === 'apply now' ||
          lowerTitle === 'view' ||
          lowerTitle === 'view details' ||
          lowerTitle === 'learn more' ||
          lowerTitle.includes('sign in') ||
          lowerTitle.includes('login') ||
          lowerTitle.includes('cookie') ||
          lowerTitle.includes('privacy') ||
          lowerTitle.includes('terms')
        ) {
          continue;
        }

        seenUrls.add(cleanUrlLower);
        listings.push({
          title: titleText,
          company: company || sourceDomain.split('.')[0],
          listingUrl: cleanUrlStr,
          location,
          source: sourceDomain,
        });

        if (listings.length >= this.MAX_LISTINGS_PER_BOARD_PAGE) {
          break;
        }
      }
    }

    return listings;
  }
}
export default JobBoardExtractor;
