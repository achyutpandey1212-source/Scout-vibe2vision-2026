import { ATSDetector } from './ats-detector';

export type DiscoveryRoute =
  'ATS_JOB' | 'CAREER_PAGE' | 'HOMEPAGE' | 'PORTFOLIO_PAGE' | 'BLOG' | 'DOCUMENTATION' | 'UNKNOWN';

export class OpportunityDiscoveryRouter {
  static route(url: string): DiscoveryRoute {
    const u = url.toLowerCase();

    // 1. Check for ATS match
    const ats = ATSDetector.detect(u);
    if (ats.provider !== 'none') {
      return 'ATS_JOB';
    }

    // 2. Page Fingerprinting (Ignore low-value pages)
    if (
      u.includes('medium.com') ||
      u.includes('/blog/') ||
      u.includes('/blogs/') ||
      u.includes('/news/') ||
      u.includes('/press/')
    ) {
      return 'BLOG';
    }

    if (
      u.includes('/docs/') ||
      u.includes('/documentation/') ||
      u.includes('/api-reference/') ||
      u.includes('/support/') ||
      u.includes('/help/')
    ) {
      return 'DOCUMENTATION';
    }

    if (u.includes('/portfolio') || u.includes('/companies') || u.includes('/ecosystem')) {
      return 'PORTFOLIO_PAGE';
    }

    // 3. Career Page vs Homepage
    if (
      u.includes('/careers') ||
      u.includes('/jobs') ||
      u.includes('/openings') ||
      u.includes('/work-with-us') ||
      u.includes('/join-us')
    ) {
      return 'CAREER_PAGE';
    }

    // Parse homepages
    try {
      const parsed = new URL(url);
      if (parsed.pathname === '/' || parsed.pathname === '') {
        return 'HOMEPAGE';
      }
    } catch {
      // Ignored
    }

    return 'UNKNOWN';
  }
}
export default OpportunityDiscoveryRouter;
