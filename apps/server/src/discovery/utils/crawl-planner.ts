import { CandidateURL } from '../stages/stage1';

export type CrawlDecision = 'SKIP' | 'USE_CACHE' | 'USE_FIRECRAWL' | 'USE_SNIPPET_FALLBACK';

export interface CrawlPlan {
  decision: CrawlDecision;
  reason: string;
}

const BLACKLISTED_EXTENSIONS = [
  '.zip',
  '.pdf',
  '.docx',
  '.xlsx',
  '.pptx',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.mp4',
  '.mp3',
];

const IGNORED_PATH_PATTERNS = [
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
  '/feed',
  '/settings',
];

export class CrawlPlanner {
  /**
   * Plans the crawling strategy for a candidate URL.
   * Decides whether to crawl via Firecrawl, fallback to snippet, or skip the page entirely.
   */
  static evaluate(candidate: CandidateURL): CrawlPlan {
    const urlLower = candidate.url.toLowerCase();

    // 1. Check for blacklisted file extensions
    if (BLACKLISTED_EXTENSIONS.some((ext) => urlLower.endsWith(ext))) {
      return {
        decision: 'SKIP',
        reason: 'URL points to an unsupported file type or media asset.',
      };
    }

    // 2. Check for administrative or boilerplate path patterns
    try {
      const parsed = new URL(candidate.url);
      const pathname = parsed.pathname.toLowerCase();
      if (IGNORED_PATH_PATTERNS.some((pat) => pathname.includes(pat))) {
        return {
          decision: 'SKIP',
          reason: `URL path matches ignored administrative route: ${pathname}`,
        };
      }
    } catch {
      return {
        decision: 'SKIP',
        reason: 'Malformed candidate URL.',
      };
    }

    // 3. Evaluate snippet quality
    const snippetLen = candidate.snippet ? candidate.snippet.trim().length : 0;

    // High-priority trusted source with low snippet density needs a deep crawl
    const isHighPriority = candidate.score >= 12;
    if (isHighPriority && snippetLen < 150) {
      return {
        decision: 'USE_FIRECRAWL',
        reason: 'High priority source with insufficient snippet data.',
      };
    }

    // Default to Firecrawl if the score is sufficient, otherwise use snippet fallback
    if (candidate.score >= 6) {
      return {
        decision: 'USE_FIRECRAWL',
        reason: 'Sufficient relevance score to warrant crawling.',
      };
    }

    return {
      decision: 'USE_SNIPPET_FALLBACK',
      reason: 'Low priority candidate; falling back to Tavily snippet to save credits.',
    };
  }

  /**
   * Performs validation on scraped content to verify quality.
   */
  static validateContent(markdown: string): { valid: boolean; reason?: string } {
    if (!markdown || markdown.trim().length < 100) {
      return { valid: false, reason: 'CONTENT_TOO_SMALL' };
    }

    const textLower = markdown.toLowerCase();
    if (
      textLower.includes('captcha') ||
      textLower.includes('robot check') ||
      textLower.includes('please enable javascript')
    ) {
      return { valid: false, reason: 'BLOCKED' };
    }

    if (
      textLower.includes('404 page not found') ||
      textLower.includes('error 404') ||
      textLower.includes('page not found')
    ) {
      return { valid: false, reason: '404' };
    }

    return { valid: true };
  }
}
