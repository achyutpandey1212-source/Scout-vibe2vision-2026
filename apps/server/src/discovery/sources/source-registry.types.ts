// ─── Enumerations ─────────────────────────────────────────────────────────────

export type CrawlFrequency = 'daily' | 'weekly' | 'monthly';
export type CrawlStrategy = 'direct' | 'search' | 'sitemap' | 'rss';
export type DiscoveredBy = 'seed' | 'weekly-discovery' | 'affiliate-extraction' | 'manual';
export type SourcePriority = 'critical' | 'high' | 'medium' | 'low';

export type SourceType =
  | 'Organization'
  | 'Company'
  | 'University'
  | 'Government'
  | 'NGO'
  | 'Community'
  | 'Platform'
  | 'Hackathon'
  | 'Open Source'
  | 'Other';

import { SourceCategory } from '@scout/shared';
export type { SourceCategory };

// ─── Core Interface ───────────────────────────────────────────────────────────

export interface ISourceRegistryEntry {
  domain: string;
  organization: string;
  homepage: string;
  sourceType: SourceType;
  category: SourceCategory;
  strategy: CrawlStrategy;
  crawlFrequency: CrawlFrequency;
  defaultTags: string[];
  isActive: boolean;

  trustScore: number;
  priority: SourcePriority;

  confidence: number;
  reason: string;
  verifiedByAIAt: Date | null;
  lastVerifiedAt: Date | null;

  discoveredBy: DiscoveredBy;
  discoveredAt: Date;
  lastCrawledAt: Date | null;
  nextCrawlAt: Date;

  consecutiveFailures: number;

  totalRuns: number;
  totalPagesCrawled: number;
  totalOpportunitiesFound: number;
  opportunityDensity: number;

  sourceTier: SourceTier;
  discoveryValue: number;
  studentRelevance: number;
  freshnessScore: number;
  ecosystemType: EcosystemType;
  ecosystemName?: string | null;
  startupStage?: string | null;
  region?: string | null;
  engineeringFocus?: string[] | null;
  remoteFriendly: boolean;
  internshipFriendly: boolean;
  averageOpportunityQuality?: number | null;
  averageHiddenGemScore?: number | null;
  sourceReason?: string | null;
}

export type SourceTier = 'A' | 'B' | 'C';
export type EcosystemType =
  | 'STARTUP'
  | 'INCUBATOR'
  | 'UNIVERSITY'
  | 'RESEARCH'
  | 'GOVERNMENT'
  | 'COMMUNITY'
  | 'OPEN_SOURCE'
  | 'NON_PROFIT';

// ─── Supporting Types ─────────────────────────────────────────────────────────

export interface CrawlTarget {
  domain: string;
  organization: string;
  homepage: string;
  strategy: CrawlStrategy;
  defaultTags: string[];
  trustScore: number;
  priority: SourcePriority;
}

export interface RegistryStats {
  total: number;
  active: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  bySourceType: Record<string, number>;
  avgOpportunityDensity: number;
  topSources: Pick<
    ISourceRegistryEntry,
    'domain' | 'organization' | 'trustScore' | 'opportunityDensity' | 'totalOpportunitiesFound'
  >[];

  // V2 Registry health metrics
  tierACount: number;
  tierBCount: number;
  tierCCount: number;
  governmentSources: number;
  startupSources: number;
  researchSources: number;
  communitySources: number;
  avgTrustScore: number;
  avgDiscoveryValue: number;
  avgStudentRelevance: number;
  avgFreshness: number;
  inactiveSources: number;
}

export interface AIDomainEvaluation {
  isOpportunitySource: boolean;
  confidence: number;
  reason: string;
  suggestedSourceType: SourceType;
  suggestedCategory: SourceCategory;
  suggestedTrustScore: number;
  suggestedPriority: SourcePriority;
  suggestedCrawlFrequency: CrawlFrequency;
  suggestedStrategy: CrawlStrategy;
}

export interface SourceDiscoveryReport {
  batchesRun: number;
  domainsEvaluated: number;
  domainsApproved: number;
  domainsRejected: number;
  affiliateDomainsProcessed: number;
  durationMs: number;
}
