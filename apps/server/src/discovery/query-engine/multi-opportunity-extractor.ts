import { OpportunityCandidate } from './ats-parser/ats-parser';

export class MultiOpportunityExtractor {
  /**
   * Identifies candidate opportunity URLs in generic markdown pages by parsing markdown links
   * and looking for career-related keywords.
   */
  static extract(markdown: string, url: string, source: string): OpportunityCandidate[] {
    const candidates: OpportunityCandidate[] = [];
    const seenUrls = new Set<string>();

    // Parse standard markdown links [Anchor Text](URL)
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(markdown)) !== null) {
      const title = match[1].trim();
      const jobUrl = match[2].trim();
      const jobUrlLower = jobUrl.toLowerCase();

      if (seenUrls.has(jobUrlLower)) continue;

      const isAtsLink =
        jobUrlLower.includes('greenhouse.io/') ||
        jobUrlLower.includes('lever.co/') ||
        jobUrlLower.includes('ashbyhq.com/') ||
        jobUrlLower.includes('workable.com/') ||
        jobUrlLower.includes('smartrecruiters.com/') ||
        jobUrlLower.includes('jobvite.com/') ||
        jobUrlLower.includes('wellfound.com/') ||
        jobUrlLower.includes('bamboohr.com/') ||
        jobUrlLower.includes('recruitee.com/');

      const hasJobKeyword =
        isAtsLink ||
        jobUrlLower.includes('/job/') ||
        jobUrlLower.includes('/jobs/') ||
        jobUrlLower.includes('/careers/') ||
        jobUrlLower.includes('/career/') ||
        jobUrlLower.includes('/openings/') ||
        jobUrlLower.includes('/opportunity/') ||
        jobUrlLower.includes('/opportunities/') ||
        jobUrlLower.includes('/careers-openings/') ||
        jobUrlLower.includes('/requisitions/');

      const isTechnicalInternshipTitle =
        title.toLowerCase().includes('intern') ||
        title.toLowerCase().includes('co-op') ||
        title.toLowerCase().includes('sde') ||
        title.toLowerCase().includes('developer') ||
        title.toLowerCase().includes('engineer') ||
        title.toLowerCase().includes('hiring') ||
        title.toLowerCase().includes('placement') ||
        title.toLowerCase().includes('fellow');

      const isActionTitle =
        title.toLowerCase() === 'apply' ||
        title.toLowerCase() === 'apply now' ||
        title.toLowerCase() === 'view' ||
        title.toLowerCase() === 'view details' ||
        title.toLowerCase() === 'learn more' ||
        title.toLowerCase().includes('position') ||
        title.toLowerCase().includes('role');

      const urlHasRelevance =
        jobUrlLower.includes('intern') ||
        jobUrlLower.includes('software') ||
        jobUrlLower.includes('sde') ||
        jobUrlLower.includes('developer') ||
        jobUrlLower.includes('engineer') ||
        jobUrlLower.includes('co-op') ||
        jobUrlLower.includes('coop');

      if (
        hasJobKeyword &&
        (isTechnicalInternshipTitle || (isActionTitle && urlHasRelevance)) &&
        title.length > 2
      ) {
        seenUrls.add(jobUrlLower);
        candidates.push({
          title: isTechnicalInternshipTitle ? title : `Opportunity opening at ${source}`,
          url: jobUrl,
          source,
        });
      }
    }

    return candidates;
  }
}
export default MultiOpportunityExtractor;
