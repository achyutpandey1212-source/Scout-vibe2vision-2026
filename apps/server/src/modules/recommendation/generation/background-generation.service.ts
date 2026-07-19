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
    let success = false;

    try {
      // 1. Retrieving
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

      // 2. Filtering
      await RecommendationRepository.updateProgressPhase(packId, 'FILTERING');
      const { pool } = HardFilterEngine.run(rawCandidates, profile);
      filteredCount = pool.length;

      const filteredOpps = pool.map((e) => e.opportunity);

      // 3. Scoring
      await RecommendationRepository.updateProgressPhase(packId, 'SCORING');
      const scoredCandidates = ScoringEngine.run(filteredOpps, profile);

      // 4. Diversifying
      await RecommendationRepository.updateProgressPhase(packId, 'DIVERSIFYING');
      const top5Candidates = DiversificationEngine.diversify(scoredCandidates, 5);

      // 5. Personalizing
      await RecommendationRepository.updateProgressPhase(packId, 'PERSONALIZING');
      const { response, metadata: aiMeta } = await PersonalizationService.personalize(
        profile,
        resume,
        top5Candidates,
      );
      fallbackUsed = aiMeta.fallbackUsed;

      // 6. Building Pack
      await RecommendationRepository.updateProgressPhase(packId, 'BUILDING_PACK');
      const finalPackFields = RecommendationPackBuilder.build(
        userId,
        profileHash,
        reason,
        top5Candidates,
        response,
        aiMeta,
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

      // Print Background Audit Logs
      this.logBackgroundSummary(
        userId,
        reason,
        initialCount,
        filteredCount,
        top5Candidates.length,
        fallbackUsed,
        true,
        durationMs,
      );
    } catch (err: any) {
      console.error(`[Recommendation] Worker failed for pack ${packId}:`, err.message);
      await RecommendationService.markFailed(packId).catch(() => {});
      const durationMs = Date.now() - startTime;
      this.logBackgroundSummary(
        userId,
        reason,
        initialCount,
        filteredCount,
        0,
        fallbackUsed,
        false,
        durationMs,
      );
    }
  }

  /**
   * Logs generation summary.
   */
  private static logBackgroundSummary(
    userId: string,
    reason: string,
    retrieved: number,
    filtered: number,
    topCandidates: number,
    fallbackUsed: boolean,
    completed: boolean,
    durationMs: number,
  ): void {
    console.log('\n===============================================');
    console.log('Recommendation Generation');
    console.log('===============================================');
    console.log(`User: ${userId}`);
    console.log(`Reason: ${reason}`);
    console.log(`Status: ${completed ? 'SUCCESS' : 'FAILED'}`);
    console.log(`\nCandidates Retrieved: ${retrieved}`);
    console.log(`After Filters: ${filtered}`);
    console.log(`Top Candidates: ${topCandidates}`);
    console.log(`AI: ${fallbackUsed ? 'FALLBACK' : 'SUCCESS'}`);
    console.log(`Pack: ${completed ? 'READY' : 'FAILED'}`);
    console.log(`Duration: ${(durationMs / 1000).toFixed(1)} s`);
    console.log('===============================================\n');
  }

  /**
   * Helper to check if a generation lock is currently active.
   */
  static isGenerating(userId: string): boolean {
    return this.activeLocks.has(userId);
  }
}
