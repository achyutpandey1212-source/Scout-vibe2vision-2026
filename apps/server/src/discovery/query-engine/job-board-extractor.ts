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

  // Counter to limit RAW LINK diagnostic logs to first 3 Glassdoor links only
  public static _glassdoorRawLinkLogCount = 0;

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
        /\/competitions?\/[\w-]+-\d+/i,
        /\/internships?\/[\w-]+-\d+/i,
        /\/jobs?\/[\w-]+-\d+/i,
        /\/hackathons?\/[\w-]+-\d+/i,
        /\/fellowships?\/[\w-]+-\d+/i,
        /\/opportunity\/[\w-]+-\d+/i,
        /\/opportunities\/[\w-]+-\d+/i,
        /\/o\/[\w-]+/i,
      ],
      listings: [
        /^\/$/i,
        /\/jobs\/?$/i,
        /\/internships\/?$/i,
        /\/opportunities\/?$/i,
        /\/student-internships/i,
        /\/online-internships/i,
        /\/engineering-internships/i,
        /\/all-internships/i,
        /\/competitions\/?$/i,
        /\/hackathons\/?$/i,
        /\/fellowships\/?$/i,
        /\/scholarships\/?$/i,
        /-internships/i,
        /-jobs/i,
      ],
    },
    'indeed.com': {
      details: [
        /\/viewjob/i,
        /\/rc\/clk/i,
        /\/pagead\/clk/i,
        /\/job\/[\w-]+/i,
        /\/company\/.*\/jobs\//i,
      ],
      listings: [/^\/$/i, /\/jobs/i, /\/q-/i, /\/l-/i, /\/cmp/i],
    },
    'glassdoor.co': {
      details: [/\/job-listing\//i, /\/job-details\//i, /\/partner\/joblisting/i],
      listings: [/^\/$/i, /\/jobs\/?$/i, /\/Job\/.*-jobs-/i, /\/Job\/[a-z-]+-jobs-SRCH_/i],
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
      listings: [/^\/$/i, /\/embed\/job_board/i],
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
      details: [/\/jobs\/\d+/i, /\/role\/l\/[\w-]+/i, /\/company\/[^/]+\/jobs\/\d+/i],
      listings: [/^\/$/i, /\/jobs/i, /\/role/i, /\/company/i, /\/location/i],
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

      // Only allow parameter keys that identify the specific job post.
      // 'jl' is Glassdoor's canonical job listing ID — without it all /job-listing/ URLs return 404.
      const vitalParams = ['jk', 'jl', 'id', 'jobid', 'oppid', 'r', 'requisition', 'postid'];

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
   * Fix 2: Never create cards from UI elements (Logo, Menu, Search, Filter, Chevron, Icon, Avatar, Profile, Navigation, Footer, Header).
   */
  public static isUiComponentBlock(block: string, baseUrl?: string): boolean {
    if (!block) return true;
    const textLower = block.toLowerCase();
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // If block contains any link classified as JOB_DETAIL, it is NOT a UI component block!
    const links = this.extractAllLinks(block, baseUrl);
    const hasDetailLink = links.some((l) => this.classifyUrl(l.url) === 'JOB_DETAIL');
    if (hasDetailLink) {
      return false;
    }

    // Ignore block if fewer than 3 lines or < 30 characters of text
    if (lines.length < 3 || block.trim().length < 30) {
      return true;
    }

    const uiKeywords = [
      'logo',
      'menu',
      'search',
      'filter',
      'chevron',
      'icon',
      'avatar',
      'profile',
      'navigation',
      'footer',
      'header',
      'squarehalf',
      'dualtone',
      'dropdown',
    ];

    const containsUiKeyword = uiKeywords.some((kw) => textLower.includes(kw));
    if (containsUiKeyword && lines.length <= 4) {
      return true;
    }

    return false;
  }

  /**
   * Fix 1: Validates if a text block contains sufficient opportunity-specific signals.
   * Requires at least TWO opportunity keywords or a direct detail link.
   */
  public static isOpportunityCardBlock(block: string, baseUrl?: string): boolean {
    if (this.isUiComponentBlock(block, baseUrl)) {
      return false;
    }

    const textLower = block.toLowerCase();
    const opportunitySignals = [
      'internship',
      'job',
      'hackathon',
      'competition',
      'fellowship',
      'scholarship',
      'apply',
      'deadline',
      'stipend',
      'team size',
      'location',
      'register',
      'prize',
      'salary',
      'hiring',
      'view details',
    ];

    let matchCount = 0;
    for (const signal of opportunitySignals) {
      if (textLower.includes(signal)) {
        matchCount++;
      }
    }

    // Direct detail URL in block (or classified as JOB_DETAIL) adds +2 to signal count
    const links = this.extractAllLinks(block, baseUrl);
    const hasJobDetail = links.some((l) => this.classifyUrl(l.url) === 'JOB_DETAIL');
    if (hasJobDetail) {
      matchCount += 2;
    }

    return matchCount >= 2;
  }

  /**
   * Fix 3: Extracts all links from markdown, HTML anchors, data attributes, onclick, Next.js JSON, or relative URLs.
   */
  public static extractAllLinks(
    text: string,
    baseUrl?: string,
  ): { text: string; url: string; type: string }[] {
    const links: { text: string; url: string; type: string }[] = [];
    const seen = new Set<string>();

    const addLink = (rawUrl: string, rawText: string, type: string) => {
      let clean = (rawUrl || '').trim();
      if (!clean) return;

      if (clean.startsWith('/') && baseUrl) {
        try {
          clean = new URL(clean, baseUrl).toString();
        } catch {
          // Keep clean as is
        }
      }

      if (this.isAssetUrl(clean)) return;

      const dedupeKey = clean.toLowerCase();
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        links.push({ text: rawText.trim() || 'Link', url: clean, type });
      }
    };

    // 1. Markdown Links [text](url)
    const mdRegex = /\[([^\]]*)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g;
    let match;
    while ((match = mdRegex.exec(text)) !== null) {
      addLink(match[2], match[1], 'markdown');
    }

    // 2. HTML Anchor Links <a href="...">text</a>
    const htmlRegex = /<a\s+[^>]*href=["']((?:https?:\/\/|\/)[^"']+)["'][^>]*>(.*?)<\/a>/gi;
    while ((match = htmlRegex.exec(text)) !== null) {
      const linkText = match[2].replace(/<[^>]+>/g, '').trim();
      addLink(match[1], linkText, 'html');
    }

    // 3. Data-href / href / url attributes in HTML or JSON
    const dataRegex =
      /(?:data-href|href|url|link|path)["']?\s*[:=]\s*["']((?:https?:\/\/|\/)[^"'\s>]+)["']/gi;
    while ((match = dataRegex.exec(text)) !== null) {
      addLink(match[1], 'Detail Link', 'data');
    }

    // 4. Raw detail path URLs in text
    const pathRegex =
      /\/(?:internship|job|competition|hackathon|fellowship|opportunity|o)\/[\w-]+-\d+/gi;
    while ((match = pathRegex.exec(text)) !== null) {
      addLink(match[0], 'Opportunity Detail', 'raw');
    }

    return links;
  }

  /**
   * Scores discovered links using Step 3 Candidate scoring rules (Fix 5).
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

    const classification = this.classifyUrl(urlStr);
    if (classification === 'JOB_DETAIL') {
      score += 100;
      reasons.push('+100 Classified as JOB_DETAIL');
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
    if (
      urlLower.includes('/apply') ||
      textLower.includes('apply') ||
      textLower.includes('register')
    ) {
      score += 80;
      reasons.push('+80 Apply/Register link');
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

    // Fix 5: Penalties
    if (urlLower.includes('/company/')) {
      score -= 50;
      reasons.push('-50 Company page link');
    }

    if (urlLower.includes('/user/') || urlLower.includes('/profile/') || urlLower.includes('/u/')) {
      score -= 50;
      reasons.push('-50 User profile link');
    }

    if (
      urlLower.includes('/student-internships') ||
      urlLower.includes('/online-internships') ||
      urlLower.includes('/engineering-internships') ||
      urlLower.includes('/all-internships') ||
      urlLower.includes('/jobs-in-') ||
      urlLower.includes('/categories')
    ) {
      score -= 100;
      reasons.push('-100 Directory/Category link');
    }

    if (
      urlLower.includes('facebook.com') ||
      urlLower.includes('twitter.com') ||
      urlLower.includes('whatsapp')
    ) {
      score -= 50;
      reasons.push('-50 Share link');
    }

    if (
      urlLower.includes('/navigation') ||
      urlLower.includes('/login') ||
      urlLower.includes('/register-user') ||
      urlLower.includes('/about') ||
      urlLower.includes('/contact')
    ) {
      score -= 100;
      reasons.push('-100 Navigation link');
    }

    return { score, reasons };
  }

  /**
   * Classifies url to enforce only queueing real opportunity pages.
   */
  public static classifyUrl(
    urlStr: string,
  ): 'JOB_DETAIL' | 'COMPANY_JOBS_PAGE' | 'LISTING_PAGE' | 'SEARCH_PAGE' | 'UNKNOWN' {
    if (this.isAssetUrl(urlStr)) {
      return 'UNKNOWN';
    }

    try {
      const url = new URL(urlStr);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();
      const search = url.search.toLowerCase();

      // Check pagination patterns -> LISTING_PAGE
      const hasPageParam =
        url.searchParams.has('page') ||
        url.searchParams.has('p') ||
        url.searchParams.has('start') ||
        url.searchParams.has('pg') ||
        path.includes('/page/') ||
        path.includes('/p/');
      if (hasPageParam) {
        return 'LISTING_PAGE';
      }

      // Check search parameters -> SEARCH_PAGE
      if (
        url.searchParams.has('q') ||
        url.searchParams.has('query') ||
        url.searchParams.has('search') ||
        path.includes('/search')
      ) {
        return 'SEARCH_PAGE';
      }

      // Fix 4: Explicit Unstop Directory exclusions -> LISTING_PAGE
      if (host.includes('unstop.com')) {
        const directoryRegex =
          /\/(student-internships|online-internships|engineering-internships|all-internships|internships|jobs|competitions|hackathons|fellowships|scholarships)\/?$/i;
        if (directoryRegex.test(path)) {
          return 'LISTING_PAGE';
        }
      }

      // Check filters & directory parameters -> LISTING_PAGE
      if (
        url.searchParams.has('loc') ||
        url.searchParams.has('radius') ||
        url.searchParams.has('fromage') ||
        url.searchParams.has('fromAge') ||
        url.searchParams.has('usertype') ||
        url.searchParams.has('domain') ||
        url.searchParams.has('oppstatus') ||
        url.searchParams.has('opportunity_type') ||
        url.searchParams.has('category') ||
        url.searchParams.has('specialization') ||
        path.includes('/filter/') ||
        path.includes('/filters/') ||
        path.includes('/student-internships')
      ) {
        return 'LISTING_PAGE';
      }

      // Check categories -> LISTING_PAGE
      if (
        path.includes('/category/') ||
        path.includes('/categories/') ||
        path.includes('/tag/') ||
        path.includes('/tags/')
      ) {
        return 'LISTING_PAGE';
      }

      // Glassdoor Company Jobs Pages
      if (host.includes('glassdoor.co')) {
        if (path.match(/\/jobs\/[\w-]+-e\d+/i) || path.match(/-jobs-e\d+/i)) {
          return 'COMPANY_JOBS_PAGE';
        }
      }

      // Indeed Company Jobs Pages
      if (host.includes('indeed.com')) {
        if (path.includes('/cmp/') && (path.includes('/jobs') || path.includes('/about'))) {
          return 'COMPANY_JOBS_PAGE';
        }
      }

      // Unstop Company Jobs Pages
      if (host.includes('unstop.com')) {
        if (path.includes('/company/') && path.includes('/jobs')) {
          return 'COMPANY_JOBS_PAGE';
        }
      }

      // Generic Company Jobs Pages
      if (path.includes('/company/') && (path.includes('/jobs') || path.includes('/careers'))) {
        return 'COMPANY_JOBS_PAGE';
      }

      // 1. Domain-specific pattern checks: Check listings BEFORE details
      for (const [domainKey, patterns] of Object.entries(this.DOMAIN_PATTERNS)) {
        if (host.includes(domainKey)) {
          // Check listing patterns first to catch search/directory pages
          for (const rx of patterns.listings) {
            if (rx.test(path)) {
              return 'LISTING_PAGE';
            }
          }
          // Check detail patterns
          for (const rx of patterns.details) {
            if (rx.test(path) || rx.test(url.pathname + url.search)) {
              return 'JOB_DETAIL';
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

          return 'LISTING_PAGE';
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
        return 'LISTING_PAGE';
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
      return true; // Any non-JOB_DETAIL page on a known job board is by definition a listing board
    }

    // Heuristics: require multiple strong signals
    const links = this.extractAllLinks(markdown, url);

    let jobUrlCount = 0;
    for (const l of links) {
      if (this.classifyUrl(l.url) === 'JOB_DETAIL') {
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
   * Intelligent card block divider matching both multi-line cards and list-view single-line cards.
   */
  public static splitIntoCardBlocks(markdown: string, baseUrl?: string): string[] {
    if (!markdown) return [];

    // Intercept Unstop listing pages with domain-specific adapter
    if (baseUrl && baseUrl.includes('unstop.com')) {
      const unstopBlocks = UnstopAdapter.splitIntoCardBlocks(markdown, baseUrl);
      if (unstopBlocks.length > 0) {
        return unstopBlocks;
      }
    }

    const lines = markdown.split('\n');
    const rawBlocks: string[] = [];
    let currentBlock: string[] = [];
    let currentDetailUrl: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        if (currentBlock.length > 0) {
          rawBlocks.push(currentBlock.join('\n'));
          currentBlock = [];
          currentDetailUrl = null;
        }
        continue;
      }

      const lineLinks = this.extractAllLinks(trimmed, baseUrl);
      let lineDetailUrl: string | null = null;
      for (const link of lineLinks) {
        const clean = this.cleanUrl(link.url);
        if (this.classifyUrl(clean) === 'JOB_DETAIL') {
          lineDetailUrl = clean;
          break;
        }
      }

      const isHeader = /^#{1,4}\s+/.test(trimmed) || /^<h[1-4]/i.test(trimmed);

      if ((lineDetailUrl || isHeader) && currentBlock.length > 0) {
        if (currentDetailUrl && lineDetailUrl && currentDetailUrl !== lineDetailUrl) {
          rawBlocks.push(currentBlock.join('\n'));
          currentBlock = [trimmed];
          currentDetailUrl = lineDetailUrl;
        } else if (isHeader) {
          rawBlocks.push(currentBlock.join('\n'));
          currentBlock = [trimmed];
          currentDetailUrl = lineDetailUrl;
        } else {
          currentBlock.push(trimmed);
          if (!currentDetailUrl) currentDetailUrl = lineDetailUrl;
        }
      } else {
        currentBlock.push(trimmed);
        if (!currentDetailUrl && lineDetailUrl) currentDetailUrl = lineDetailUrl;
      }
    }

    if (currentBlock.length > 0) {
      rawBlocks.push(currentBlock.join('\n'));
    }

    // Filter using isOpportunityCardBlock (Fix 1 & Fix 2)
    const validCards = rawBlocks.filter((b) => this.isOpportunityCardBlock(b, baseUrl));
    if (validCards.length > 0) {
      return validCards;
    }

    // Fallback if isOpportunityCardBlock was too strict: return non-UI blocks > 20 chars
    return rawBlocks.filter((b) => !this.isUiComponentBlock(b, baseUrl) && b.length > 20);
  }

  /**
   * Extracts list of opportunities from job board page markdown using Card-Based Resolution.
   */
  public static extractListings(markdown: string, url: string): ExtractedListing[] {
    // Intercept Unstop listing pages with domain-specific adapter
    if (url && url.includes('unstop.com')) {
      const unstopListings = UnstopAdapter.extractListings(markdown, url);
      if (unstopListings.length > 0) {
        return unstopListings;
      }
    }

    const listings: ExtractedListing[] = [];
    const seenUrls = new Set<string>();
    const sourceDomain = this.getBoardIdentifier(url);

    let cardsFound = 0;
    let cardsSuccessfullyResolved = 0;
    let cardsMissingDestination = 0;
    let totalLinksFound = 0;
    let totalCandidateUrlsFound = 0;

    const resolvedLogs: string[] = [];
    const unresolvedLogs: string[] = [];

    let hasHydrationJSON = false;
    const jsonMatches = markdown.match(/(__NEXT_DATA__|__INITIAL_STATE__)\s*=\s*(\{.*?\});/g) || [];
    for (const jsonMatch of jsonMatches) {
      try {
        const jsonStr = jsonMatch.substring(jsonMatch.indexOf('{'));
        const data = JSON.parse(jsonStr);
        if (data.props || data.state) {
          hasHydrationJSON = true;
        }
      } catch {
        // Ignored
      }
    }

    const cardBlocks = this.splitIntoCardBlocks(markdown, url);

    for (let cardIdx = 0; cardIdx < cardBlocks.length; cardIdx++) {
      const cardBlock = cardBlocks[cardIdx];
      const pLinks = this.extractAllLinks(cardBlock, url);

      if (pLinks.length === 0) continue;

      cardsFound++;
      totalLinksFound += pLinks.length;

      const scoredLinks = pLinks.map((link) => {
        let cleanUrlStr = link.url;
        try {
          cleanUrlStr = this.cleanUrl(link.url);
        } catch {
          // Ignored
        }

        const classification = this.classifyUrl(cleanUrlStr);
        const scoring = this.scoreCandidateLink(cleanUrlStr, link.text, cardBlock);

        return {
          url: cleanUrlStr,
          text: link.text,
          classification,
          score: scoring.score,
          reasons: scoring.reasons,
        };
      });

      // Filter to match BOTH JOB_DETAIL and COMPANY_JOBS_PAGE so they can be recursively harvested
      const candidateUrls = scoredLinks.filter(
        (l) => l.classification === 'JOB_DETAIL' || l.classification === 'COMPANY_JOBS_PAGE',
      );
      totalCandidateUrlsFound += candidateUrls.length;

      // Fix 6: Detailed diagnostic per card
      const cardTitle =
        pLinks
          .map((l) => l.text)
          .find(
            (t) =>
              t &&
              t !== 'Link' &&
              t !== 'Detail Link' &&
              t !== 'Opportunity Detail' &&
              t.length > 3,
          ) || 'Opportunity Listing';

      const diagLines: string[] = [];
      diagLines.push(`Card ${cardsFound}`);
      diagLines.push(`Title:\n${cardTitle}`);
      diagLines.push(`Links Found:\n${scoredLinks.length}`);

      for (let i = 0; i < scoredLinks.length; i++) {
        const l = scoredLinks[i];
        let rejectionReason = '';
        if (l.classification === 'JOB_DETAIL') {
          rejectionReason = 'Accepted';
        } else if (
          l.classification === 'LISTING_PAGE' ||
          l.url.includes('student-internships') ||
          l.url.includes('all-internships')
        ) {
          rejectionReason = 'Rejected:\nDirectory';
        } else if (
          l.url.includes('/navigation') ||
          l.url.includes('/login') ||
          l.url.includes('/about')
        ) {
          rejectionReason = 'Rejected:\nNavigation';
        } else if (l.url.includes('/company/')) {
          rejectionReason = 'Rejected:\nCompany page';
        } else {
          rejectionReason = `Rejected:\n${l.classification}`;
        }

        diagLines.push(`Link ${i + 1}\n${l.url}\n${rejectionReason}`);
      }

      if (candidateUrls.length > 0) {
        const bestCandidate = candidateUrls.sort((a, b) => b.score - a.score)[0];
        cardsSuccessfullyResolved++;

        const cleanUrlLower = bestCandidate.url.toLowerCase();
        if (!seenUrls.has(cleanUrlLower)) {
          seenUrls.add(cleanUrlLower);
          listings.push({
            title: bestCandidate.text || 'Opportunity Listing',
            company: sourceDomain.split('.')[0],
            listingUrl: bestCandidate.url,
            location: 'Remote',
            source: sourceDomain,
          });
        }

        resolvedLogs.push(diagLines.join('\n'));
      } else {
        cardsMissingDestination++;
        unresolvedLogs.push(diagLines.join('\n'));
      }
    }

    const avgLinksPerCard =
      cardsFound > 0 ? Math.round((totalLinksFound / cardsFound) * 10) / 10 : 0;
    const avgCandidatesPerCard =
      cardsFound > 0 ? Math.round((totalCandidateUrlsFound / cardsFound) * 10) / 10 : 0;

    console.log(`
Platform:                        ${sourceDomain}
Cards Found:                     ${cardsFound}
Cards Successfully Resolved:     ${cardsSuccessfullyResolved}
Cards Missing Destination:       ${cardsMissingDestination}
Average Links Per Card:          ${avgLinksPerCard}
Average Candidate URLs Per Card: ${avgCandidatesPerCard}

Resolved Cards Detail:
--------------------------------
${resolvedLogs.slice(0, 5).join('\n---\n') || 'None'}

Unresolved Cards Detail:
--------------------------------
${unresolvedLogs.slice(0, 5).join('\n---\n') || 'None'}
`);

    if (listings.length === 0) {
      console.log(`No opportunity detail pages discovered.`);
    }

    return listings.slice(0, this.MAX_LISTINGS_PER_BOARD_PAGE);
  }
}

export class UnstopAdapter {
  /**
   * Restructures Unstop concatenated markdown cards using the pattern [**Title**...](URL).
   */
  public static splitIntoCardBlocks(markdown: string, baseUrl?: string): string[] {
    const blocks: string[] = [];
    const regex = /\[\*\*([^*]+)\*\*([\s\S]*?)\]\(((?:https?:\/\/unstop\.com|\/)[^)]+)\)/g;
    let match;
    while ((match = regex.exec(markdown)) !== null) {
      const title = match[1].trim();
      const body = match[2];
      const url = match[3].trim();
      blocks.push(`### [${title}](${url})\n${body}`);
    }
    return blocks;
  }

  /**
   * Deterministic Unstop opportunities extractor.
   */
  public static extractListings(markdown: string, url: string): ExtractedListing[] {
    const listings: ExtractedListing[] = [];
    const seenUrls = new Set<string>();
    const sourceDomain = JobBoardExtractor.getBoardIdentifier(url);

    const cards = this.splitIntoCardBlocks(markdown, url);
    let cardsFound = 0;
    let cardsSuccessfullyResolved = 0;
    let cardsMissingDestination = 0;

    const resolvedLogs: string[] = [];
    const unresolvedLogs: string[] = [];

    for (const card of cards) {
      const match = card.match(/^###\s+\[([^\]]+)\]\(([^)]+)\)/);
      if (!match) continue;

      cardsFound++;
      const title = match[1].trim();
      let rawUrl = match[2].trim();

      if (rawUrl.startsWith('/') && url) {
        try {
          rawUrl = new URL(rawUrl, url).toString();
        } catch {
          // Ignored
        }
      }

      const cleanUrl = JobBoardExtractor.cleanUrl(rawUrl);
      const classification = JobBoardExtractor.classifyUrl(cleanUrl);
      const isDetailUrl = classification === 'JOB_DETAIL';

      const diagLines: string[] = [];
      diagLines.push(`Card ${cardsFound}`);
      diagLines.push(`Title:\n${title}`);
      diagLines.push(`Links Found:\n1`);
      diagLines.push(
        `  Link 1: ${cleanUrl} -> ${isDetailUrl ? 'Accepted' : 'Rejected:\nDirectory'}`,
      );

      if (isDetailUrl) {
        cardsSuccessfullyResolved++;
        const cleanUrlLower = cleanUrl.toLowerCase();
        if (!seenUrls.has(cleanUrlLower)) {
          seenUrls.add(cleanUrlLower);

          const bodyLines = card
            .split('\n')
            .slice(1)
            .map((l) => l.replace(/\\/g, '').trim())
            .filter(Boolean);
          const company = bodyLines[0] || 'Unstop Partner';

          listings.push({
            title,
            company,
            listingUrl: cleanUrl,
            location: 'Remote',
            source: sourceDomain,
          });
        }
        resolvedLogs.push(diagLines.join('\n'));
      } else {
        cardsMissingDestination++;
        unresolvedLogs.push(diagLines.join('\n'));
      }
    }

    console.log(`
Platform:                        ${sourceDomain}
Cards Found:                     ${cardsFound}
Cards Successfully Resolved:     ${cardsSuccessfullyResolved}
Cards Missing Destination:       ${cardsMissingDestination}
Average Links Per Card:          1
Average Candidate URLs Per Card: 1

Resolved Cards Detail:
--------------------------------
${resolvedLogs.slice(0, 5).join('\n---\n') || 'None'}

Unresolved Cards Detail:
--------------------------------
${unresolvedLogs.slice(0, 5).join('\n---\n') || 'None'}
`);

    return listings;
  }
}

export default JobBoardExtractor;
