export type SourceTier = 'A' | 'B' | 'C';

export class SourceTierResolver {
  /**
   * Resolves the source tier (A, B, C) dynamically based on historical statistics and domain traits.
   */
  static async resolve(domain: string, sourceRegistryEntry?: any): Promise<SourceTier> {
    const d = domain.toLowerCase().trim();

    // 1. Curated Tier A static overrides
    const tierA = [
      'google.com',
      'microsoft.com',
      'meta.com',
      'amazon.com',
      'nvidia.com',
      'wellfound.com',
      'ycombinator.com',
      'jobs.lever.co',
      'boards.greenhouse.io',
      'jobs.ashbyhq.com',
    ];
    if (tierA.some((t) => d.includes(t))) {
      return 'A';
    }

    // 2. Check Database Registry entry yield/accepted count metrics if available
    if (sourceRegistryEntry) {
      const accepted =
        sourceRegistryEntry.acceptedCount || sourceRegistryEntry.totalOpportunitiesFound || 0;
      const yieldScore = sourceRegistryEntry.yieldScore || 0;

      if (accepted > 15 || yieldScore > 75) {
        return 'A';
      }
      if (accepted > 5 || yieldScore > 40) {
        return 'B';
      }
    }

    // Default to Tier C for experimental/smaller sources
    return 'C';
  }
}
export default SourceTierResolver;
