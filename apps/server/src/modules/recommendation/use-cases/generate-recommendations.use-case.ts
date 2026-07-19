import { ProfileModel } from '@/profile';
import { RecommendationService } from '../service/recommendation.service';
import { CandidateRetrievalService } from '../service/candidate-retrieval.service';
import { HardFilterEngine } from '../engine/hard-filter.engine';
import { IRecommendationPack, RecommendationGenerationReason } from '../types/recommendation.types';
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
      // Fetch user profile for filtering
      const profile = await ProfileModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      }).exec();

      if (!profile) {
        throw new Error('User profile not found. Onboarding must be completed first.');
      }

      // Fetch candidates and run Hard Filters to log discovery report
      const rawCandidates = await CandidateRetrievalService.fetchActiveCandidates();
      const { pool, report } = HardFilterEngine.run(rawCandidates, profile);

      // Print Discovery-style logs with percentages
      this.logFilterReport(report);

      // Start generating
      const generatingPack = await RecommendationService.createGeneratingPack(
        userId,
        currentHash,
        forcedReason || reason || 'LOGIN',
      );

      // Trigger async placeholder generation in background (Phase 1/2 behavior)
      this.runBackgroundPlaceholderGeneration(generatingPack._id.toString(), pool);

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
   * Simulates asynchronous generation in the background.
   */
  private static runBackgroundPlaceholderGeneration(packId: string, pool: any[]): void {
    setTimeout(async () => {
      try {
        await RecommendationService.markReady(packId, {
          todayMission: 'Complete onboarding fully and bookmark two high-value startups.',
          perfectMatch: {
            opportunityId: pool[0]?.opportunity?._id || null,
            personalizedReason: 'Matches your core skills and career goals.',
            whyNow: 'Applications are closing soon.',
            missingSkills: ['Git', 'Docker'],
            firstAction: 'Refine your project README.',
            score: 95,
          },
          hiddenGem: {
            opportunityId: pool[1]?.opportunity?._id || null,
            personalizedReason: 'An underrated opportunity that matches your branch closely.',
            whyNow: 'Limited applicant exposure right now.',
            missingSkills: [],
            firstAction: 'Apply immediately.',
            score: 88,
          },
          stretchGoal: {
            opportunityId: pool[2]?.opportunity?._id || null,
            personalizedReason: 'Highly prestigious, great for resume visibility.',
            whyNow: 'Competitive applicant pool.',
            missingSkills: ['AWS', 'K8s'],
            firstAction: 'Take a certification course first.',
            score: 82,
          },
          quickWin: {
            opportunityId: pool[3]?.opportunity?._id || null,
            personalizedReason: 'Easy application process with immediate response.',
            whyNow: 'Highly active hiring manager.',
            missingSkills: [],
            firstAction: 'Submit default resume copy.',
            score: 90,
          },
          confidenceBuilder: {
            opportunityId: pool[4]?.opportunity?._id || null,
            personalizedReason: 'Excellent match for beginner-level candidates.',
            whyNow: 'Friendly interview timeline.',
            missingSkills: [],
            firstAction: 'Brush up basic interview topics.',
            score: 92,
          },
          aiSummary: `This placeholder pack has been generated successfully. Handled ${pool.length} eligible candidates.`,
        });
      } catch (error) {
        console.error(`[Recommendation] Background generation failed for pack ${packId}:`, error);
        await RecommendationService.markFailed(packId).catch(() => {});
      }
    }, 1000);
  }
}
