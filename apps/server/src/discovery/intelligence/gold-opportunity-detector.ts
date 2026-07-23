import { GOLD_COMPANY_REGISTRY } from './gold-company-registry';

export interface GoldDetectionResult {
  isGold: boolean;
  company: string;
  tier: number;
  multiplier: number;
}

export class GoldOpportunityDetector {
  /**
   * Matches parsed company details against the Gold Company Registry.
   * Promotes and tiers opportunities based on verified organizational profiles.
   */
  static detect(organizationName: string, domain: string): GoldDetectionResult {
    const orgLower = organizationName.toLowerCase().trim();
    const domainLower = domain.toLowerCase().trim();

    for (const [key, profile] of Object.entries(GOLD_COMPANY_REGISTRY)) {
      const matchAlias = profile.aliases.some(
        (alias) => orgLower === alias || orgLower.includes(alias) || alias.includes(orgLower),
      );
      const matchDomain = profile.aliases.some((alias) => domainLower.includes(alias));

      if (matchAlias || matchDomain) {
        return {
          isGold: true,
          company: profile.company,
          tier: profile.tier,
          multiplier: profile.priorityMultiplier,
        };
      }
    }

    return {
      isGold: false,
      company: organizationName,
      tier: 3, // Tier 3 fallback
      multiplier: 1.0,
    };
  }
}
export default GoldOpportunityDetector;
