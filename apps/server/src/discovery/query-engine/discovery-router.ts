import { CandidateScore } from './candidate-scorer';

export type ExtractorType = 'ATS' | 'JOB_DETAIL' | 'CAREER_DIRECTORY' | 'HOMEPAGE' | 'SKIP';

export class DiscoveryRouter {
  /**
   * Routes the crawling strategy and selector based on resolved page type scoring.
   */
  static route(score: CandidateScore): ExtractorType {
    switch (score.pageType) {
      case 'ATS':
        return 'ATS';
      case 'JOB_DETAIL':
        return 'JOB_DETAIL';
      case 'CAREER_DIRECTORY':
      case 'INTERNSHIP_DIRECTORY':
        return 'CAREER_DIRECTORY';
      case 'COMPANY':
      case 'PORTFOLIO':
        return 'HOMEPAGE';
      case 'BLOG':
      case 'DOCUMENTATION':
        return 'SKIP';
      case 'UNKNOWN':
      default:
        return 'CAREER_DIRECTORY';
    }
  }
}
export default DiscoveryRouter;
