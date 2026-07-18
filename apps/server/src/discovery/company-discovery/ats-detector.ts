import { ATSProvider } from './company.types';

/**
 * Deterministic ATS detector.
 *
 * Recognizes applicant-tracking-system providers from URLs and HTML snippets.
 * No LLM. Pure rule matching against known ATS host patterns and embeds.
 */

interface ATSFingerprint {
  provider: ATSProvider;
  /** Substrings that, when present in a host, indicate this ATS. */
  hosts: string[];
  /** Path/substring markers in any URL or HTML body. */
  markers: string[];
}

export const ATS_FINGERPRINTS: ATSFingerprint[] = [
  {
    provider: 'Greenhouse',
    hosts: ['boards.greenhouse.io', 'greenhouse.io'],
    markers: ['greenhouse.io', 'gh_jid', 'data-gh-id', 'apply.greenhouse'],
  },
  {
    provider: 'Lever',
    hosts: ['jobs.lever.co', 'lever.co'],
    markers: ['jobs.lever.co', 'lever.co', 'data-lever', 'lever-postings'],
  },
  {
    provider: 'Ashby',
    hosts: ['jobs.ashbyhq.com', 'ashbyhq.com'],
    markers: ['jobs.ashbyhq.com', 'ashbyhq.com', 'ashby.co', 'data-ashby'],
  },
  {
    provider: 'Workable',
    hosts: ['apply.workable.com', 'workable.com'],
    markers: ['apply.workable.com', 'workable.com/jobs', 'wj_', 'workable_job'],
  },
  {
    provider: 'SmartRecruiters',
    hosts: ['jobs.smartrecruiters.com', 'smartrecruiters.com'],
    markers: ['jobs.smartrecruiters.com', 'smartrecruiters.com', 'smartrecruiters'],
  },
  {
    provider: 'Comeet',
    hosts: ['comeet.co', 'app.comeet.co'],
    markers: ['comeet.co', 'comeet.com', 'data-comeet'],
  },
  {
    provider: 'Rippling',
    hosts: ['rippling.com', 'jobs.rippling.com'],
    markers: ['rippling.com', 'jobs.rippling.com', 'rippling_job'],
  },
  {
    provider: 'BambooHR',
    hosts: ['bamboohr.com', 'bamboohr.co.uk'],
    markers: ['bamboohr.com', 'bamboohr', 'tracker-rms'],
  },
  {
    provider: 'Jobvite',
    hosts: ['jobs.jobvite.com', 'jobvite.com'],
    markers: ['jobs.jobvite.com', 'jobvite.com', 'jv_', 'jobvite'],
  },
  {
    provider: 'Teamtailor',
    hosts: ['career.teamtailor.com', 'teamtailor.com'],
    markers: ['career.teamtailor.com', 'teamtailor.com', 'teamtailor'],
  },
];

/**
 * Detects an ATS provider from a single URL.
 */
export function detectAtsFromUrl(url: string): ATSProvider {
  const lower = url.toLowerCase();
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    host = lower;
  }

  for (const fp of ATS_FINGERPRINTS) {
    if (fp.hosts.some((h) => host === h || host.endsWith('.' + h) || host.includes(h))) {
      return fp.provider;
    }
  }

  // Fallback: scan markers anywhere in the URL (e.g. path segments).
  for (const fp of ATS_FINGERPRINTS) {
    if (fp.markers.some((m) => lower.includes(m))) {
      return fp.provider;
    }
  }

  return 'UNKNOWN';
}

/**
 * Detects an ATS provider from raw page HTML/body text plus any discovered URLs.
 */
export function detectAtsFromHtml(html: string, discoveredUrls: string[] = []): ATSProvider {
  const lower = (html || '').toLowerCase();

  for (const fp of ATS_FINGERPRINTS) {
    if (fp.markers.some((m) => lower.includes(m))) {
      return fp.provider;
    }
  }

  for (const url of discoveredUrls) {
    const detected = detectAtsFromUrl(url);
    if (detected !== 'UNKNOWN') return detected;
  }

  return 'UNKNOWN';
}

/**
 * Returns the standard ATS careers host for a provider, used when a company is
 * known to use a hosted ATS (e.g. boards.greenhouse.io/companytoken).
 */
export function atsHostFor(provider: ATSProvider): string | null {
  const fp = ATS_FINGERPRINTS.find((f) => f.provider === provider);
  return fp ? fp.hosts[0] : null;
}

export class ATSDetector {
  static detect(urlOrHtml: string, discoveredUrls: string[] = []): ATSProvider {
    // If it looks like a URL (starts with scheme or has a host-like shape), check URL first.
    if (/^https?:\/\//i.test(urlOrHtml) || urlOrHtml.includes('.')) {
      const fromUrl = detectAtsFromUrl(urlOrHtml);
      if (fromUrl !== 'UNKNOWN') return fromUrl;
    }
    return detectAtsFromHtml(urlOrHtml, discoveredUrls);
  }
}

export interface AtsVerification {
  provider: ATSProvider;
  verified: boolean;
}

/**
 * Deterministic ATS verification. A provider is "verified" only when the URL
 * matches a known ATS host pattern OR the HTML/body contains ATS signatures.
 * Weak guesses are never marked verified.
 */
export function verifyAts(urlOrHtml: string, discoveredUrls: string[] = []): AtsVerification {
  let host = '';
  try {
    host = new URL(urlOrHtml).hostname.toLowerCase();
  } catch {
    host = urlOrHtml.toLowerCase();
  }

  // 1. URL pattern match against known ATS hosts → verified.
  for (const fp of ATS_FINGERPRINTS) {
    if (fp.hosts.some((h) => host === h || host.endsWith('.' + h) || host.includes(h))) {
      return { provider: fp.provider, verified: true };
    }
  }

  // 2. HTML/body signature match → verified.
  const lower = (urlOrHtml || '').toLowerCase();
  for (const fp of ATS_FINGERPRINTS) {
    if (fp.markers.some((m) => lower.includes(m))) {
      return { provider: fp.provider, verified: true };
    }
  }

  // 3. Fallback scan of discovered URLs (markers only).
  for (const u of discoveredUrls) {
    const fromUrl = detectAtsFromUrl(u);
    if (fromUrl !== 'UNKNOWN') {
      return { provider: fromUrl, verified: true };
    }
  }

  return { provider: 'UNKNOWN', verified: false };
}
