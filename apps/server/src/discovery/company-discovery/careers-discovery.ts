import { ATSDetector } from './ats-detector';
import { ATSProvider } from './company.types';
import { normalizeHost } from './ecosystem-config';

/**
 * Deterministic careers-page discovery.
 *
 * Given a company website, predicts the careers URL from a fixed set of
 * candidate paths, optionally probing the homepage HTML (footer/navbar/sitemap/
 * robots.txt) to confirm. No LLM. Prefers official company domains over
 * third-party listings.
 */

export const CAREER_PATHS = [
  '/careers',
  '/career',
  '/jobs',
  '/job',
  '/join-us',
  '/join',
  '/work-with-us',
  '/work-at',
  '/openings',
  '/opening',
  '/we-are-hiring',
  '/hiring',
  '/life',
  '/team',
  '/about/careers',
  '/company/careers',
  '/en/careers',
];

export const CAREER_KEYWORDS = [
  'career',
  'careers',
  'job',
  'jobs',
  'join',
  'hiring',
  'opening',
  'openings',
  'work with us',
  'work at',
  'vacancy',
  'vacancies',
  'emplo',
];

export const THIRD_PARTY_CAREER_DOMAINS = [
  'linkedin.com',
  'wellfound.com',
  'angel.co',
  'indeed.com',
  'naukri.com',
  'internshala.com',
  'glassdoor.com',
  'lever.co',
  'greenhouse.io',
  'ashbyhq.com',
  'workable.com',
  'smartrecruiters.com',
];

export interface CareersDiscoveryResult {
  careersUrl: string | null;
  ats: ATSProvider;
  /** True when the result came from a confirmed probe rather than a guess. */
  confirmed: boolean;
  source: 'PROBE' | 'INFERRED' | 'ATS_HOST';
}

/**
 * Builds deterministic candidate careers URLs from a homepage.
 */
export function buildCareerCandidates(homepage: string): string[] {
  const base = homepage.replace(/\/+$/, '');
  return CAREER_PATHS.map((p) => `${base}${p}`);
}

/**
 * Extracts hrefs from raw HTML that look like career pages.
 */
export function extractCareerLinks(html: string, homepage: string): string[] {
  const base = homepage.replace(/\/+$/, '');
  const host = normalizeHost(homepage);
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
  const links = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(html)) !== null) {
    const raw = match[1];
    const lower = raw.toLowerCase();
    if (!CAREER_KEYWORDS.some((kw) => lower.includes(kw))) continue;

    let absolute = raw;
    if (raw.startsWith('//')) {
      absolute = 'https:' + raw;
    } else if (raw.startsWith('/')) {
      absolute = `${base}${raw}`;
    } else if (!/^https?:\/\//i.test(raw)) {
      absolute = `${base}/${raw}`;
    }

    try {
      const parsed = new URL(absolute);
      // Only keep links on the official domain.
      if (parsed.hostname.toLowerCase().replace(/^www\./, '') === host) {
        links.add(parsed.toString().replace(/\/+$/, ''));
      }
    } catch {
      // ignore malformed
    }
  }

  return Array.from(links);
}

/**
 * Deterministic discovery: always returns an inferred careers URL, and if an
 * HTML body is provided, confirms/overrides via link extraction and ATS hints.
 */
export function discoverCareers(
  homepage: string,
  html?: string,
  knownAts?: ATSProvider,
): CareersDiscoveryResult {
  // 1. If a known ATS is supplied, prefer the hosted ATS board.
  if (knownAts && knownAts !== 'UNKNOWN') {
    return {
      careersUrl: null,
      ats: knownAts,
      confirmed: true,
      source: 'ATS_HOST',
    };
  }

  // 2. Probe HTML if available.
  if (html && html.length > 0) {
    const ats = ATSDetector.detect(html);
    const links = extractCareerLinks(html, homepage);
    if (links.length > 0) {
      return {
        careersUrl: links[0],
        ats,
        confirmed: true,
        source: 'PROBE',
      };
    }
  }

  // 3. Deterministic inference (official domain preferred).
  const candidates = buildCareerCandidates(homepage);
  return {
    careersUrl: candidates[0],
    ats: 'UNKNOWN',
    confirmed: false,
    source: 'INFERRED',
  };
}

/**
 * Page categories that disqualify a URL as a real career page.
 */
export const JUNK_PAGE_KEYWORDS = [
  'log in',
  'sign in',
  'sign up',
  'register',
  'privacy policy',
  'terms of service',
  'terms & conditions',
  'cookie',
  'page not found',
  '404',
  'access denied',
  'checkout',
  'cart',
  'subscribe',
  'newsletter',
  'blog',
  'press release',
  'contact us',
  'about us',
  'our team',
  'marketing',
];

export const HIRING_KEYWORDS = [
  'career',
  'careers',
  'job',
  'jobs',
  'intern',
  'internship',
  'internships',
  'hiring',
  'openings',
  'opening',
  'vacancy',
  'vacancies',
  'apply',
  'we are hiring',
  "we're hiring",
  'work with us',
  'join our team',
  'join us',
];

export interface CareerPageVerification {
  verified: boolean;
  httpStatus: number;
  title: string;
  reason?: string;
}

/**
 * Deterministic career-page validation via HTTP probe (no LLM).
 *
 * Accepts a page only when HTTP 2xx, has a non-empty title, the title/body
 * contains hiring keywords, and it is not a login/marketing/blog/privacy/404.
 * Failures return verified=false.
 */
export async function verifyCareerPage(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CareerPageVerification> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'ScoutCompanyDiscovery/1.0' },
    });
    clearTimeout(timeout);

    const status = response.status;
    if (status < 200 || status >= 300) {
      return { verified: false, httpStatus: status, title: '', reason: `HTTP ${status}` };
    }

    const body = await response.text();
    const titleMatch = body.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = (titleMatch ? titleMatch[1] : '').trim();
    const lowerTitle = title.toLowerCase();
    const lowerBody = body.toLowerCase();

    const isJunk = JUNK_PAGE_KEYWORDS.some(
      (kw) => lowerTitle.includes(kw) || lowerBody.includes(kw),
    );
    if (isJunk) {
      return {
        verified: false,
        httpStatus: status,
        title,
        reason: 'Page classified as login/marketing/blog/privacy/junk',
      };
    }

    if (!title) {
      return { verified: false, httpStatus: status, title, reason: 'Missing page title' };
    }

    const hasHiring = HIRING_KEYWORDS.some(
      (kw) => lowerTitle.includes(kw) || lowerBody.includes(kw),
    );
    if (!hasHiring) {
      return {
        verified: false,
        httpStatus: status,
        title,
        reason: 'No hiring keywords detected',
      };
    }

    return { verified: true, httpStatus: status, title };
  } catch {
    return { verified: false, httpStatus: 0, title: '', reason: 'Network/parse error' };
  }
}
