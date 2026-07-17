import { z } from 'zod';
import { TavilyClient } from '../search/tavily.client';
import { sourceRegistryService } from './source-registry.service';
import { AffiliateExtractor } from './affiliate-extractor';
import { buildQueryGeneratorPrompt, buildDomainEvaluatorPrompt } from './source-discovery.prompt';
import { generateStructuredResponse } from '../../ai/capabilities/structured-output';
import { safeParseJson } from '../../ai/utils/parser';
import {
  SourceDiscoveryReport,
  AIDomainEvaluation,
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

const DomainEvaluationSchema = z.object({
  isOpportunitySource: z.boolean(),
  confidence: z.number().min(0).max(100),
  reason: z.string(),
  suggestedSourceType: z.enum([
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
  ]),
  suggestedCategory: z.enum(ACTIVE_SOURCE_CATEGORIES as [SourceCategory, ...SourceCategory[]]),
  suggestedTrustScore: z.number().min(0).max(100),
  suggestedPriority: z.enum(['critical', 'high', 'medium', 'low']),
  suggestedCrawlFrequency: z.enum(['daily', 'weekly', 'monthly']),
  suggestedStrategy: z.enum(['direct', 'search', 'sitemap', 'rss']),
});

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
        domainsEvaluated++;
        const result = await this.evaluateDomain(
          candidate.domain,
          candidate.organization,
          candidate.snippet,
        );

        if (result && result.isOpportunitySource) {
          domainsApproved++;
          try {
            await sourceRegistryService.upsertSource({
              domain: candidate.domain,
              organization: candidate.organization,
              homepage: `https://${candidate.domain}`,
              sourceType: result.suggestedSourceType as SourceType,
              category: result.suggestedCategory as SourceCategory,
              strategy: result.suggestedStrategy as CrawlStrategy,
              crawlFrequency: result.suggestedCrawlFrequency as CrawlFrequency,
              trustScore: result.suggestedTrustScore,
              priority: result.suggestedPriority as SourcePriority,
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
        } else {
          domainsRejected++;
          console.log(
            `[Source Discovery Engine] ❌ Rejected: ${candidate.domain} — ${result?.reason || 'AI evaluation failed'}`,
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
        if (exists) continue;

        affiliateDomainsProcessed++;
        domainsEvaluated++;

        const result = await this.evaluateDomain(domain, domain, '');
        if (result && result.isOpportunitySource) {
          domainsApproved++;
          try {
            await sourceRegistryService.upsertSource({
              domain,
              organization: domain,
              homepage: `https://${domain}`,
              sourceType: result.suggestedSourceType as SourceType,
              category: result.suggestedCategory as SourceCategory,
              strategy: result.suggestedStrategy as CrawlStrategy,
              crawlFrequency: result.suggestedCrawlFrequency as CrawlFrequency,
              trustScore: result.suggestedTrustScore,
              priority: result.suggestedPriority as SourcePriority,
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
        } else {
          domainsRejected++;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const durationSec = (durationMs / 1000).toFixed(1);

    const report: SourceDiscoveryReport = {
      batchesRun: batches.length,
      domainsEvaluated,
      domainsApproved,
      domainsRejected,
      affiliateDomainsProcessed,
      durationMs,
    };

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Source Discovery Engine] Run Complete
Batches run:              ${report.batchesRun}
Domains evaluated:        ${report.domainsEvaluated}
Domains approved:         ${report.domainsApproved}
Domains rejected:         ${report.domainsRejected}
Affiliate domains:        ${report.affiliateDomainsProcessed}
Duration:                 ${durationSec}s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    return report;
  }

  // ─── AI Domain Evaluation ─────────────────────────────────────────────────

  private async evaluateDomain(
    domain: string,
    organization: string,
    snippet: string,
  ): Promise<AIDomainEvaluation | null> {
    try {
      const result = await generateStructuredResponse({
        prompt: buildDomainEvaluatorPrompt(domain, organization, snippet),
        schema: DomainEvaluationSchema,
        context: 'discovery',
        temperature: 0.1, // Low temperature for deterministic classification
        maxTokens: 512,
      });
      return result as AIDomainEvaluation;
    } catch (err: any) {
      console.error(
        `[Source Discovery Engine] Domain evaluation failed for ${domain}: ${err.message}`,
      );
      return null;
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
