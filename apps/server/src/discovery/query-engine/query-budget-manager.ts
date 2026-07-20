import { SourceTier } from './source-tier-resolver';

export class QueryBudgetManager {
  /**
   * Resolves the Tavily search query limit count for a given source tier.
   */
  static getLimit(tier: SourceTier): number {
    switch (tier) {
      case 'A':
        return 20;
      case 'B':
        return 12;
      case 'C':
      default:
        return 8;
    }
  }
}
export default QueryBudgetManager;
