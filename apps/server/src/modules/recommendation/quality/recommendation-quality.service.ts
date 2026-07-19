import { IRankedCandidate } from '../types/scoring.types';

export class RecommendationQualityService {
  /**
   * Computes a quality score (0-100) for a Recommendation Pack
   * based on diversity balance, hidden gem scores, and portfolio values.
   */
  static evaluatePack(top5: IRankedCandidate[]): number {
    if (top5.length === 0) return 0;

    // 1. Company/Organization Diversity (Max 20)
    const orgs = new Set(top5.map((c) => c.diversificationTags.organization));
    const orgScore = Math.min((orgs.size / top5.length) * 20, 20);

    // 2. Category/Type Diversity (Max 20)
    const categories = new Set(top5.map((c) => c.diversificationTags.category));
    const catScore = Math.min((categories.size / top5.length) * 20, 20);

    // 3. Technical Domain/Tag Diversity (Max 20)
    const domains = new Set(top5.map((c) => c.diversificationTags.domain));
    const domScore = Math.min((domains.size / top5.length) * 20, 20);

    // 4. Hidden Gem Average (Max 20)
    const avgHiddenGem =
      top5.reduce((sum, c) => sum + (c.opportunity.hiddenGemScore || 0), 0) / top5.length;
    // Scale hidden gem 0-100 to 20 points
    const gemScore = (avgHiddenGem / 100) * 20;

    // 5. Portfolio Builder Average (Max 20)
    const avgPortfolio =
      top5.reduce((sum, c) => {
        const valSum =
          (c.opportunity.careerValPortfolio || 0) +
          (c.opportunity.careerValResume || 0) +
          (c.opportunity.careerValLearning || 0) +
          (c.opportunity.careerValNetworking || 0) +
          (c.opportunity.careerValExposure || 0);
        return sum + (valSum / 25) * 100; // scale 25 to 100
      }, 0) / top5.length;
    // Scale portfolio 0-100 to 20 points
    const portScore = (avgPortfolio / 100) * 20;

    const qualityScore = Math.round(orgScore + catScore + domScore + gemScore + portScore);
    return Math.min(Math.max(qualityScore, 0), 100);
  }
}
