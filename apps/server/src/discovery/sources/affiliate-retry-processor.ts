import { AffiliateRetryQueue, RetryItemMetadata } from './affiliate-retry-queue';
import { sourceRegistryService } from './source-registry.service';
import { generateStructuredResponse } from '../../ai/capabilities/structured-output';
import { sanitizeAiOutput } from './ai-output-sanitizer';
import { buildDomainEvaluatorPrompt } from './source-discovery.prompt';
import { z } from 'zod';
import {
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

// Zod Evaluation Schemas
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

const OpportunityEvaluationSchema = EvaluationBaseSchema.extend({
  isOpportunitySource: z.literal(true),
  suggestedCategory: z.enum(ACTIVE_SOURCE_CATEGORIES as [SourceCategory, ...SourceCategory[]]),
  suggestedTrustScore: z.number().min(0).max(100),
  suggestedPriority: z.enum(['critical', 'high', 'medium', 'low']),
  suggestedCrawlFrequency: z.enum(['daily', 'weekly', 'monthly']),
  suggestedStrategy: z.enum(['direct', 'search', 'sitemap', 'rss']),
});

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

const DomainEvaluationSchema = z.union([OpportunityEvaluationSchema, RejectedEvaluationSchema]);

export interface RetryBatchSummary {
  batchNumber: number;
  urlsProcessed: number;
  approvedCount: number;
  rejectedCount: number;
  requeuedCount: number;
  registryAdded: number;
  remainingRetryQueue: number;
  durationMs: number;
}

export class AffiliateRetryProcessor {
  /**
   * Evaluates a single candidate domain.
   * Differentiates transient provider failures from permanent evaluation errors.
   */
  private async evaluateDomain(domain: string): Promise<DomainEvaluationOutcome> {
    try {
      const result = (await generateStructuredResponse({
        prompt: buildDomainEvaluatorPrompt(domain, domain, ''),
        schema: DomainEvaluationSchema,
        context: 'discovery',
        temperature: 0.1,
        maxTokens: 512,
        sanitize: sanitizeAiOutput,
      })) as AIDomainEvaluation;

      if (result.isOpportunitySource) {
        return { kind: 'approved', evaluation: result as AIDomainEvaluationOpportunity };
      }
      return { kind: 'rejected', evaluation: result as AIDomainEvaluationRejected };
    } catch (err: any) {
      const errMessage = err?.message || String(err);
      // Differentiate transient provider errors (quota 429, 503, timeout, rate limits) from permanent parser errors
      const isTransient =
        errMessage.includes('429') ||
        errMessage.includes('quota') ||
        errMessage.includes('503') ||
        errMessage.includes('timeout') ||
        errMessage.includes('rate limit') ||
        err?.name !== 'AISchemaValidationError';

      if (isTransient) {
        return { kind: 'aiError', error: errMessage };
      }
      return { kind: 'invalid', error: errMessage };
    }
  }

  /**
   * Runs the retry queue processor for items ready for retry.
   */
  async processRetryQueue(options?: { batchSize?: number }): Promise<RetryBatchSummary[]> {
    const batchSize = options?.batchSize || 25;
    const startTime = Date.now();
    const summaries: RetryBatchSummary[] = [];

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Affiliate Retry Processor] Starting Processing of Retry Queue
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const readyItems = await AffiliateRetryQueue.getReadyItems(batchSize);
    if (readyItems.length === 0) {
      console.log('[Affiliate Retry Processor] No domains are currently ready for retry.');
      return [];
    }

    const batchStart = Date.now();
    let approvedCount = 0;
    let rejectedCount = 0;
    let requeuedCount = 0;
    let registryAdded = 0;

    const removedFromRetry: string[] = [];

    for (const item of readyItems) {
      const domain = item.domain;
      const outcome = await this.evaluateDomain(domain);

      if (outcome.kind === 'approved') {
        const res = outcome.evaluation;
        approvedCount++;
        try {
          await sourceRegistryService.upsertSource({
            domain,
            organization: domain,
            homepage: `https://${domain}`,
            sourceType: (res.suggestedSourceType || 'Other') as SourceType,
            category: res.suggestedCategory as SourceCategory,
            strategy: (res.suggestedStrategy || 'direct') as CrawlStrategy,
            crawlFrequency: (res.suggestedCrawlFrequency || 'weekly') as CrawlFrequency,
            trustScore: res.suggestedTrustScore ?? 60,
            priority: (res.suggestedPriority || 'medium') as SourcePriority,
            confidence: res.confidence,
            reason: res.reason,
            verifiedByAIAt: new Date(),
            lastVerifiedAt: new Date(),
            discoveredBy: 'affiliate-extraction',
            defaultTags: [],
            isActive: true,
          });
          registryAdded++;
        } catch (err: any) {
          console.error(`[Affiliate Retry Processor] Failed to upsert ${domain}: ${err.message}`);
        }
        removedFromRetry.push(domain);
      } else if (outcome.kind === 'rejected' || outcome.kind === 'invalid') {
        rejectedCount++;
        // Permanent failure or rejection -> remove permanently from retry queue
        removedFromRetry.push(domain);
      } else if (outcome.kind === 'aiError') {
        requeuedCount++;
        // Transient AI Provider failure -> update retry backoff in Retry Queue
        await AffiliateRetryQueue.enqueue(domain, outcome.error);
      }
    }

    if (removedFromRetry.length > 0) {
      await AffiliateRetryQueue.remove(removedFromRetry);
    }

    const durationMs = Date.now() - batchStart;
    const retryStats = await AffiliateRetryQueue.getStats();

    const summary: RetryBatchSummary = {
      batchNumber: 1,
      urlsProcessed: readyItems.length,
      approvedCount,
      rejectedCount,
      requeuedCount,
      registryAdded,
      remainingRetryQueue: retryStats.totalPending,
      durationMs,
    };

    summaries.push(summary);

    console.log(`
========== Affiliate Retry Report ==========
Processed:            ${summary.urlsProcessed}
Approved:             ${summary.approvedCount}
Rejected:             ${summary.rejectedCount}
Requeued (Backoff):   ${summary.requeuedCount}
Registry Added:       ${summary.registryAdded}
Remaining Retry Queue: ${summary.remainingRetryQueue}
Duration:             ${(summary.durationMs / 1000).toFixed(1)}s
============================================`);

    return summaries;
  }
}
