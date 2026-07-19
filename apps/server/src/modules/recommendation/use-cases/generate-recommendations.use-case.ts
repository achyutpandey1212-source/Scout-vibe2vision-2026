import { ProfileModel, ResumeModel } from '../../../profile';
import { RecommendationService } from '../service/recommendation.service';
import { CandidateRetrievalService } from '../service/candidate-retrieval.service';
import { HardFilterEngine } from '../engine/hard-filter.engine';
import { ScoringEngine } from '../engine/scoring.engine';
import { DiversificationEngine } from '../engine/diversification.engine';
import { PersonalizationService } from '../ai/personalization.service';
import { IRecommendationPack, RecommendationGenerationReason } from '../types/recommendation.types';
import { IRankedCandidate } from '../types/scoring.types';
import { IProfile } from '../../../profile/models/profile.model';
import mongoose from 'mongoose';

export class GenerateRecommendationsUseCase {
  /**
   * Executes the recommendation generation flow.
   * If regeneration is needed, starts it in the background and returns a placeholder PENDING status.
   * Otherwise, returns the latest ready pack.
   */
  static async execute(
    userId: string,
    forcedReason?: RecommendationGenerationReason,
  ): Promise<{ status: 'PENDING' | 'READY'; pack: IRecommendationPack | null }> {
    const latestPack = await RecommendationService.getLatestPack(userId);

    // If there is a pack currently generating, return PENDING
    if (latestPack && latestPack.status === 'GENERATING') {
      return { status: 'PENDING', pack: latestPack };
    }

    const { shouldGenerate, reason, currentHash } =
      await RecommendationService.shouldGenerate(userId);

    if (shouldGenerate || forcedReason) {
      const startTime = Date.now();

      // Fetch user profile for filtering
      const profile = await ProfileModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      }).exec();

      if (!profile) {
        throw new Error('User profile not found. Onboarding must be completed first.');
      }

      // Fetch user resume if available
      const resume = await ResumeModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      }).exec();

      // Fetch candidates and run Hard Filters to log discovery report
      const rawCandidates = await CandidateRetrievalService.fetchActiveCandidates();
      const { pool, report } = HardFilterEngine.run(rawCandidates, profile);

      // Print Discovery-style logs with percentages
      this.logFilterReport(report);

      // Extract raw opportunities from pool
      const filteredOpps = pool.map((entry) => entry.opportunity);

      // Run Scoring Engine
      const scoredCandidates = ScoringEngine.run(filteredOpps, profile);

      // Run Diversification
      const top5Candidates = DiversificationEngine.diversify(scoredCandidates, 5);

      // Log Scoring and Diversification Metrics
      this.logScoringReport(scoredCandidates, top5Candidates);

      // Start generating
      const generatingPack = await RecommendationService.createGeneratingPack(
        userId,
        currentHash,
        forcedReason || reason || 'LOGIN',
      );

      // Trigger async personalization in background
      this.runBackgroundPersonalization(
        generatingPack._id.toString(),
        top5Candidates,
        profile,
        resume,
        startTime,
        rawCandidates.length,
        pool.length,
      );

      return { status: 'PENDING', pack: generatingPack };
    }

    return { status: 'READY', pack: latestPack };
  }

  /**
   * Logs filter report in Discovery-style logs.
   */
  private static logFilterReport(report: any): void {
    console.log('\n====================================');
    console.log('Candidate Retrieval');
    console.log('====================================');
    console.log(`Fetched: ${report.initialCount}`);

    report.stages.forEach((stage: any) => {
      console.log('↓');
      console.log(`${stage.stage} removed: ${stage.removedCount} (${stage.removedPercentage}%)`);
    });

    console.log('↓');
    console.log(`Candidate Pool: ${report.finalCount}`);
    console.log('====================================\n');
  }

  /**
   * Logs scoring report in Discovery-style logs.
   */
  private static logScoringReport(allScored: IRankedCandidate[], top5: IRankedCandidate[]): void {
    const scores = allScored.map((c) => c.finalScore);
    const avgScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const topScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestSelected = top5.length > 0 ? top5[top5.length - 1].finalScore : 0;

    console.log('====================================');
    console.log('Scoring Engine');
    console.log('====================================');
    console.log(`Candidate Pool: ${allScored.length}`);
    console.log('↓');
    console.log(`Scored: ${allScored.length}`);
    console.log('↓');
    console.log('Diversification Applied');
    console.log('↓');
    console.log(`Final Recommendations: ${top5.length}`);
    console.log(`Average Score: ${avgScore}`);
    console.log(`Top Score: ${topScore}`);
    console.log(`Lowest Selected: ${lowestSelected}`);
    console.log('====================================');

    console.log('\n========== Recommendation Score Audit ==========');
    console.log(`Candidate Pool: ${allScored.length}\n`);
    console.log('Top 5:\n');
    top5.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.opportunity.title} (${c.opportunity.organization})`);
      console.log(`Score: ${c.finalScore}\n`);
      console.log(`Base Match: ${c.scoreBreakdown.baseMatch}`);
      console.log(`Interest: ${c.scoreBreakdown.interest}`);
      console.log(`Career Stage: ${c.scoreBreakdown.careerStage}`);
      console.log(`Difficulty: ${c.scoreBreakdown.difficulty}`);
      console.log(`Availability: ${c.scoreBreakdown.availability}`);
      console.log(`Remote: ${c.scoreBreakdown.remote}`);
      console.log(`Women Bonus: ${c.scoreBreakdown.womenBonus}`);
      console.log(`Portfolio: ${c.scoreBreakdown.portfolio}`);
      console.log(`Hidden Gem: ${c.scoreBreakdown.hiddenGem}`);
      console.log(`Deadline: ${c.scoreBreakdown.deadline}`);
      console.log(`Confidence: ${c.scoreBreakdown.confidence}\n`);
      console.log('Reason:');
      if (c.recommendationExplanations.length > 0) {
        c.recommendationExplanations.forEach((e) => console.log(`• ${e.message}`));
      } else {
        console.log('• General match');
      }
      if (idx < top5.length - 1) {
        console.log('\n---------------------------------\n');
      }
    });
    console.log('========================================\n');
  }

  /**
   * Logs AI Personalization statistics.
   */
  private static logAIPersonalizationAudit(
    userId: string,
    candidatesCount: number,
    meta: any,
    success: boolean,
  ): void {
    console.log('========== AI Personalization Audit ==========');
    console.log(`User: ${userId}`);
    console.log(`Top 5 Candidates: ${candidatesCount}`);
    console.log(`\nProvider: ${meta.provider}`);
    console.log(`Model: ${meta.model}`);
    console.log(`Prompt Version: ${meta.promptVersion}`);
    console.log(`Schema Version: ${meta.schemaVersion}`);
    console.log(`Latency: ${(meta.latencyMs / 1000).toFixed(1)}s`);
    console.log(`Repair Used: ${meta.repairUsed ? 'Yes' : 'No'}`);
    console.log(`Fallback Used: ${meta.fallbackUsed ? 'Yes' : 'No'}`);
    console.log(`Prompt Length: ${meta.promptLength.toLocaleString()} chars`);
    console.log(`Response Length: ${meta.responseLength.toLocaleString()} chars`);
    console.log(`Generation: ${success ? 'SUCCESS' : 'FAILED'}`);
    console.log('==============================================\n');
  }

  /**
   * Simulates asynchronous generation in the background.
   */
  private static runBackgroundPersonalization(
    packId: string,
    top5: IRankedCandidate[],
    profile: IProfile,
    resume: any,
    totalStartTime: number,
    candidateCount: number,
    filteredCount: number,
  ): void {
    setTimeout(async () => {
      try {
        const { response, metadata: aiMeta } = await PersonalizationService.personalize(
          profile,
          resume,
          top5,
        );

        // Print AI Audit Log
        this.logAIPersonalizationAudit(
          profile.userId.toString(),
          top5.length,
          aiMeta,
          !aiMeta.fallbackUsed,
        );

        const overallTimeMs = Date.now() - totalStartTime;

        // Map and save to pack
        await RecommendationService.markReady(packId, {
          todayMission: response.todayMission,
          perfectMatch: {
            opportunityId: top5[0]?.opportunity?._id || null,
            personalizedReason:
              response.recommendationsBySlot['perfectMatch']?.personalizedReason || '',
            whyNow:
              response.recommendationsBySlot['perfectMatch']?.confidenceMessage ||
              'Highly recommended based on your profile.',
            missingSkills: response.recommendationsBySlot['perfectMatch']?.missingSkills || [],
            firstAction:
              response.recommendationsBySlot['perfectMatch']?.firstAction ||
              'Read the official application page.',
            score: top5[0]?.finalScore || 0,
            scoreBreakdown: top5[0]?.scoreBreakdown || {},
          },
          hiddenGem: {
            opportunityId: top5[1]?.opportunity?._id || null,
            personalizedReason:
              response.recommendationsBySlot['hiddenGem']?.personalizedReason || '',
            whyNow:
              response.recommendationsBySlot['hiddenGem']?.confidenceMessage ||
              'Underrated gem matching your goals.',
            missingSkills: response.recommendationsBySlot['hiddenGem']?.missingSkills || [],
            firstAction:
              response.recommendationsBySlot['hiddenGem']?.firstAction ||
              'Read the official application page.',
            score: top5[1]?.finalScore || 0,
            scoreBreakdown: top5[1]?.scoreBreakdown || {},
          },
          stretchGoal: {
            opportunityId: top5[2]?.opportunity?._id || null,
            personalizedReason:
              response.recommendationsBySlot['stretchGoal']?.personalizedReason || '',
            whyNow:
              response.recommendationsBySlot['stretchGoal']?.confidenceMessage ||
              'Stretch target to reach new milestones.',
            missingSkills: response.recommendationsBySlot['stretchGoal']?.missingSkills || [],
            firstAction:
              response.recommendationsBySlot['stretchGoal']?.firstAction ||
              'Read the official application page.',
            score: top5[2]?.finalScore || 0,
            scoreBreakdown: top5[2]?.scoreBreakdown || {},
          },
          quickWin: {
            opportunityId: top5[3]?.opportunity?._id || null,
            personalizedReason:
              response.recommendationsBySlot['quickWin']?.personalizedReason || '',
            whyNow:
              response.recommendationsBySlot['quickWin']?.confidenceMessage ||
              'Low effort application to build momentum.',
            missingSkills: response.recommendationsBySlot['quickWin']?.missingSkills || [],
            firstAction:
              response.recommendationsBySlot['quickWin']?.firstAction ||
              'Read the official application page.',
            score: top5[3]?.finalScore || 0,
            scoreBreakdown: top5[3]?.scoreBreakdown || {},
          },
          confidenceBuilder: {
            opportunityId: top5[4]?.opportunity?._id || null,
            personalizedReason:
              response.recommendationsBySlot['confidenceBuilder']?.personalizedReason || '',
            whyNow:
              response.recommendationsBySlot['confidenceBuilder']?.confidenceMessage ||
              'Safe opportunity matching your skills.',
            missingSkills: response.recommendationsBySlot['confidenceBuilder']?.missingSkills || [],
            firstAction:
              response.recommendationsBySlot['confidenceBuilder']?.firstAction ||
              'Read the official application page.',
            score: top5[4]?.finalScore || 0,
            scoreBreakdown: top5[4]?.scoreBreakdown || {},
          },
          aiSummary: response.aiSummary,
          metadata: {
            provider: aiMeta.provider,
            model: aiMeta.model,
            promptVersion: aiMeta.promptVersion,
            schemaVersion: aiMeta.schemaVersion,
            engineVersion: aiMeta.engineVersion,
            generationTimeMs: overallTimeMs,
            candidateCount,
            filteredCount,
            aiLatency: aiMeta.latencyMs,
            cacheHit: false,
            fallbackUsed: aiMeta.fallbackUsed,
            repairUsed: aiMeta.repairUsed,
            promptLength: aiMeta.promptLength,
            responseLength: aiMeta.responseLength,
            promptHash: aiMeta.promptHash,
          },
        });
      } catch (error) {
        console.error(`[Recommendation] Background generation failed for pack ${packId}:`, error);
        await RecommendationService.markFailed(packId).catch(() => {});
      }
    }, 1000);
  }
}
