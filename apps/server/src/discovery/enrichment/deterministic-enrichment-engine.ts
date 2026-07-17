import { CanonicalUrlResolver } from '../utils/canonical-url-resolver';
import { OrganizationResolver } from './organization-resolver';
import { TrustScoreEngine } from './trust-engine';
import { OrganizationType, OrganizationStage } from '../extraction/types/opportunity.types';

export interface TrustScoreOutput {
  trustScore: number;
  trustLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  sourceAuthority: number;
}

export class DeterministicEnrichmentEngine {
  /**
   * Run all deterministic enrichment operations sequentially on an opportunity.
   */
  public static enrich(opp: any, sourceRegistryEntry?: any, crawledPage?: any): void {
    // 1. Canonicalize URLs
    if (opp.applicationUrl) {
      opp.applicationUrl = CanonicalUrlResolver.clean(opp.applicationUrl);
    }
    if (opp.sourceURL) {
      opp.sourceURL = CanonicalUrlResolver.clean(opp.sourceURL);
    }

    // 2. Hash Generation based on Canonical URL
    const canonicalUrl = opp.applicationUrl || opp.sourceURL;
    if (canonicalUrl) {
      opp.hash = CanonicalUrlResolver.generateHash(canonicalUrl);
      opp.contentHash = opp.hash;
    }

    // 3. Resolve & Normalize Organization Name and Metadata
    const resolvedOrg = OrganizationResolver.resolve(opp, crawledPage);
    opp.organization = resolvedOrg.organization;
    opp.organizationType = resolvedOrg.organizationType;
    opp.organizationStage = resolvedOrg.organizationStage;

    // 4. Evaluate Trust score, level, and authority
    const trustEval = TrustScoreEngine.evaluate(opp, sourceRegistryEntry);
    opp.trustScore = trustEval.trustScore;
    opp.trustLevel = trustEval.trustLevel;
    opp.sourceAuthority = trustEval.sourceAuthority;
  }
}
