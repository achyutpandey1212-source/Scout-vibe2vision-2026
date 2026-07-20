import { AffiliateExtractor } from './affiliate-extractor';
import { sourceRegistryService } from './source-registry.service';
import { AffiliateCheckpointModel } from './affiliate-checkpoint.model';
import { DashboardStateInstance } from '../utils/dashboard-state';
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

export interface AffiliateBatchSummary {
  batchNumber: number;
  totalBatches: number;
  urlsProcessed: number;
  approvedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  registryAdded: number;
  remainingQueue: number;
  durationMs: number;
}

export class AffiliateQueueProcessor {
  /**
   * Deterministic reputation overrides for authoritative well-known domains.
   */
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
    return null;
  }

  /**
   * Evaluates a single candidate domain with adaptive confidence thresholds.
   */
  private async evaluateDomain(domain: string): Promise<DomainEvaluationOutcome> {
    const override = this.getReputationOverride(domain);
    if (override) {
      return { kind: 'approved', evaluation: override };
    }

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
        const type = result.suggestedSourceType || 'Other';
        let threshold = 80;
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
              reason: `Confidence ${result.confidence}% below threshold ${threshold}% for type ${type}`,
            } as any,
          };
        }
      }
      return { kind: 'rejected', evaluation: result as AIDomainEvaluationRejected };
    } catch (err: any) {
      const isInfra = err?.name !== 'AISchemaValidationError';
      if (isInfra) {
        return { kind: 'aiError', error: err.message };
      }
      return { kind: 'invalid', error: err.message };
    }
  }

  /**
   * Executes the streaming batch pipeline for the affiliate queue.
   */
  async processQueue(options?: { batchSize?: number }): Promise<AffiliateBatchSummary[]> {
    const batchSizeRaw = process.env.AFFILIATE_BATCH_SIZE;
    const batchSize = options?.batchSize || (batchSizeRaw ? parseInt(batchSizeRaw, 10) : 25);
    const startTime = Date.now();

    // 1. Fetch or initialize persistent checkpoint
    let checkpoint = await AffiliateCheckpointModel.findOne({ key: 'affiliate_queue_checkpoint' });
    if (!checkpoint) {
      checkpoint = await AffiliateCheckpointModel.create({
        key: 'affiliate_queue_checkpoint',
        status: 'idle',
        totalProcessed: 0,
        approvedCount: 0,
        rejectedCount: 0,
        duplicateCount: 0,
      });
    }

    // Update status to running
    await AffiliateCheckpointModel.updateOne(
      { key: 'affiliate_queue_checkpoint' },
      { $set: { status: 'running', updatedAt: new Date() } },
    );

    const summaries: AffiliateBatchSummary[] = [];
    let isQueueActive = true;
    let batchIndex = 0;

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Affiliate Processor V4] Starting Streaming Batch Pipeline
Batch Size: ${batchSize} (Config: AFFILIATE_BATCH_SIZE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    while (isQueueActive) {
      // Fetch current queue items from Redis
      const currentQueue = await AffiliateExtractor.getQueueItems();
      const totalPending = currentQueue.length;

      if (totalPending === 0) {
        console.log('[Affiliate Processor] Queue is empty. Pipeline complete.');
        await AffiliateCheckpointModel.updateOne(
          { key: 'affiliate_queue_checkpoint' },
          { $set: { status: 'completed', updatedAt: new Date() } },
        );
        isQueueActive = false;
        break;
      }

      batchIndex++;
      const totalBatches = Math.ceil(totalPending / batchSize);
      const batchDomains = currentQueue.slice(0, batchSize);
      const batchStart = Date.now();

      let batchApproved = 0;
      let batchRejected = 0;
      let batchDuplicates = 0;
      let batchRegistryAdded = 0;
      let isPausedByError = false;

      // Arrays for batch execution
      const processedInBatch: string[] = [];

      for (const domain of batchDomains) {
        // Skip duplicate check against MongoDB registry
        const exists = await sourceRegistryService.domainExists(domain);
        if (exists) {
          batchDuplicates++;
          processedInBatch.push(domain);
          continue;
        }

        const outcome = await this.evaluateDomain(domain);
        if (outcome.kind === 'approved') {
          const res = outcome.evaluation;
          batchApproved++;
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
            batchRegistryAdded++;
          } catch (err: any) {
            console.error(`[Affiliate Processor] Failed to upsert ${domain}: ${err.message}`);
          }
        } else if (outcome.kind === 'rejected' || outcome.kind === 'invalid') {
          batchRejected++;
        } else if (outcome.kind === 'aiError') {
          console.warn(
            `[Affiliate Processor] AI Provider error evaluating ${domain}: ${outcome.error}`,
          );
          isPausedByError = true;
          break;
        }

        processedInBatch.push(domain);
      }

      // Immediate Removal of processed items from Redis queue
      if (processedInBatch.length > 0) {
        await AffiliateExtractor.removeFromQueue(processedInBatch);
      }

      const durationMs = Date.now() - batchStart;
      const remainingCount = Math.max(0, totalPending - processedInBatch.length);

      // Accumulate totals into MongoDB checkpoint immediately
      const newTotalProcessed = checkpoint.totalProcessed + processedInBatch.length;
      const newApproved = checkpoint.approvedCount + batchApproved;
      const newRejected = checkpoint.rejectedCount + batchRejected;
      const newDuplicates = checkpoint.duplicateCount + batchDuplicates;
      const lastUrl = processedInBatch[processedInBatch.length - 1] || checkpoint.lastProcessedUrl;

      const newStatus = isPausedByError ? 'paused' : remainingCount === 0 ? 'completed' : 'running';

      await AffiliateCheckpointModel.updateOne(
        { key: 'affiliate_queue_checkpoint' },
        {
          $set: {
            status: newStatus,
            totalProcessed: newTotalProcessed,
            approvedCount: newApproved,
            rejectedCount: newRejected,
            duplicateCount: newDuplicates,
            lastProcessedUrl: lastUrl,
            updatedAt: new Date(),
          },
        },
      );

      // Update in-memory checkpoint tracker
      checkpoint.totalProcessed = newTotalProcessed;
      checkpoint.approvedCount = newApproved;
      checkpoint.rejectedCount = newRejected;
      checkpoint.duplicateCount = newDuplicates;
      checkpoint.lastProcessedUrl = lastUrl;

      const summary: AffiliateBatchSummary = {
        batchNumber: batchIndex,
        totalBatches,
        urlsProcessed: processedInBatch.length,
        approvedCount: batchApproved,
        rejectedCount: batchRejected,
        duplicateCount: batchDuplicates,
        registryAdded: batchRegistryAdded,
        remainingQueue: remainingCount,
        durationMs,
      };

      summaries.push(summary);

      // Emit Progress to Dashboard State
      const progressPercentage =
        newTotalProcessed + remainingCount > 0
          ? Math.round((newTotalProcessed / (newTotalProcessed + remainingCount)) * 100)
          : 100;

      DashboardStateInstance.updateState({
        affiliateQueueState: {
          totalPending: remainingCount,
          batchSize,
          estimatedBatches: Math.ceil(remainingCount / batchSize),
          currentCursor: newTotalProcessed,
          progressPercentage,
          currentBatch: batchIndex,
          processed: newTotalProcessed,
          remaining: remainingCount,
          status: newStatus as any,
          pauseReason: isPausedByError ? 'AI Quota / Infrastructure Failure' : undefined,
        },
      });

      // Concise Batch Console Log
      console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Affiliate Batch ${batchIndex} / ${totalBatches}

URLs:            ${summary.urlsProcessed}
Approved:        ${summary.approvedCount}
Rejected:        ${summary.rejectedCount}
Duplicates:      ${summary.duplicateCount}
Registry Added:  ${summary.registryAdded}
Remaining:       ${summary.remainingQueue}
Duration:        ${(summary.durationMs / 1000).toFixed(1)} s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // If paused due to provider quota, stop loop cleanly
      if (isPausedByError) {
        console.warn(
          `[Affiliate Processor] Paused queue processing due to provider errors. Checkpoint saved.`,
        );
        break;
      }
    }

    const totalDurationMs = Date.now() - startTime;
    const batchTimes = summaries.map((s) => s.durationMs);
    const avgBatchMs =
      batchTimes.length > 0
        ? Math.round(batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length)
        : 0;
    const fastestBatchMs = batchTimes.length > 0 ? Math.min(...batchTimes) : 0;
    const slowestBatchMs = batchTimes.length > 0 ? Math.max(...batchTimes) : 0;

    const totalProcessedRun = summaries.reduce((sum, s) => sum + s.urlsProcessed, 0);
    const totalApprovedRun = summaries.reduce((sum, s) => sum + s.approvedCount, 0);
    const totalRejectedRun = summaries.reduce((sum, s) => sum + s.rejectedCount, 0);
    const totalDuplicatesRun = summaries.reduce((sum, s) => sum + s.duplicateCount, 0);
    const totalRegistryRun = summaries.reduce((sum, s) => sum + s.registryAdded, 0);
    const finalRemaining = await AffiliateExtractor.getQueueDepth();

    // Print Final Summary Telemetry Report
    console.log(`
========== Affiliate Queue Report ==========
Queue Size:           ${totalProcessedRun + finalRemaining}
Processed:            ${totalProcessedRun}
Approved:             ${totalApprovedRun}
Rejected:             ${totalRejectedRun}
Duplicates:           ${totalDuplicatesRun}
Registry Added:       ${totalRegistryRun}
Remaining:            ${finalRemaining}
Average Batch Time:   ${(avgBatchMs / 1000).toFixed(1)}s
Fastest Batch:        ${(fastestBatchMs / 1000).toFixed(1)}s
Slowest Batch:        ${(slowestBatchMs / 1000).toFixed(1)}s
Total Runtime:        ${(totalDurationMs / 1000).toFixed(1)}s
============================================`);

    return summaries;
  }
}
