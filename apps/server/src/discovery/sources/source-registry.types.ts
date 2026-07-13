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

export type SourceCategory =
  | 'TECH_CAREERS'
  | 'WOMEN_IN_TECH'
  | 'SCHOLARSHIPS'
  | 'FELLOWSHIPS'
  | 'GOVERNMENT'
  | 'HACKATHONS'
  | 'ENTREPRENEURSHIP'
  | 'RESEARCH'
  | 'SKILL_DEVELOPMENT'
  | 'GENERAL';

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
}

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
