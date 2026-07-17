export interface DetectionResult {
  shouldExtract: boolean;
  confidence: number;
  reasons: string[];
  penalties: string[];
}

// Rewarded positive terms (Strong Signals)
const STRONG_KEYWORDS = [
  'apply',
  'apply now',
  'register',
  'vacancy',
  'internship',
  'fellowship',
  'scholarship',
  'position',
  'job id',
  'requisition id',
  'application deadline',
  'submit application',
];

// Deprecated or weak signals we want to penalize or ignore to reduce false positives
const WEAK_KEYWORDS = ['career', 'program', 'opportunity', 'requirements'];

const NEGATIVE_KEYWORDS = [
  'privacy policy',
  'terms of service',
  'cookie policy',
  'all rights reserved',
  'documentation',
  'contact us',
  'about us',
  'sign in',
  'login',
];

const POSITIVE_HEADINGS = [
  'eligibility',
  'requirements',
  'qualifications',
  'how to apply',
  'benefits',
  'about the program',
  'selection process',
];

export class OpportunityDetector {
  /**
   * Evaluates a crawled page's content deterministically to score opportunity likelihood.
   * Hardened weights in Stage 4.1 to reduce informational article crawls.
   */
  static detect(
    url: string,
    title: string,
    markdown: string,
    categories?: string[],
  ): DetectionResult {
    const reasons: string[] = [];
    const penalties: string[] = [];
    let score = 0;

    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const markdownLower = markdown.toLowerCase();

    // ── Pre-Filter: Static Non-HTML Attachments ──
    const fileExtensions = [
      '.pdf',
      '.zip',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.png',
      '.jpg',
      '.jpeg',
    ];
    const matchedExtension = fileExtensions.find((ext) => urlLower.split('?')[0].endsWith(ext));
    if (matchedExtension) {
      score -= 80;
      penalties.push(`Forbidden static file extension in URL: "${matchedExtension}"`);
    }

    // ── Pre-Filter: Index Lists & Navigation Hubs ──
    const cleanPath = urlLower.replace(/^https?:\/\/[^/]+/, '');
    const isRootOrNearRoot =
      cleanPath.length <= 1 || cleanPath === '/index.html' || cleanPath === '/index.php';
    if (isRootOrNearRoot) {
      score -= 30; // Increased penalty for homepages
      penalties.push('Root homepage or generic index path detected');
    }

    const pathJunkTerms = [
      'faq',
      'blog',
      'news',
      'press',
      'watch',
      'search',
      'category',
      'archive',
      'help',
      'support',
      'terms',
      'privacy',
      'cookie',
      'login',
      'signup',
      'dashboard',
      'about',
      'contact',
      'documentation',
      'docs',
    ];
    pathJunkTerms.forEach((term) => {
      if (urlLower.includes(`/${term}`) || urlLower.includes(`?${term}`)) {
        score -= 35; // Increased penalty for blogs, support, docs
        penalties.push(`Noise path query pattern matched: "${term}"`);
      }
    });

    // 1. URL Path Checks (Weight: 20%)
    const urlPositiveTerms = ['intern', 'job', 'scholar', 'fellow', 'apply'];
    urlPositiveTerms.forEach((term) => {
      if (urlLower.includes(term)) {
        score += 20;
        reasons.push(`Positive term in URL: "${term}"`);
      }
    });

    // 2. Evaluate Meta & Title Signals (Weight: 25%)
    // Reward Strong Signal Keywords
    STRONG_KEYWORDS.forEach((term) => {
      if (titleLower.includes(term)) {
        score += 25;
        reasons.push(`Strong opportunity keyword in Title: "${term}"`);
      }
    });

    // Penalize Weak Keywords if they are the only signal
    WEAK_KEYWORDS.forEach((term) => {
      if (titleLower.includes(term)) {
        score -= 10;
        penalties.push(`Weak keyword match in Title: "${term}"`);
      }
    });

    NEGATIVE_KEYWORDS.forEach((term) => {
      if (titleLower.includes(term)) {
        score -= 30;
        penalties.push(`Boilerplate phrase in Title: "${term}"`);
      }
    });

    // 3. Evaluate Heading Structure (Weight: 25%)
    const lines = markdown.split('\n');
    const headings = lines
      .filter((line) => line.trim().startsWith('#'))
      .map((line) => line.toLowerCase());

    POSITIVE_HEADINGS.forEach((headingTerm) => {
      const match = headings.some((h) => h.includes(headingTerm));
      if (match) {
        score += 25;
        reasons.push(`Key opportunity heading found: "${headingTerm}"`);
      }
    });

    // 4. Content Keyword Frequency Analysis (Weight: 30%)
    let positiveHits = 0;
    STRONG_KEYWORDS.forEach((term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = markdownLower.match(regex);
      if (matches && matches.length > 0) {
        positiveHits++;
        score += Math.min(matches.length * 5, 20); // reward strong matches up to 20 cap
      }
    });

    // Weak keywords check: don't score, only penalty if zero strong matches
    let weakHits = 0;
    WEAK_KEYWORDS.forEach((term) => {
      if (markdownLower.includes(term)) {
        weakHits++;
      }
    });

    if (positiveHits > 0) {
      reasons.push(`Strong keyword matches: ${positiveHits} unique matching terms`);
    } else {
      score -= 30;
      penalties.push('Zero strong opportunity-focused keywords detected in page body');

      // If we found weak keywords but zero strong ones, add minor penalty
      if (weakHits > 0) {
        score -= 10;
        penalties.push(`Contains only weak contextual keywords: ${weakHits} hits`);
      }
    }

    NEGATIVE_KEYWORDS.forEach((term) => {
      if (markdownLower.includes(term)) {
        score -= 5;
        penalties.push(`Boilerplate body keyword matched: "${term}"`);
      }
    });

    // ── Category-Aware Filtering & Penalties (PR5.5) ──
    if (categories && categories.length > 0) {
      const isInternshipRun =
        categories.includes('INTERNSHIPS') || categories.includes('STARTUP_INTERNSHIPS');
      const hasExperiencedTerm =
        titleLower.includes('senior') ||
        titleLower.includes('staff') ||
        titleLower.includes('principal') ||
        titleLower.includes('lead') ||
        titleLower.includes('architect') ||
        titleLower.includes('director') ||
        titleLower.includes('manager') ||
        titleLower.includes('vp') ||
        titleLower.includes('experienced') ||
        titleLower.includes('mid-career') ||
        titleLower.includes('lateral') ||
        titleLower.includes('returnship') ||
        titleLower.includes('return-to-work');
      const hasInternTerm =
        titleLower.includes('intern') ||
        titleLower.includes('internship') ||
        titleLower.includes('co-op') ||
        titleLower.includes('trainee');

      if (isInternshipRun && hasExperiencedTerm && !hasInternTerm) {
        score -= 60;
        penalties.push(
          'Contains experienced hire/senior keywords in title without intern keywords',
        );
      }

      if (categories.includes('STARTUP_INTERNSHIPS')) {
        const isNonStartupDomain =
          urlLower.includes('.gov.in') ||
          urlLower.includes('.nic.in') ||
          urlLower.includes('.edu') ||
          urlLower.includes('.ac.in') ||
          urlLower.includes('google.com') ||
          urlLower.includes('microsoft.com') ||
          urlLower.includes('amazon.in') ||
          urlLower.includes('amazon.com') ||
          urlLower.includes('oracle.com');
        if (isNonStartupDomain) {
          score -= 40;
          penalties.push(
            'Non-startup government/university/corporate domain for Startup Internship run',
          );
        }
      }

      if (categories.includes('GOVERNMENT_INTERNSHIP')) {
        const isGov =
          urlLower.includes('.gov.in') ||
          urlLower.includes('.nic.in') ||
          titleLower.includes('government') ||
          titleLower.includes('ministry') ||
          titleLower.includes('national');
        if (!isGov) {
          score -= 40;
          penalties.push('Non-government domain/title for Government Internship run');
        }
      }

      if (categories.includes('RESEARCH_INTERNSHIP')) {
        const isResearch =
          urlLower.includes('.edu') ||
          urlLower.includes('.ac.in') ||
          urlLower.includes('research') ||
          titleLower.includes('research') ||
          titleLower.includes('lab') ||
          titleLower.includes('scientific');
        if (!isResearch) {
          score -= 40;
          penalties.push('Non-academic/non-research domain for Research Internship run');
        }
      }
    }

    // Normalize confidence bounds between 0 and 100
    const confidence = Math.max(0, Math.min(100, score));

    // Resolve configured threshold from environment
    const envThreshold = process.env.DISCOVERY_DETECTOR_THRESHOLD;
    const threshold = envThreshold ? parseInt(envThreshold, 10) : 40; // Raised default threshold from 35 to 40 for higher precision

    const shouldExtract = confidence >= threshold;

    return {
      shouldExtract,
      confidence,
      reasons,
      penalties,
    };
  }
}
