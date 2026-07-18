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

/**
 * Discriminated union for AI domain evaluations.
 *
 * Case A — isOpportunitySource: true
 *   The domain is a legitimate opportunity source. All classification
 *   fields are required.
 *
 * Case B — isOpportunitySource: false
 *   The domain was classified as NOT an opportunity source. Only the
 *   rejection metadata is required; classification fields are omitted.
 */
export interface AIDomainEvaluationOpportunity {
  isOpportunitySource: true;
  confidence: number;
  reason: string;
  suggestedSourceType: SourceType;
  suggestedCategory: SourceCategory;
  suggestedTrustScore: number;
  suggestedPriority: SourcePriority;
  suggestedCrawlFrequency: CrawlFrequency;
  suggestedStrategy: CrawlStrategy;
}

export interface AIDomainEvaluationRejected {
  isOpportunitySource: false;
  confidence: number;
  reason: string;
  suggestedSourceType?: SourceType;
  suggestedCategory?: SourceCategory;
  suggestedTrustScore?: number;
  suggestedPriority?: SourcePriority;
  suggestedCrawlFrequency?: CrawlFrequency;
  suggestedStrategy?: CrawlStrategy;
}

export type AIDomainEvaluation = AIDomainEvaluationOpportunity | AIDomainEvaluationRejected;

/**
 * Outcome of evaluating a single domain. Separates normal business decisions
 * from genuine infrastructure/AI errors so downstream logging can pick the
 * correct severity.
 */
export type DomainEvaluationOutcome =
  | { kind: 'approved'; evaluation: AIDomainEvaluationOpportunity }
  | { kind: 'rejected'; evaluation: AIDomainEvaluationRejected }
  | { kind: 'duplicate' }
  | { kind: 'invalid'; error: string }
  | { kind: 'aiError'; error: string };

export interface SourceDiscoveryReport {
  batchesRun: number;
  domainsEvaluated: number;
  domainsApproved: number;
  domainsRejected: number;
  duplicateSources: number;
  invalidResponses: number;
  providerFailures: number;
  affiliateDomainsProcessed: number;
  averageConfidence: number;
  durationMs: number;
}
