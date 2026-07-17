import { TrustScoreOutput } from './deterministic-enrichment-engine';

export class TrustScoreEngine {
  private static readonly mncOrgs = new Set([
    'google',
    'microsoft',
    'netflix',
    'amazon',
    'apple',
    'meta',
    'facebook',
    'stripe',
    'uber',
    'github',
  ]);

  /**
   * Evaluates trust score, trust level, and source authority deterministically.
   */
  public static evaluate(
    opp: {
      sourceURL: string;
      organization: string;
      organizationType?: string;
      description?: string;
      title?: string;
    },
    sourceRegistryEntry?: any,
  ): TrustScoreOutput {
    let score = 0;
    const urlStr = opp.sourceURL || '';
    let host = '';
    let isHttps = false;

    try {
      const url = new URL(urlStr);
      host = url.hostname.toLowerCase().replace(/^www\./, '');
      isHttps = url.protocol === 'https:';
    } catch {
      // ignore
    }

    // 1. HTTPS Check (+10)
    if (isHttps) {
      score += 10;
    }

    // 2. Government Check (+30)
    const isGov =
      host.endsWith('.gov') ||
      host.endsWith('.gov.in') ||
      host.endsWith('.nic.in') ||
      opp.organizationType === 'GOVERNMENT';
    if (isGov) {
      score += 30;
    }

    // 3. University Check (+25)
    const isEdu =
      host.endsWith('.edu') ||
      host.endsWith('.ac.in') ||
      host.endsWith('.edu.in') ||
      opp.organizationType === 'UNIVERSITY';
    if (isEdu) {
      score += 25;
    }

    // 4. Known Registry Check (+20)
    const isKnownRegistry = !!sourceRegistryEntry;
    if (isKnownRegistry) {
      score += 20;
    }

    // 5. Recognized Company Check (+20)
    const isMnc =
      opp.organizationType === 'MNC' || this.mncOrgs.has(opp.organization.toLowerCase().trim());
    if (isMnc) {
      score += 20;
    }

    // 6. Career Portal Check (+15)
    const isCareerPortal =
      host.startsWith('careers.') ||
      host.startsWith('jobs.') ||
      host.startsWith('recruiting.') ||
      host.includes('lever.co') ||
      host.includes('greenhouse.io') ||
      host.includes('ashbyhq.com') ||
      host.includes('smartrecruiters.com');
    if (isCareerPortal) {
      score += 15;
    }

    // 7. Verified Startup Check (+15)
    const isVerifiedStartup =
      opp.organizationType === 'STARTUP' ||
      (sourceRegistryEntry &&
        (sourceRegistryEntry.ecosystemType === 'STARTUP' ||
          sourceRegistryEntry.ecosystemType === 'INCUBATOR'));
    if (isVerifiedStartup) {
      score += 15;
    }

    // 8. Official Domain Check (+30)
    const isAggregator =
      host.includes('linkedin.com') ||
      host.includes('indeed.com') ||
      host.includes('glassdoor.com') ||
      host.includes('internshala.com') ||
      host.includes('unstop.org') ||
      host.includes('devfolio.co') ||
      host.includes('naukri.com');
    if (!isAggregator && host && !isEdu && !isGov) {
      score += 30;
    }

    // 9. Spam Indicators (Negative Scores)
    const descLower = (opp.description || '').toLowerCase();
    const titleLower = (opp.title || '').toLowerCase();
    const spamKeywords = [
      'credit card required',
      'pay fee',
      'deposit',
      'lottery',
      'win cash',
      'gambling',
      'crypto scan',
      'spam',
      'click here to win',
      'make money fast',
      'get rich',
    ];

    const hasSpamKeywords = spamKeywords.some(
      (kw) => descLower.includes(kw) || titleLower.includes(kw),
    );
    if (hasSpamKeywords) {
      score -= 50;
    }

    if (descLower.length < 50) {
      score -= 20;
    }

    const trustScore = Math.max(0, Math.min(100, score));

    let trustLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    if (trustScore >= 80) {
      trustLevel = 'VERY_HIGH';
    } else if (trustScore >= 60) {
      trustLevel = 'HIGH';
    } else if (trustScore >= 40) {
      trustLevel = 'MEDIUM';
    } else {
      trustLevel = 'LOW';
    }

    return {
      trustScore,
      trustLevel,
      sourceAuthority: trustScore,
    };
  }
}
