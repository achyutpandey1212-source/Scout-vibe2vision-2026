import { ProfileModel, ResumeModel } from '../../../profile';
import { RecommendationService } from '../service/recommendation.service';
import { CandidateRetrievalService } from '../service/candidate-retrieval.service';
import { HardFilterEngine } from '../engine/hard-filter.engine';
import { ScoringEngine } from '../engine/scoring.engine';
import { DiversificationEngine } from '../engine/diversification.engine';
import { PersonalizationService } from '../ai/personalization.service';
import { RecommendationPackBuilder } from '../builder/recommendation-pack.builder';
import { RecommendationRepository } from '../repository/recommendation.repository';
import { RecommendationGenerationReason } from '../types/recommendation.types';
import { RecommendationConfig } from '../config/recommendation-config';
import { ScoringExperimentsService } from '../experiments/scoring-experiments.service';
import { RecommendationQualityService } from '../quality/recommendation-quality.service';
import { FallbackPersonalization } from '../ai/fallback-personalization';
import { IAIPersonalizationMetadata, IAIPersonalizationResponse } from '../ai/ai.types';
import mongoose from 'mongoose';

export class BackgroundGenerationService {
  // Global memory lock to track active generation tasks by userId
  private static activeLocks = new Set<string>();

  /**
   * Safe entry point to trigger background generation asynchronously.
   * Acquires a lock for the user, creates the GENERATING pack, and starts the worker thread.
   */
  static async trigger(
    userId: string,
    profileHash: string,
    reason: RecommendationGenerationReason,
  ): Promise<void> {
    if (this.activeLocks.has(userId)) {
      console.log(
        `[Recommendation] Generation already in progress for user ${userId}. Skipping duplicate trigger.`,
      );
      return;
    }

    // Acquire lock synchronously immediately
    this.activeLocks.add(userId);

    // Trigger asynchronously
    this.startWorkerAsync(userId, profileHash, reason);
  }

  private static async startWorkerAsync(
    userId: string,
    profileHash: string,
    reason: RecommendationGenerationReason,
  ): Promise<void> {
    let packId = '';
    try {
      const generatingPack = await RecommendationService.createGeneratingPack(
        userId,
        profileHash,
        reason,
      );
      packId = generatingPack._id.toString();
      await this.runWorker(packId, userId, profileHash, reason);
    } catch (err: any) {
      console.error(`[Recommendation] Failed to initialize background generation:`, err.message);
      if (packId) {
        await RecommendationService.markFailed(packId).catch(() => {});
      }
    } finally {
      this.activeLocks.delete(userId);
    }
  }

  /**
   * Background worker execution thread.
   */
  private static async runWorker(
    packId: string,
    userId: string,
    profileHash: string,
    reason: RecommendationGenerationReason,
  ): Promise<void> {
    const startTime = Date.now();
    let initialCount = 0;
    let filteredCount = 0;
    let fallbackUsed = false;
    let repairUsed = false;
    let success = false;
    let aiLatency = 0;
    let promptHashVal = '';

    try {
      // 1. Assign Experiment Group and load configurations
      const experimentGroup = ScoringExperimentsService.assignGroup(userId);
      const flags = RecommendationConfig.getFlags();
      const weights = RecommendationConfig.getWeights(experimentGroup);

      // 2. Retrieving
      await RecommendationRepository.updateProgressPhase(packId, 'RETRIEVING');
      const rawCandidates = await CandidateRetrievalService.fetchActiveCandidates();
      initialCount = rawCandidates.length;

      // Fetch user profile and resume
      const profile = await ProfileModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      }).exec();
      if (!profile) {
        throw new Error('User profile not found. Complete onboarding first.');
      }
      const resume = await ResumeModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      }).exec();

      // 3. Filtering
      await RecommendationRepository.updateProgressPhase(packId, 'FILTERING');
      const { pool } = HardFilterEngine.run(rawCandidates, profile);
      filteredCount = pool.length;

      const filteredOpps = pool.map((e) => e.opportunity);

      // 4. Scoring
      await RecommendationRepository.updateProgressPhase(packId, 'SCORING');
      const scoredCandidates = ScoringEngine.run(filteredOpps, profile, weights);

      // 5. Diversifying
      await RecommendationRepository.updateProgressPhase(packId, 'DIVERSIFYING');
      let top5Candidates = scoredCandidates.slice(0, 5);
      if (flags.enableDiversification) {
        top5Candidates = DiversificationEngine.diversify(scoredCandidates, 5);
      }

      // 6. Personalizing (skip if AI Personalization flag is disabled)
      await RecommendationRepository.updateProgressPhase(packId, 'PERSONALIZING');

      let aiResponse: IAIPersonalizationResponse;
      let aiMeta: IAIPersonalizationMetadata;

      if (flags.enableAIPersonalization) {
        const aiResult = await PersonalizationService.personalize(profile, resume, top5Candidates);
        aiResponse = aiResult.response;
        aiMeta = aiResult.metadata;
        fallbackUsed = aiMeta.fallbackUsed;
        repairUsed = aiMeta.repairUsed;
        aiLatency = aiMeta.latencyMs;
        promptHashVal = aiMeta.promptHash;
      } else {
        fallbackUsed = true;
        aiResponse = FallbackPersonalization.generate(top5Candidates);
        aiMeta = {
          provider: 'local-fallback',
          model: 'fallback',
          latencyMs: 0,
          promptVersion: 'N/A',
          schemaVersion: 'N/A',
          engineVersion: 'N/A',
          fallbackUsed: true,
          repairUsed: false,
          promptLength: 0,
          responseLength: 0,
          promptHash: '',
        };
        promptHashVal = '';
      }

      // 7. Quality evaluation
      const qualityScore = RecommendationQualityService.evaluatePack(top5Candidates);

      // 8. Building Pack
      await RecommendationRepository.updateProgressPhase(packId, 'BUILDING_PACK');
      const finalPackFields = RecommendationPackBuilder.build(
        userId,
        profileHash,
        reason,
        top5Candidates,
        aiResponse,
        aiMeta,
        experimentGroup,
        qualityScore,
      );

      const durationMs = Date.now() - startTime;
      if (finalPackFields.metadata) {
        finalPackFields.metadata.generationTimeMs = durationMs;
        finalPackFields.metadata.candidateCount = initialCount;
        finalPackFields.metadata.filteredCount = filteredCount;
      }

      // Mark pack ready
      await RecommendationService.markReady(packId, finalPackFields);
      success = true;

      // Print Quality Report Logs
      this.logQualityReport(
        durationMs,
        initialCount,
        filteredCount,
        top5Candidates,
        aiLatency,
        fallbackUsed,
        repairUsed,
        qualityScore,
      );
    } catch (err: any) {
      console.error(`[Recommendation] Worker failed for pack ${packId}:`, err.message);
      await RecommendationService.markFailed(packId).catch(() => {});
      const durationMs = Date.now() - startTime;
      this.logQualityReport(
        durationMs,
        initialCount,
        filteredCount,
        [],
        0,
        fallbackUsed,
        repairUsed,
        0,
      );
    }
  }

  /**
   * Logs quality report.
   */
  private static logQualityReport(
    generationTime: number,
    candidatePool: number,
    filtered: number,
    top5: any[],
    aiLatency: number,
    fallback: boolean,
    repair: boolean,
    qualityScore: number,
  ): void {
    const scores = top5.map((c) => c.finalScore);
    const topScore = scores.length > 0 ? Math.max(...scores) : 0;
    const avgScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const hiddenGems = top5.map((c) => c.opportunity.hiddenGemScore || 0);
    const avgHiddenGem =
      hiddenGems.length > 0
        ? Math.round(hiddenGems.reduce((a, b) => a + b, 0) / hiddenGems.length)
        : 0;

    const portfolios = top5.map((c) => {
      const valSum =
        (c.opportunity.careerValPortfolio || 0) +
        (c.opportunity.careerValResume || 0) +
        (c.opportunity.careerValLearning || 0) +
        (c.opportunity.careerValNetworking || 0) +
        (c.opportunity.careerValExposure || 0);
      return Math.round((valSum / 25) * 10);
    });
    const avgPortfolio =
      portfolios.length > 0
        ? Math.round(portfolios.reduce((a, b) => a + b, 0) / portfolios.length)
        : 0;

    // Diversity: unique organizations size
    const orgs = new Set(top5.map((c) => c.diversificationTags.organization));
    const avgDiversity = top5.length > 0 ? Math.round((orgs.size / top5.length) * 10) : 0;

    console.log('\n========== Recommendation Quality Report ==========');
    console.log(`Generation Time: ${generationTime} ms`);
    console.log(`Candidate Pool: ${candidatePool}`);
    console.log(`Filtered: ${filtered}`);
    console.log(`Top Score: ${topScore}`);
    console.log(`Average Score: ${avgScore}`);
    console.log(`Average Hidden Gem: ${avgHiddenGem}`);
    console.log(`Average Portfolio Value: ${avgPortfolio}`);
    console.log(`Average Diversity: ${avgDiversity} / 10`);
    console.log(`AI Latency: ${aiLatency} ms`);
    console.log(`Fallback: ${fallback ? 'Yes' : 'No'}`);
    console.log(`Repair: ${repair ? 'Yes' : 'No'}`);
    console.log(`Quality Score: ${qualityScore}`);
    console.log('===========================================\n');
  }

  /**
   * Helper to check if a generation lock is currently active.
   */
  static isGenerating(userId: string): boolean {
    return this.activeLocks.has(userId);
  }

  /**
   * Performs a sandbox pipeline dry run, returning intermediate outputs per phase.
   */
  static async runDryRun(userId: string, targetStage?: string, customWeights?: any): Promise<any> {
    const startTime = Date.now();
    const stages: any[] = [];
    const runStage = async (name: string, fn: () => Promise<any> | any) => {
      const stageStart = Date.now();
      try {
        const res = await fn();
        stages.push({
          name,
          status: 'completed',
          durationMs: Date.now() - stageStart,
          output: res,
        });
        return res;
      } catch (err: any) {
        stages.push({
          name,
          status: 'failed',
          durationMs: Date.now() - stageStart,
          error: err.message,
        });
        throw err;
      }
    };

    // 1. Retrieval
    const rawCandidates = await runStage('Retrieval', async () => {
      return await CandidateRetrievalService.fetchActiveCandidates();
    });

    if (targetStage === 'Retrieval') return { durationMs: Date.now() - startTime, stages };

    // Fetch user profile and resume
    const profile = await ProfileModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();
    if (!profile) {
      throw new Error('User profile not found. Complete onboarding first.');
    }
    const resume = await ResumeModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    // 2. Hard Filters
    const filterRes = await runStage('Hard Filters', () => {
      return HardFilterEngine.run(rawCandidates, profile);
    });

    if (targetStage === 'Hard Filters') return { durationMs: Date.now() - startTime, stages };

    // 3. Scoring
    const experimentGroup = ScoringExperimentsService.assignGroup(userId);
    const weights = customWeights || RecommendationConfig.getWeights(experimentGroup);
    const scoredCandidates = await runStage('Scoring', () => {
      const pool = filterRes.pool.map((e: any) => e.opportunity);
      return ScoringEngine.run(pool, profile, weights);
    });

    if (targetStage === 'Scoring') return { durationMs: Date.now() - startTime, stages };

    // 4. Diversification
    const diversified = await runStage('Diversification', () => {
      return DiversificationEngine.diversify(scoredCandidates, 5);
    });

    if (targetStage === 'Diversification') return { durationMs: Date.now() - startTime, stages };

    // 5. AI Personalization
    const aiPersonalized = await runStage('AI Personalization', async () => {
      if (RecommendationConfig.getFlags().enableAIPersonalization) {
        return await PersonalizationService.personalize(profile, resume, diversified);
      } else {
        return {
          response: FallbackPersonalization.generate(diversified),
          metadata: { provider: 'local-fallback', fallbackUsed: true },
        };
      }
    });

    if (targetStage === 'AI Personalization') return { durationMs: Date.now() - startTime, stages };

    // 6. Build Pack
    await runStage('Build Pack', () => {
      const qualityScore = RecommendationQualityService.evaluatePack(diversified);
      return RecommendationPackBuilder.build(
        userId,
        'dry-run-hash',
        'ADMIN_FORCE' as any,
        diversified,
        aiPersonalized.response,
        aiPersonalized.metadata,
        experimentGroup,
        qualityScore,
      );
    });

    return {
      durationMs: Date.now() - startTime,
      stages,
    };
  }
}
