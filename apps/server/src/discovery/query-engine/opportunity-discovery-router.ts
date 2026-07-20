export type DiscoveryRoute =
  | 'SINGLE_OPPORTUNITY'
  | 'MULTI_OPPORTUNITY_DIRECTORY'
  | 'ATS_DIRECTORY'
  | 'PORTFOLIO_DIRECTORY'
  | 'BLOG'
  | 'DOCUMENTATION'
  | 'UNKNOWN';

export class OpportunityDiscoveryRouter {
  /**
   * Classifies page types to coordinate extractors and routers.
   */
  static route(url: string): DiscoveryRoute {
    const u = url.toLowerCase();

    // 1. Portfolio directories
    if (
      u.includes('/portfolio') ||
      u.includes('/companies') ||
      u.includes('/ecosystem') ||
      u.includes('ycombinator.com/jobs')
    ) {
      return 'PORTFOLIO_DIRECTORY';
    }

    // 2. ATS directories or listings
    const isAts =
      u.includes('greenhouse.io') ||
      u.includes('lever.co') ||
      u.includes('ashbyhq.com') ||
      u.includes('workable.com') ||
      u.includes('smartrecruiters.com') ||
      u.includes('jobvite.com') ||
      u.includes('wellfound.com') ||
      u.includes('bamboohr.com') ||
      u.includes('recruitee.com');

    if (isAts) {
      if (
        u.match(/\/(jobs|requisitions|job|careers)\/\d+/) ||
        u.match(/\/[a-f0-9-]{12,}/) ||
        (u.includes('lever.co') && u.split('/').length > 4)
      ) {
        return 'SINGLE_OPPORTUNITY';
      }
      return 'ATS_DIRECTORY';
    }

    // 3. Blog & Docs
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

    // 4. Career directories vs direct listings
    if (
      u.includes('/careers') ||
      u.includes('/jobs') ||
      u.includes('/openings') ||
      u.includes('/work-with-us') ||
      u.includes('/join-us')
    ) {
      if (u.match(/\/(job|opening|vacancy|opportunity|detail)\//) || u.match(/\/\d{5,}/)) {
        return 'SINGLE_OPPORTUNITY';
      }
      return 'MULTI_OPPORTUNITY_DIRECTORY';
    }

    return 'UNKNOWN';
  }
}
export default OpportunityDiscoveryRouter;
