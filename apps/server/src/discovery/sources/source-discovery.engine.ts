import { z } from 'zod';
import { TavilyClient } from '../search/tavily.client';
import { sourceRegistryService } from './source-registry.service';
import { AffiliateExtractor } from './affiliate-extractor';
import { buildQueryGeneratorPrompt, buildDomainEvaluatorPrompt } from './source-discovery.prompt';
import { generateStructuredResponse } from '../../ai/capabilities/structured-output';
import { DiscoveryProviderManager } from '../../ai/gateway/discovery-provider-manager';
import { sanitizeAiOutput } from './ai-output-sanitizer';
import {
  SourceDiscoveryReport,
  AIDomainEvaluation,
  AIDomainEvaluationOpportunity,
  AIDomainEvaluationRejected,
  DomainEvaluationOutcome,
  SourceCategory,
  SourceType,
  SourcePriority,
  CrawlFrequency,
  CrawlStrategy,
} from './source-registry.types';
import { ACTIVE_SOURCE_CATEGORIES } from '@scout/shared';

// ─── Zod Schemas for AI Outputs ───────────────────────────────────────────────

const QueryListSchema = z.object({
  queries: z.array(z.string().min(1)),
});

// Shared fields present in both union branches.
const EvaluationBaseSchema = z.object({
  isOpportunitySource: z.boolean(),
  confidence: z.number().min(0).max(100),
  reason: z.string(),
  suggestedSourceType: z
    .enum([
      'Organization',
      'Company',
      'University',
      'Government',
      'NGO',
      'Community',
      'Platform',
      'Hackathon',
      'Open Source',
      'Other',
    ])
    .optional(),
});

// Case A — isOpportunitySource: true → all classification fields required.
const OpportunityEvaluationSchema = EvaluationBaseSchema.extend({
  isOpportunitySource: z.literal(true),
  suggestedCategory: z.enum(ACTIVE_SOURCE_CATEGORIES as [SourceCategory, ...SourceCategory[]]),
  suggestedTrustScore: z.number().min(0).max(100),
  suggestedPriority: z.enum(['critical', 'high', 'medium', 'low']),
  suggestedCrawlFrequency: z.enum(['daily', 'weekly', 'monthly']),
  suggestedStrategy: z.enum(['direct', 'search', 'sitemap', 'rss']),
});

// Case B — isOpportunitySource: false → classification fields omitted/optional.
const RejectedEvaluationSchema = EvaluationBaseSchema.extend({
  isOpportunitySource: z.literal(false),
  suggestedCategory: z
    .enum(ACTIVE_SOURCE_CATEGORIES as [SourceCategory, ...SourceCategory[]])
    .optional(),
  suggestedTrustScore: z.number().min(0).max(100).optional(),
  suggestedPriority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  suggestedCrawlFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  suggestedStrategy: z.enum(['direct', 'search', 'sitemap', 'rss']).optional(),
});

// Discriminated union keyed on isOpportunitySource (Task 1).
const DomainEvaluationSchema = z.union([OpportunityEvaluationSchema, RejectedEvaluationSchema]);
// ─── Config ───────────────────────────────────────────────────────────────────

interface SourceDiscoveryConfig {
  totalBatches: number;
  batchSize: number;
}

const DEFAULT_CONFIG: SourceDiscoveryConfig = {
  totalBatches: 6,
  batchSize: 5,
};

// ─── Source Discovery Engine ──────────────────────────────────────────────────

export class SourceDiscoveryEngine {
  private tavilyClient: TavilyClient;

  constructor() {
    this.tavilyClient = new TavilyClient();
  }

  /**
   * Runs the weekly source discovery pipeline.
   *
   * Step 1: AI generates totalBatches × batchSize diverse discovery queries.
   * Step 2: Tavily searches are executed in batches — ALL batches always run.
   *         (No early stopping — later batches cover entirely different ecosystems.)
   * Step 3: Each new domain is AI-evaluated for legitimacy and classified.
   * Step 4: Affiliate queue (populated by Stage 2 crawls) is drained and evaluated.
   *
   * @param config Optional overrides for batch counts.
   */
  async run(config?: Partial<SourceDiscoveryConfig>): Promise<SourceDiscoveryReport> {
    const cfg: SourceDiscoveryConfig = { ...DEFAULT_CONFIG, ...config };

    // Allow env override
    const envBatches = process.env.SOURCE_DISCOVERY_BATCHES;
    const envBatchSize = process.env.SOURCE_DISCOVERY_BATCH_SIZE;
    if (envBatches) cfg.totalBatches = Math.min(parseInt(envBatches, 10), 10);
    if (envBatchSize) cfg.batchSize = parseInt(envBatchSize, 10);

    // Reset provider manager metrics at the start of a run (Task 5)
    DiscoveryProviderManager.getInstance().resetMetrics();

    const totalQueries = cfg.totalBatches * cfg.batchSize;
    const startTime = Date.now();

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Source Discovery Engine] Starting weekly run
Batches: ${cfg.totalBatches} × ${cfg.batchSize} queries = ${totalQueries} total queries
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    let domainsEvaluated = 0;
    let domainsApproved = 0;
    let domainsRejected = 0;
    let duplicateSources = 0;
    let invalidResponses = 0;
    let providerFailures = 0;
    const confidenceSamples: number[] = [];
    const seenInRun = new Set<string>();

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 1: AI generates diverse search queries
    // ──────────────────────────────────────────────────────────────────────────

    console.log(
      `[Source Discovery Engine] Step 1: Generating ${totalQueries} discovery queries...`,
    );

    let searchQueries: string[] = [];
    try {
      const queryResponse = await generateStructuredResponse({
        prompt: buildQueryGeneratorPrompt(totalQueries),
        schema: QueryListSchema,
        context: 'discovery',
        temperature: 0.9, // High temperature for maximum query diversity
        maxTokens: 2048,
      });
      searchQueries = queryResponse.queries.slice(0, totalQueries);
      console.log(`[Source Discovery Engine] AI generated ${searchQueries.length} queries.`);
    } catch (err: any) {
      console.error(`[Source Discovery Engine] Query generation failed: ${err.message}`);
      console.warn('[Source Discovery Engine] Falling back to hardcoded seed queries...');
      searchQueries = this.getFallbackQueries(totalQueries);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 2: Batched Tavily discovery — ALWAYS runs all batches
    // ──────────────────────────────────────────────────────────────────────────

    const batches = chunkArray(searchQueries, cfg.batchSize);

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      console.log(
        `\n[Source Discovery Engine] Batch ${batchIdx + 1}/${batches.length}: ` +
          `Running ${batch.length} Tavily searches...`,
      );

      const newDomains = new Set<string>();

      for (const query of batch) {
        try {
          const response = await this.tavilyClient.search(query, 5);
          for (const result of response.results) {
            const domain = extractDomainFromUrl(result.url);
            if (!domain) continue;

            const exists = await sourceRegistryService.domainExists(domain);
            if (!exists) {
              // Store domain alongside its title + snippet for AI evaluation
              newDomains.add(
                JSON.stringify({
                  domain,
                  organization: result.title || domain,
                  snippet: result.content || '',
                }),
              );
            }
          }
        } catch (err: any) {
          console.error(
            `[Source Discovery Engine] Tavily search failed for query "${query}": ${err.message}`,
          );
          // Continue to next query — never abort a batch
        }
      }

      // ────────────────────────────────────────────────────────────────────────
      // STEP 3: AI Domain Evaluation for all new domains found in this batch
      // ────────────────────────────────────────────────────────────────────────

      const domainCandidates = Array.from(newDomains).map((s) => JSON.parse(s));
      console.log(
        `[Source Discovery Engine] Batch ${batchIdx + 1}: Evaluating ${domainCandidates.length} new domains...`,
      );

      for (const candidate of domainCandidates) {
        const normDomain = candidate.domain.toLowerCase().trim();
        if (seenInRun.has(normDomain)) {
          duplicateSources++;
          console.log(`[Source Discovery] Skipped in-run duplicate: ${candidate.domain}`);
          continue;
        }
        seenInRun.add(normDomain);

        domainsEvaluated++;
        const outcome = await this.evaluateDomain(
          candidate.domain,
          candidate.organization,
          candidate.snippet,
        );

        if (outcome.kind === 'approved') {
          const result = outcome.evaluation;
          domainsApproved++;
          confidenceSamples.push(result.confidence);
          try {
            await sourceRegistryService.upsertSource({
              domain: candidate.domain,
              organization: candidate.organization,
              homepage: `https://${candidate.domain}`,
              sourceType: (result.suggestedSourceType || 'Other') as SourceType,
              category: result.suggestedCategory as SourceCategory,
              strategy: (result.suggestedStrategy || 'direct') as CrawlStrategy,
              crawlFrequency: (result.suggestedCrawlFrequency || 'weekly') as CrawlFrequency,
              trustScore: result.suggestedTrustScore ?? 60,
              priority: (result.suggestedPriority || 'medium') as SourcePriority,
              ecosystemType: mapSourceTypeToEcosystemType(result.suggestedSourceType) as any,
              confidence: result.confidence,
              reason: result.reason,
              verifiedByAIAt: new Date(),
              lastVerifiedAt: new Date(),
              discoveredBy: 'weekly-discovery',
              defaultTags: [],
              isActive: true,
            });
            console.log(
              `[Source Discovery Engine] ✅ Approved: ${candidate.domain} (${result.suggestedCategory}, trustScore: ${result.suggestedTrustScore})`,
            );
          } catch (err: any) {
            console.error(
              `[Source Discovery Engine] Failed to upsert ${candidate.domain}: ${err.message}`,
            );
          }
        } else if (outcome.kind === 'rejected') {
          domainsRejected++;
          confidenceSamples.push(outcome.evaluation.confidence);
          const { evaluation } = outcome;
          console.log(
            `[Source Discovery] Rejected Source\n` +
              `  Domain:    ${candidate.domain}\n` +
              `  Reason:    ${evaluation.reason || 'Not an opportunity source.'}\n` +
              `  Confidence: ${evaluation.confidence ?? 'N/A'}%`,
          );
        } else if (outcome.kind === 'duplicate') {
          duplicateSources++;
          console.log(`[Source Discovery] Skipped duplicate: ${candidate.domain}`);
        } else if (outcome.kind === 'invalid') {
          invalidResponses++;
          console.warn(
            `[Source Discovery] Invalid response for ${candidate.domain}: ${outcome.error}`,
          );
        } else {
          providerFailures++;
          console.error(
            `[Source Discovery] Provider failure for ${candidate.domain}: ${outcome.error}`,
          );
        }
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 4: Process affiliate queue (organic growth — zero extra Tavily calls)
    // ──────────────────────────────────────────────────────────────────────────

    const affiliateDomains = await AffiliateExtractor.drainQueue();
    let affiliateDomainsProcessed = 0;

    if (affiliateDomains.length > 0) {
      console.log(
        `\n[Source Discovery Engine] Step 4: Processing ${affiliateDomains.length} affiliate domains...`,
      );

      for (const domain of affiliateDomains) {
        // Skip if already registered (race condition guard)
        const exists = await sourceRegistryService.domainExists(domain);
        if (exists) {
          duplicateSources++;
          continue;
        }

        const normDomain = domain.toLowerCase().trim();
        if (seenInRun.has(normDomain)) {
          duplicateSources++;
          console.log(`[Source Discovery] Skipped in-run duplicate affiliate: ${domain}`);
          continue;
        }
        seenInRun.add(normDomain);

        affiliateDomainsProcessed++;
        domainsEvaluated++;

        const outcome = await this.evaluateDomain(domain, domain, '');
        if (outcome.kind === 'approved') {
          const result = outcome.evaluation;
          domainsApproved++;
          confidenceSamples.push(result.confidence);
          try {
            await sourceRegistryService.upsertSource({
              domain,
              organization: domain,
              homepage: `https://${domain}`,
              sourceType: (result.suggestedSourceType || 'Other') as SourceType,
              category: result.suggestedCategory as SourceCategory,
              strategy: (result.suggestedStrategy || 'direct') as CrawlStrategy,
              crawlFrequency: (result.suggestedCrawlFrequency || 'weekly') as CrawlFrequency,
              trustScore: result.suggestedTrustScore ?? 60,
              priority: (result.suggestedPriority || 'medium') as SourcePriority,
              ecosystemType: mapSourceTypeToEcosystemType(result.suggestedSourceType) as any,
              confidence: result.confidence,
              reason: result.reason,
              verifiedByAIAt: new Date(),
              lastVerifiedAt: new Date(),
              discoveredBy: 'affiliate-extraction',
              defaultTags: [],
              isActive: true,
            });
            console.log(
              `[Source Discovery Engine] ✅ Affiliate approved: ${domain} (${result.suggestedCategory})`,
            );
          } catch (err: any) {
            console.error(
              `[Source Discovery Engine] Failed to upsert affiliate ${domain}: ${err.message}`,
            );
          }
        } else if (outcome.kind === 'rejected') {
          domainsRejected++;
          confidenceSamples.push(outcome.evaluation.confidence);
          console.log(
            `[Source Discovery] Rejected Source\n` +
              `  Domain:    ${domain}\n` +
              `  Reason:    ${outcome.evaluation.reason || 'Not an opportunity source.'}\n` +
              `  Confidence: ${outcome.evaluation.confidence ?? 'N/A'}%`,
          );
        } else if (outcome.kind === 'invalid') {
          invalidResponses++;
          console.warn(
            `[Source Discovery] Invalid response for affiliate ${domain}: ${outcome.error}`,
          );
        } else if (outcome.kind === 'aiError') {
          providerFailures++;
          console.error(
            `[Source Discovery] Provider failure for affiliate ${domain}: ${outcome.error}`,
          );
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const averageConfidence =
      confidenceSamples.length > 0
        ? Math.round(confidenceSamples.reduce((a, b) => a + b, 0) / confidenceSamples.length)
        : 0;

    const report: SourceDiscoveryReport = {
      batchesRun: batches.length,
      domainsEvaluated,
      domainsApproved,
      domainsRejected,
      duplicateSources,
      invalidResponses,
      providerFailures,
      affiliateDomainsProcessed,
      averageConfidence,
      durationMs,
    };

    const telemetry = DiscoveryProviderManager.getInstance().metrics;

    console.log(`
========== Source Discovery Report ==========
Queries Generated:      ${totalQueries}
Domains Evaluated:      ${report.domainsEvaluated}
Approved:               ${report.domainsApproved}
Rejected:               ${report.domainsRejected}
Skipped (Duplicate):    ${report.duplicateSources}
Gemini Calls:           ${telemetry.geminiCalls}
Groq Calls:             ${telemetry.groqCalls}
Fallbacks:              ${telemetry.fallbacks}
Parser Recoveries:      ${telemetry.parserRecoveries}
Average Confidence:     ${report.averageConfidence}%
Duration:               ${(report.durationMs / 1000).toFixed(1)}s
===========================================`);

    return report;
  }

  // ─── AI Domain Evaluation ─────────────────────────────────────────────────

  private getReputationOverride(domain: string): AIDomainEvaluationOpportunity | null {
    const d = domain.toLowerCase().trim();
    if (d === 'github.com') {
      return {
        isOpportunitySource: true,
        confidence: 100,
        reason: 'Deterministic reputation override for GitHub.',
        suggestedSourceType: 'Platform',
        suggestedCategory: 'OPEN_SOURCE_PROGRAM',
        suggestedTrustScore: 90,
        suggestedPriority: 'medium',
        suggestedCrawlFrequency: 'weekly',
        suggestedStrategy: 'search',
      };
    }
    if (d === 'linkedin.com') {
      return {
        isOpportunitySource: true,
        confidence: 100,
        reason: 'Deterministic reputation override for LinkedIn.',
        suggestedSourceType: 'Platform',
        suggestedCategory: 'INTERNSHIPS',
        suggestedTrustScore: 80,
        suggestedPriority: 'medium',
        suggestedCrawlFrequency: 'weekly',
        suggestedStrategy: 'search',
      };
    }
    if (d === 'indeed.com') {
      return {
        isOpportunitySource: true,
        confidence: 100,
        reason: 'Deterministic reputation override for Indeed.',
        suggestedSourceType: 'Platform',
        suggestedCategory: 'INTERNSHIPS',
        suggestedTrustScore: 80,
        suggestedPriority: 'medium',
        suggestedCrawlFrequency: 'weekly',
        suggestedStrategy: 'search',
      };
    }
    if (d === 'hackerrank.com') {
      return {
        isOpportunitySource: true,
        confidence: 100,
        reason: 'Deterministic reputation override for HackerRank.',
        suggestedSourceType: 'Platform',
        suggestedCategory: 'HACKATHONS',
        suggestedTrustScore: 90,
        suggestedPriority: 'high',
        suggestedCrawlFrequency: 'weekly',
        suggestedStrategy: 'search',
      };
    }
    if (d === 'devpost.com') {
      return {
        isOpportunitySource: true,
        confidence: 100,
        reason: 'Deterministic reputation override for Devpost.',
        suggestedSourceType: 'Platform',
        suggestedCategory: 'HACKATHONS',
        suggestedTrustScore: 95,
        suggestedPriority: 'high',
        suggestedCrawlFrequency: 'weekly',
        suggestedStrategy: 'search',
      };
    }
    if (d === 'kaggle.com') {
      return {
        isOpportunitySource: true,
        confidence: 100,
        reason: 'Deterministic reputation override for Kaggle.',
        suggestedSourceType: 'Platform',
        suggestedCategory: 'STUDENT_COMPETITION',
        suggestedTrustScore: 95,
        suggestedPriority: 'medium',
        suggestedCrawlFrequency: 'weekly',
        suggestedStrategy: 'search',
      };
    }
    if (d === 'careers.google.com' || d.includes('google.com/careers') || d === 'google.com') {
      return {
        isOpportunitySource: true,
        confidence: 100,
        reason: 'Deterministic reputation override for Google Careers.',
        suggestedSourceType: 'Company',
        suggestedCategory: 'INTERNSHIPS',
        suggestedTrustScore: 98,
        suggestedPriority: 'critical',
        suggestedCrawlFrequency: 'weekly',
        suggestedStrategy: 'search',
      };
    }
    if (
      d === 'careers.microsoft.com' ||
      d.includes('microsoft.com/careers') ||
      d === 'microsoft.com'
    ) {
      return {
        isOpportunitySource: true,
        confidence: 100,
        reason: 'Deterministic reputation override for Microsoft Careers.',
        suggestedSourceType: 'Company',
        suggestedCategory: 'INTERNSHIPS',
        suggestedTrustScore: 98,
        suggestedPriority: 'critical',
        suggestedCrawlFrequency: 'weekly',
        suggestedStrategy: 'search',
      };
    }
    return null;
  }

  private async evaluateDomain(
    domain: string,
    organization: string,
    snippet: string,
  ): Promise<DomainEvaluationOutcome> {
    const override = this.getReputationOverride(domain);
    if (override) {
      console.log(
        `[Source Discovery Override] Applied reputation override for well-known domain: ${domain}`,
      );
      return { kind: 'approved', evaluation: override };
    }

    try {
      const result = (await generateStructuredResponse({
        prompt: buildDomainEvaluatorPrompt(domain, organization, snippet),
        schema: DomainEvaluationSchema,
        context: 'discovery',
        temperature: 0.1, // Low temperature for deterministic classification
        maxTokens: 512,
        sanitize: sanitizeAiOutput,
      })) as AIDomainEvaluation;

      if (result.isOpportunitySource) {
        const type = result.suggestedSourceType || 'Other';
        let threshold = 80; // Default threshold
        const domainLower = domain.toLowerCase();

        if (type === 'Government') threshold = 70;
        else if (type === 'University') threshold = 75;
        else if (domainLower.includes('medium.com')) threshold = 95;
        else if (domainLower.includes('github.io')) threshold = 90;
        else if (
          domainLower.includes('blog') ||
          domainLower.includes('wordpress') ||
          domainLower.includes('blogspot')
        )
          threshold = 95;

        if (result.confidence >= threshold) {
          return { kind: 'approved', evaluation: result as AIDomainEvaluationOpportunity };
        } else {
          return {
            kind: 'rejected',
            evaluation: {
              isOpportunitySource: false,
              confidence: result.confidence,
              reason: `Confidence score ${result.confidence}% is below adaptive threshold ${threshold}% for source type: ${type}`,
            } as any,
          };
        }
      }
      return { kind: 'rejected', evaluation: result as AIDomainEvaluationRejected };
    } catch (err: any) {
      const isInfra =
        err?.name === 'AISchemaValidationError'
          ? false // malformed response after retries → invalid, not infra
          : true; // network/timeout/provider errors → genuine infra failure

      if (isInfra) {
        console.error(
          `[Source Discovery Engine] Provider failure evaluating ${domain}: ${err.message}`,
        );
        return { kind: 'aiError', error: err.message };
      }
      console.warn(`[Source Discovery] Invalid response for ${domain}: ${err.message}`);
      return { kind: 'invalid', error: err.message };
    }
  }

  // ─── Fallback Queries ─────────────────────────────────────────────────────

  private getFallbackQueries(count: number): string[] {
    const fallback = [
      'women scholarship program 2026 apply',
      'women fellowship leadership social impact organization',
      'women internship program technology engineering 2026',
      'hackathon competition women participants 2026',
      'women entrepreneur grant funding accelerator india',
      'government scheme women skill development training india 2026',
      'NGO women education livelihood program india',
      'women research fellowship university india',
      'career returnship program women break india 2026',
      'women conference community tech india 2026',
      'rural women development program government scheme',
      'women microfinance self help group loan india',
      'international fellowship women developing countries 2026',
      'women coding bootcamp training scholarship',
      'social entrepreneurship grant women impact india',
      'UN women program india opportunity apply',
      'state government women scheme scholarship jobs india',
      'women in STEM mentorship program india 2026',
      'tribal rural women education opportunity government',
      'women startup incubator accelerator india program',
    ];
    return fallback.slice(0, count);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractDomainFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('www.')) hostname = hostname.slice(4);
    return hostname;
  } catch {
    return null;
  }
}
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function mapSourceTypeToEcosystemType(sourceType: string | undefined): string {
  if (!sourceType) return 'UNIVERSITY';
  const type = sourceType.toLowerCase();
  if (type === 'company' || type === 'startup') return 'STARTUP';
  if (type === 'university' || type === 'education') return 'UNIVERSITY';
  if (type === 'government') return 'GOVERNMENT';
  if (type === 'ngo' || type === 'non-profit' || type === 'non_profit') return 'NON_PROFIT';
  if (type === 'open source' || type === 'open_source') return 'OPEN_SOURCE';
  if (type === 'community' || type === 'platform' || type === 'hackathon') return 'COMMUNITY';
  return 'UNIVERSITY';
}
