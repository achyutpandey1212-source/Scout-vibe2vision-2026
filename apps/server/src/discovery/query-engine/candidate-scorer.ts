export interface CandidateScore {
  url: string;
  score: number;
  reason: string;
  pageType: string;
}

export class CandidateScorer {
  /**
   * Scores a candidate URL before crawling based on URL structure and subpath parameters.
   */
  static scoreCandidate(url: string): CandidateScore {
    const u = url.toLowerCase();

    // 1. ATS Listings
    if (
      u.includes('lever.co/') ||
      u.includes('greenhouse.io/') ||
      u.includes('ashbyhq.com/') ||
      u.includes('workable.com/') ||
      u.includes('smartrecruiters.com/') ||
      u.includes('jobvite.com/')
    ) {
      return { url, score: 100, reason: 'ATS URL', pageType: 'ATS' };
    }

    // 2. Individual Job Page
    if (
      u.includes('/job/') ||
      u.includes('/jobs/') ||
      u.includes('/openings/') ||
      u.includes('/opportunity/') ||
      u.includes('/careers/')
    ) {
      // Direct job subpaths (e.g. detailed view) vs directory
      if (u.match(/\/[a-f0-9-]{12,}/) || u.match(/\/\d{5,}/)) {
        return { url, score: 95, reason: 'Direct Job Listing URL', pageType: 'JOB_DETAIL' };
      }
      return { url, score: 90, reason: 'Career Directory URL', pageType: 'CAREER_DIRECTORY' };
    }

    // 3. Internship Directory
    if (u.includes('intern') || u.includes('internship')) {
      return {
        url,
        score: 90,
        reason: 'Internship Directory URL',
        pageType: 'INTERNSHIP_DIRECTORY',
      };
    }

    // 4. VC Portfolio Listings
    if (
      u.includes('/portfolio') ||
      u.includes('/companies') ||
      u.includes('ycombinator.com/jobs')
    ) {
      return { url, score: 70, reason: 'Ecosystem Portfolio Page', pageType: 'PORTFOLIO' };
    }

    // 5. Homepages
    try {
      const parsed = new URL(url);
      if (parsed.pathname === '/' || parsed.pathname === '') {
        return { url, score: 40, reason: 'Homepage URL', pageType: 'COMPANY' };
      }
    } catch {
      // Ignored
    }

    // 6. Ignored low-value routes
    if (u.includes('/blog/') || u.includes('/blogs/') || u.includes('/news/')) {
      return { url, score: 10, reason: 'Blog/News Subpath', pageType: 'BLOG' };
    }
    if (u.includes('/docs/') || u.includes('/documentation/') || u.includes('/help/')) {
      return { url, score: 5, reason: 'Documentation/Help Subpath', pageType: 'DOCUMENTATION' };
    }

    return { url, score: 30, reason: 'Unknown URL Strategy', pageType: 'UNKNOWN' };
  }

  /**
   * Adjusts and boosts candidate score after crawling based on raw page text content.
   */
  static scoreContent(scoreObj: CandidateScore, text: string): CandidateScore {
    let score = scoreObj.score;
    const lowerText = text.toLowerCase();
    const reasons: string[] = [scoreObj.reason];

    if (
      lowerText.includes('stipend') ||
      lowerText.includes('salary') ||
      lowerText.includes('lpa')
    ) {
      score += 10;
      reasons.push('Contains Stipend/Salary');
    }
    if (lowerText.includes('intern') || lowerText.includes('internship')) {
      score += 15;
      reasons.push('Contains Internship Keywords');
    }
    if (
      lowerText.includes('software engineer') ||
      lowerText.includes('sde') ||
      lowerText.includes('developer')
    ) {
      score += 15;
      reasons.push('Contains Engineering Keywords');
    }
    if (lowerText.includes('deadline') || lowerText.includes('last date')) {
      score += 10;
      reasons.push('Contains Deadline Details');
    }
    if (
      lowerText.includes('apply now') ||
      lowerText.includes('submit application') ||
      lowerText.includes('apply online')
    ) {
      score += 10;
      reasons.push('Contains Apply Actions');
    }

    return {
      url: scoreObj.url,
      score: Math.min(100, score),
      reason: reasons.join('; '),
      pageType: scoreObj.pageType,
    };
  }
}
export default CandidateScorer;
