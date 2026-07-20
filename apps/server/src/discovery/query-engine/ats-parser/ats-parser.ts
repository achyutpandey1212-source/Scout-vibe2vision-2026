export interface OpportunityCandidate {
  title: string;
  url: string;
  source: string;
}

export class ATSParser {
  /**
   * Deterministically parses job openings from raw markdown content based on the target ATS provider.
   */
  static parse(markdown: string, url: string, source: string): OpportunityCandidate[] {
    const candidates: OpportunityCandidate[] = [];
    const seenUrls = new Set<string>();

    // Regex pattern for markdown links: [Title](URL)
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(markdown)) !== null) {
      const title = match[1].trim();
      const jobUrl = match[2].trim();
      const jobUrlLower = jobUrl.toLowerCase();

      // Ensure URL is unique
      if (seenUrls.has(jobUrlLower)) continue;

      let isJobLink = false;

      // 1. Lever pattern: jobs.lever.co/company/jobId
      if (
        jobUrlLower.includes('jobs.lever.co/') &&
        !jobUrlLower.endsWith('/jobs.lever.co') &&
        !jobUrlLower.includes('/apply')
      ) {
        const parts = jobUrlLower.split('/');
        if (parts.length >= 5) {
          isJobLink = true;
        }
      }
      // 2. Greenhouse pattern: boards.greenhouse.io/company/jobs/jobId
      else if (jobUrlLower.includes('boards.greenhouse.io/') && jobUrlLower.includes('/jobs/')) {
        isJobLink = true;
      }
      // 3. Ashby pattern: jobs.ashbyhq.com/company/jobId
      else if (jobUrlLower.includes('jobs.ashbyhq.com/')) {
        const parts = jobUrlLower.split('/');
        if (parts.length >= 5) {
          isJobLink = true;
        }
      }
      // 4. Workable pattern: workable.com/j/jobId
      else if (jobUrlLower.includes('workable.com/j/')) {
        isJobLink = true;
      }

      if (isJobLink && title.length > 3) {
        seenUrls.add(jobUrlLower);
        candidates.push({
          title,
          url: jobUrl,
          source,
        });
      }
    }

    return candidates;
  }
}
export default ATSParser;
