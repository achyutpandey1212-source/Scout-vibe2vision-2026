export interface DetectionResult {
  shouldExtract: boolean;
  confidence: number;
  reasons: string[];
  penalties: string[];
}

const POSITIVE_KEYWORDS = [
  'apply',
  'internship',
  'scholarship',
  'fellowship',
  'competition',
  'hackathon',
  'registration',
  'deadline',
  'eligibility',
  'stipend',
  'salary',
  'recruitment',
  'duration',
  'program',
];

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
   */
  static detect(url: string, title: string, markdown: string): DetectionResult {
    const reasons: string[] = [];
    const penalties: string[] = [];
    let score = 0;

    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const markdownLower = markdown.toLowerCase();

    // 1. Evaluate URL Positive/Negative Signals (Weight: 20%)
    const urlPositiveTerms = [
      'career',
      'intern',
      'job',
      'scholar',
      'fellow',
      'apply',
      'opportunity',
    ];
    const urlNegativeTerms = [
      'login',
      'signup',
      'feed',
      'terms',
      'privacy',
      'blog',
      'news',
      'faq',
      'support',
    ];

    urlPositiveTerms.forEach((term) => {
      if (urlLower.includes(term)) {
        score += 10;
        reasons.push(`Positive term in URL: "${term}"`);
      }
    });

    urlNegativeTerms.forEach((term) => {
      if (urlLower.includes(term)) {
        score -= 15;
        penalties.push(`Negative path route: "${term}"`);
      }
    });

    // 2. Evaluate Meta & Title Signals (Weight: 20%)
    POSITIVE_KEYWORDS.forEach((term) => {
      if (titleLower.includes(term)) {
        score += 15;
        reasons.push(`Positive term in Title: "${term}"`);
      }
    });

    NEGATIVE_KEYWORDS.forEach((term) => {
      if (titleLower.includes(term)) {
        score -= 20;
        penalties.push(`Boilerplate phrase in Title: "${term}"`);
      }
    });

    // 3. Evaluate Heading Structure (Weight: 30%)
    // Find headings inside Markdown (lines starting with #)
    const lines = markdown.split('\n');
    const headings = lines
      .filter((line) => line.trim().startsWith('#'))
      .map((line) => line.toLowerCase());

    POSITIVE_HEADINGS.forEach((headingTerm) => {
      const match = headings.some((h) => h.includes(headingTerm));
      if (match) {
        score += 20;
        reasons.push(`Key opportunity heading found: "${headingTerm}"`);
      }
    });

    // 4. Content Keyword Frequency Analysis (Weight: 30%)
    let positiveHits = 0;
    POSITIVE_KEYWORDS.forEach((term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = markdownLower.match(regex);
      if (matches && matches.length > 0) {
        positiveHits++;
        score += Math.min(matches.length * 4, 12); // score based on density cap
      }
    });

    if (positiveHits > 0) {
      reasons.push(`Keyword match frequency density: ${positiveHits} unique matching terms`);
    } else {
      score -= 20;
      penalties.push('Zero opportunity-focused keywords detected in page body');
    }

    NEGATIVE_KEYWORDS.forEach((term) => {
      if (markdownLower.includes(term)) {
        score -= 3;
        penalties.push(`Boilerplate body keyword matched: "${term}"`);
      }
    });

    // Normalize confidence bounds between 0 and 100
    const confidence = Math.max(0, Math.min(100, score));

    // Resolve configured threshold from environment
    const envThreshold = process.env.DISCOVERY_DETECTOR_THRESHOLD;
    const threshold = envThreshold ? parseInt(envThreshold, 10) : 25;

    const shouldExtract = confidence >= threshold;

    return {
      shouldExtract,
      confidence,
      reasons,
      penalties,
    };
  }
}
