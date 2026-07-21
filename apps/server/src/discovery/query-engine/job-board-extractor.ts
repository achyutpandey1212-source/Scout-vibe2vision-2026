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
      u.includes('ashbyhq.com');

    if (!isKnownJobBoard) {
      // General heuristics for other listing directories (e.g. repeated job links or cards)
      const matches = markdown.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g) || [];
      const jobUrlCount = matches.filter((m) => {
        const urlPart = m.toLowerCase();
        return (
          urlPart.includes('/job/') ||
          urlPart.includes('/jobs/') ||
          urlPart.includes('/careers/') ||
          urlPart.includes('/career/') ||
          urlPart.includes('/opening/') ||
          urlPart.includes('/openings/')
        );
      }).length;

      // If page contains more than 8 repeated job links, classify as listing page
      return jobUrlCount >= 8;
    }

    // For known job boards, verify if it's a directory/listing list rather than a single job page
    if (u.includes('indeed.com')) {
      return u.includes('/jobs') || u.includes('/q-') || u.includes('/l-') || u.includes('filter');
    }
    if (u.includes('internshala.com')) {
      return u.includes('/internships') || u.includes('/jobs') || u.includes('/matching');
    }
    if (u.includes('unstop.com')) {
      return u.includes('/jobs') || u.includes('/internships') || u.includes('/opportunities');
    }
    if (u.includes('wellfound.com')) {
      return u.includes('/jobs') || u.includes('/role') || u.includes('/company');
    }
    if (u.includes('greenhouse.io') || u.includes('lever.co') || u.includes('ashbyhq.com')) {
      // Greenhouse/Lever/Ashby listing pages usually have company identifiers but not direct job paths
      const isSingle =
        u.match(/\/(jobs|requisitions|job|careers)\/\d+/) ||
        u.match(/\/[a-f0-9-]{12,}/) ||
        (u.includes('lever.co') && u.split('/').length > 4);
      return !isSingle;
    }

    return true;
  }

  /**
   * Extracts list of opportunities from job board page markdown.
   */
  public static extractListings(markdown: string, url: string): ExtractedListing[] {
    const listings: ExtractedListing[] = [];
    const seenUrls = new Set<string>();
    const u = url.toLowerCase();
    const sourceDomain = new URL(url).hostname.replace('www.', '');

    // Heuristically find markdown links
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
      } else if (
        sourceDomain.includes('greenhouse.io') ||
        sourceDomain.includes('lever.co') ||
        sourceDomain.includes('ashbyhq.com')
      ) {
        // Lever/Greenhouse single job details check
        isJobLink = !!(
          cleanUrlLower.match(/\/(jobs|requisitions|job|careers)\/\d+/) ||
          cleanUrlLower.match(/\/[a-f0-9-]{12,}/) ||
          (cleanUrlLower.includes('lever.co') && cleanUrlLower.split('/').length > 4)
        );
      } else {
        // General crawler fallback heuristics
        isJobLink =
          cleanUrlLower.includes('/job/') ||
          cleanUrlLower.includes('/jobs/') ||
          cleanUrlLower.includes('/careers/') ||
          cleanUrlLower.includes('/career/') ||
          cleanUrlLower.includes('/opening/') ||
          cleanUrlLower.includes('/openings/');
      }

      if (isJobLink && titleText.length > 2) {
        // Exclude general navigation links
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
