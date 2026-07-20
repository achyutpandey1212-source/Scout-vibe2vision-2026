import { OpportunityCandidate } from './ats-parser/ats-parser';

export class MultiOpportunityExtractor {
  /**
   * Identifies candidate opportunity URLs in generic markdown pages by parsing markdown links
   * and looking for career-related keywords.
   */
  static extract(markdown: string, url: string, source: string): OpportunityCandidate[] {
    const candidates: OpportunityCandidate[] = [];
    const seenUrls = new Set<string>();

    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(markdown)) !== null) {
      const title = match[1].trim();
      const jobUrl = match[2].trim();
      const jobUrlLower = jobUrl.toLowerCase();

      if (seenUrls.has(jobUrlLower)) continue;

      const hasJobKeyword =
        jobUrlLower.includes('/job/') ||
        jobUrlLower.includes('/jobs/') ||
        jobUrlLower.includes('/careers/') ||
        jobUrlLower.includes('/career/') ||
        jobUrlLower.includes('/openings/') ||
        jobUrlLower.includes('/opportunity/') ||
        jobUrlLower.includes('/opportunities/') ||
        jobUrlLower.includes('/careers-openings/');

      const isTechnicalInternshipTitle =
        title.toLowerCase().includes('intern') ||
        title.toLowerCase().includes('sde') ||
        title.toLowerCase().includes('developer') ||
        title.toLowerCase().includes('engineer') ||
        title.toLowerCase().includes('hiring') ||
        title.toLowerCase().includes('placement') ||
        title.toLowerCase().includes('fellow');

      if (hasJobKeyword && isTechnicalInternshipTitle && title.length > 3) {
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
export default MultiOpportunityExtractor;
