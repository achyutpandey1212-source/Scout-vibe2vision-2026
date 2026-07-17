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
  | 'Job Board'
  | 'Hackathon'
  | 'Conference'
  | 'Research Lab'
  | 'Other';

import { SourceCategory } from '@scout/shared';
export type { SourceCategory };

// ─── Core Interface ───────────────────────────────────────────────────────────

export interface ISourceRegistryEntry {
  // Identity
  domain: string; // e.g. "anitab.org" — unique indexed key
  organization: string;
  homepage: string;
  sourceType: SourceType;
  category: SourceCategory;
  strategy: CrawlStrategy;
  crawlFrequency: CrawlFrequency;
  defaultTags: string[];
  isActive: boolean;

  // Trust & priority
  trustScore: number; // 0–100
  priority: SourcePriority; // critical / high / medium / low

  // AI verification
  confidence: number; // 0–100; AI's confidence this is a valid source
  reason: string; // AI's rationale for approving this source
  verifiedByAIAt: Date | null; // Timestamp of first AI verification
  lastVerifiedAt: Date | null; // Timestamp of most recent AI re-verification

  // Discovery provenance
  discoveredBy: DiscoveredBy;
  discoveredAt: Date;
  lastCrawledAt: Date | null;
  nextCrawlAt: Date;

  // Health
  consecutiveFailures: number;

  // Analytics (powers future auto-frequency optimization)
  totalRuns: number; // how many times this source has been crawled
  totalPagesCrawled: number; // cumulative pages fetched from this source
  totalOpportunitiesFound: number; // cumulative opportunities extracted
  // opportunityDensity = totalOpportunitiesFound / totalPagesCrawled
  // Stored for efficient MongoDB range queries on auto-optimization
  opportunityDensity: number; // opportunities per page (0.0–1.0+)

  // Source Intelligence V2 Metadata
  sourceTier: SourceTier;
  discoveryValue: number; // 0-100
  studentRelevance: number; // 0-100
  freshnessScore: number; // 0-100
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
  | 'BIG_TECH'
  | 'VC_PORTFOLIO'
  | 'COMMUNITY'
  | 'OPEN_SOURCE'
  | 'AGGREGATOR'
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
