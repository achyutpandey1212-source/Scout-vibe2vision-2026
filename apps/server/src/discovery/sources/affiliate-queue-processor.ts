import { AffiliateExtractor } from './affiliate-extractor';
import { sourceRegistryService } from './source-registry.service';
import { AffiliateCheckpointModel } from './affiliate-checkpoint.model';
import { DashboardStateInstance } from '../utils/dashboard-state';
import { AffiliateBudgetManager } from './affiliate-budget-manager';
import { AffiliateRetryQueue } from './affiliate-retry-queue';
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
  requeuedCount: number;
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
   * Evaluates a single candidate domain.
   * Differentiates transient provider failures from permanent evaluation/parser errors.
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
      const errMessage = err?.message || String(err);
      // Differentiate transient provider errors (rate limit 429, quota, 503, timeout) from permanent parser errors
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
   * Executes the budget-aware streaming batch pipeline for the affiliate queue.
   */
  async processQueue(options?: {
    batchSize?: number;
    maxDomainsPerRun?: number;
    maxAiCallsPerRun?: number;
  }): Promise<AffiliateBatchSummary[]> {
    const batchSizeRaw = process.env.AFFILIATE_BATCH_SIZE;
    const batchSize = options?.batchSize || (batchSizeRaw ? parseInt(batchSizeRaw, 10) : 25);
    const budgetManager = new AffiliateBudgetManager(options);
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

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Affiliate Processor V5] Starting Budget-Aware Streaming Pipeline
Batch Size:           ${batchSize} (Config: AFFILIATE_BATCH_SIZE)
Max Domains Per Run:  ${budgetManager.getStats().maxDomainsPerRun} (Config: AFFILIATE_MAX_DOMAINS_PER_RUN)
Max AI Calls:         ${budgetManager.getStats().maxAiCallsPerRun} (Config: AFFILIATE_MAX_AI_CALLS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    while (isQueueActive && budgetManager.canContinue()) {
      budgetManager.incrementBatch();
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

      const totalBatches = Math.ceil(totalPending / batchSize);
      const batchDomains = currentQueue.slice(0, batchSize);
      const batchStart = Date.now();

      let batchApproved = 0;
      let batchRejected = 0;
      let batchDuplicates = 0;
      let batchRequeued = 0;
      let batchRegistryAdded = 0;

      const processedInBatch: string[] = [];

      for (const domain of batchDomains) {
        if (!budgetManager.canContinue()) {
          console.log(`[Affiliate Processor] Run budget limit reached during batch processing.`);
          break;
        }

        // Check duplicate against MongoDB registry
        const exists = await sourceRegistryService.domainExists(domain);
        if (exists) {
          batchDuplicates++;
          processedInBatch.push(domain);
          budgetManager.recordProcessed();
          continue;
        }

        budgetManager.recordAICall();
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
          processedInBatch.push(domain);
          budgetManager.recordProcessed();
        } else if (outcome.kind === 'rejected' || outcome.kind === 'invalid') {
          batchRejected++;
          // Permanent rejection or invalid structure -> remove permanently from queue
          processedInBatch.push(domain);
          budgetManager.recordProcessed();
        } else if (outcome.kind === 'aiError') {
          // Transient AI Provider failure -> Enqueue in Retry Queue and remove from main queue
          batchRequeued++;
          await AffiliateRetryQueue.enqueue(domain, outcome.error);
          processedInBatch.push(domain);
          budgetManager.recordProcessed();
          console.warn(
            `[Affiliate Processor] Transient provider failure for ${domain}. Moved to Retry Queue.`,
          );
        }
      }

      // Immediate Removal of processed items from main Redis queue
      if (processedInBatch.length > 0) {
        await AffiliateExtractor.removeFromQueue(processedInBatch);
      }

      const durationMs = Date.now() - batchStart;
      const remainingCount = Math.max(0, totalPending - processedInBatch.length);
      const retryStats = await AffiliateRetryQueue.getStats();

      // Accumulate totals into MongoDB checkpoint
      const newTotalProcessed = checkpoint.totalProcessed + processedInBatch.length;
      const newApproved = checkpoint.approvedCount + batchApproved;
      const newRejected = checkpoint.rejectedCount + batchRejected;
      const newDuplicates = checkpoint.duplicateCount + batchDuplicates;
      const lastUrl = processedInBatch[processedInBatch.length - 1] || checkpoint.lastProcessedUrl;

      const isBudgetFinished = !budgetManager.canContinue();
      const newStatus =
        remainingCount === 0 ? 'completed' : isBudgetFinished ? 'paused' : 'running';
      const budgetStats = budgetManager.getStats();
      const estimatedRunsRemaining = Math.ceil(remainingCount / budgetStats.maxDomainsPerRun);

      await AffiliateCheckpointModel.updateOne(
        { key: 'affiliate_queue_checkpoint' },
        {
          $set: {
            status: newStatus,
            totalProcessed: newTotalProcessed,
            approvedCount: newApproved,
            rejectedCount: newRejected,
            duplicateCount: newDuplicates,
            processedThisRun: budgetStats.domainsProcessed,
            remainingQueue: remainingCount,
            retryQueueSize: retryStats.totalPending,
            aiCallsUsed: budgetStats.aiCallsUsed,
            maxDomains: budgetStats.maxDomainsPerRun,
            maxAiCalls: budgetStats.maxAiCallsPerRun,
            estimatedRunsRemaining,
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
        batchNumber: budgetStats.batchCount,
        totalBatches,
        urlsProcessed: processedInBatch.length,
        approvedCount: batchApproved,
        rejectedCount: batchRejected,
        duplicateCount: batchDuplicates,
        requeuedCount: batchRequeued,
        registryAdded: batchRegistryAdded,
        remainingQueue: remainingCount,
        durationMs,
      };

      summaries.push(summary);

      // Emit Progress to Dashboard State
      const progressPercentage =
        budgetStats.domainsProcessed + remainingCount > 0
          ? Math.round((budgetStats.domainsProcessed / budgetStats.maxDomainsPerRun) * 100)
          : 100;

      DashboardStateInstance.updateState({
        affiliateQueueState: {
          totalPending: remainingCount,
          batchSize,
          estimatedBatches: Math.ceil(remainingCount / batchSize),
          currentCursor: newTotalProcessed,
          progressPercentage: Math.min(100, progressPercentage),
          currentBatch: budgetStats.batchCount,
          processed: newTotalProcessed,
          remaining: remainingCount,
          status: newStatus as any,
          pauseReason: isBudgetFinished ? 'Run budget limit reached' : undefined,
        },
      });

      // Concise Batch Console Log
      console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Affiliate Batch ${budgetStats.batchCount} / ${totalBatches}

URLs:              ${summary.urlsProcessed}
Approved:          ${summary.approvedCount}
Rejected:          ${summary.rejectedCount}
Duplicates:        ${summary.duplicateCount}
Retry Queued:      ${summary.requeuedCount}
Registry Added:    ${summary.registryAdded}
Processed Run:     ${budgetStats.domainsProcessed} / ${budgetStats.maxDomainsPerRun}
Remaining Queue:   ${summary.remainingQueue}
Retry Queue Size:  ${retryStats.totalPending}
Duration:          ${(summary.durationMs / 1000).toFixed(1)} s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    }

    const totalDurationMs = Date.now() - startTime;
    const batchTimes = summaries.map((s) => s.durationMs);
    const avgBatchMs =
      batchTimes.length > 0
        ? Math.round(batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length)
        : 0;

    const totalProcessedRun = summaries.reduce((sum, s) => sum + s.urlsProcessed, 0);
    const totalApprovedRun = summaries.reduce((sum, s) => sum + s.approvedCount, 0);
    const totalRejectedRun = summaries.reduce((sum, s) => sum + s.rejectedCount, 0);
    const totalDuplicatesRun = summaries.reduce((sum, s) => sum + s.duplicateCount, 0);
    const totalRetryQueuedRun = summaries.reduce((sum, s) => sum + s.requeuedCount, 0);
    const totalRegistryRun = summaries.reduce((sum, s) => sum + s.registryAdded, 0);
    const finalRemaining = await AffiliateExtractor.getQueueDepth();
    const retryStats = await AffiliateRetryQueue.getStats();
    const budgetStats = budgetManager.getStats();
    const estimatedRunsLeft = Math.ceil(finalRemaining / budgetStats.maxDomainsPerRun);

    // Print Final Summary Telemetry Report
    console.log(`
========== Affiliate Queue Report ==========
Run Budget:             ${budgetStats.maxDomainsPerRun}
Processed:              ${totalProcessedRun} / ${budgetStats.maxDomainsPerRun}
Approved:               ${totalApprovedRun}
Rejected:               ${totalRejectedRun}
Duplicates:             ${totalDuplicatesRun}
Retry Queued:           ${totalRetryQueuedRun}
Registry Added:         ${totalRegistryRun}
Remaining Queue:        ${finalRemaining}
Retry Queue Size:       ${retryStats.totalPending}
AI Calls Used:          ${budgetStats.aiCallsUsed}
Estimated Runs Left:    ${estimatedRunsLeft}
Average Batch Time:     ${(avgBatchMs / 1000).toFixed(1)}s
Total Runtime:          ${(totalDurationMs / 1000).toFixed(1)}s
============================================`);

    return summaries;
  }
}
