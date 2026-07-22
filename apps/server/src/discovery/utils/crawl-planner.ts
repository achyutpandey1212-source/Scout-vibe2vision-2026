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
    if (
      BLACKLISTED_EXTENSIONS.some((ext) => urlLower.endsWith(ext)) ||
      urlLower.includes('.pdf') ||
      urlLower.includes('.doc') ||
      urlLower.includes('.docx') ||
      urlLower.includes('.ppt') ||
      urlLower.includes('.pptx') ||
      urlLower.includes('.xls') ||
      urlLower.includes('.xlsx') ||
      urlLower.includes('.zip') ||
      urlLower.includes('.rar')
    ) {
      return {
        decision: 'SKIP',
        reason: 'SKIPPED_NON_HTML_RESOURCE',
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
  static validateContent(markdown: string, url?: string): { valid: boolean; reason?: string } {
    if (!markdown || markdown.trim().length < 100) {
      return { valid: false, reason: 'CONTENT_TOO_SMALL' };
    }

    const textLower = markdown.toLowerCase();

    // Check 404
    if (
      textLower.includes('404 page not found') ||
      textLower.includes('error 404') ||
      textLower.includes('page not found')
    ) {
      return { valid: false, reason: '404' };
    }

    // Step 5: Confidence Scoring setup
    let blockedConfidence = 0;
    const matchedSignals: string[] = [];
    const matchedSnippets: string[] = [];

    // Helper to add signal
    const addSignal = (phrase: string, score: number) => {
      if (textLower.includes(phrase)) {
        blockedConfidence += score;
        matchedSignals.push(phrase);
        // Find a small snippet around the matched signal
        const idx = textLower.indexOf(phrase);
        const start = Math.max(0, idx - 40);
        const end = Math.min(markdown.length, idx + phrase.length + 40);
        const snippet = markdown.substring(start, end).replace(/\s+/g, ' ').trim();
        matchedSnippets.push(`"...${snippet}..."`);
      }
    };

    // Strong Signals (CAPTCHA/Challenge)
    addSignal('verify you are human', 40);
    addSignal('verify that you are human', 40);
    addSignal('human verification', 40);
    addSignal('cloudflare challenge', 40);
    addSignal('cf-challenge', 40);
    addSignal('cf-ray', 40);
    addSignal('ray id:', 40);
    addSignal('robot verification', 40);
    addSignal('security challenge', 40);
    addSignal('security check', 40);
    addSignal('bot detection', 30);
    addSignal('anti-bot', 30);
    addSignal('distil networks', 30);
    addSignal('please enable javascript', 30);
    addSignal('javascript is required', 30);
    addSignal('enable cookies', 30);
    addSignal('cookies are disabled', 30);
    addSignal('access denied', 30);
    addSignal('403 forbidden', 30);
    addSignal('request blocked', 30);
    addSignal('blocked ip', 30);
    addSignal('ip blocked', 30);
    addSignal('ddos protection', 30);

    // Weak Signals (standard nav/modal terms)
    addSignal('recaptcha', 5);
    addSignal('captcha', 10);
    addSignal('robot check', 10);
    addSignal('login', 2);
    addSignal('register', 2);
    addSignal('create account', 2);
    addSignal('sign in', 2);
    addSignal('employer login', 1);
    addSignal('student login', 1);

    // Detect login gateway pages (no opportunities and short page size)
    const hasOpportunityKeywords =
      textLower.includes('apply') ||
      textLower.includes('intern') ||
      textLower.includes('job') ||
      textLower.includes('career') ||
      textLower.includes('stipend') ||
      textLower.includes('salary') ||
      textLower.includes('hiring') ||
      textLower.includes('opening') ||
      textLower.includes('recruiting');

    const hasLoginSignals =
      textLower.includes('login') ||
      textLower.includes('register') ||
      textLower.includes('sign in') ||
      textLower.includes('sign up') ||
      textLower.includes('create account');

    if (markdown.length < 2000 && hasLoginSignals && !hasOpportunityKeywords) {
      blockedConfidence += 60;
      matchedSignals.push('login gateway (no opportunities)');
      matchedSnippets.push(`"Short page (< 2000 chars) with login signals and zero opportunities"`);
    }

    // Step 6: Structured high-density page immunity check
    const headingsCount =
      (markdown.match(/^#{1,4}\s+/gm) || []).length + (markdown.match(/<h[1-4]/gi) || []).length;
    const linksCount =
      (markdown.match(/\[[^\]]+\]\([^)]+\)/g) || []).length +
      (markdown.match(/<a\s/gi) || []).length;
    const paragraphsCount = markdown.split('\n\n').filter((p) => p.trim().length > 40).length;

    const isHighDensityPage =
      markdown.length > 10000 && headingsCount >= 2 && linksCount >= 3 && paragraphsCount >= 3;

    if (isHighDensityPage) {
      // Capped to prevent false positives on fully loaded large listing pages
      blockedConfidence = Math.min(30, blockedConfidence);
    }

    const decision = blockedConfidence >= 60 ? 'BLOCKED' : 'NOT BLOCKED';

    // Step 7: Block detector logging report
    console.log(`
========== BLOCK DETECTOR REPORT ==========
URL:             ${url || 'Unknown'}
Markdown Length: ${markdown.length}
Confidence:      ${blockedConfidence}/100
Structured Page: ${isHighDensityPage ? 'Yes (Headings: ' + headingsCount + ', Links: ' + linksCount + ', Paragraphs: ' + paragraphsCount + ')' : 'No'}
Signals Matched: ${matchedSignals.join(', ') || 'None'}
Snippets:
${matchedSnippets.map((s) => ` - ${s}`).join('\n') || 'None'}
Decision:        ${decision}
===========================================
`);

    if (decision === 'BLOCKED') {
      return { valid: false, reason: 'BLOCKED' };
    }

    return { valid: true };
  }
}
