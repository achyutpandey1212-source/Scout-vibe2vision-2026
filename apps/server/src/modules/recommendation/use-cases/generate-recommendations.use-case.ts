import { ProfileModel } from '@/profile';
import { RecommendationService } from '../service/recommendation.service';
import { CandidateRetrievalService } from '../service/candidate-retrieval.service';
import { HardFilterEngine } from '../engine/hard-filter.engine';
import { ScoringEngine } from '../engine/scoring.engine';
import { DiversificationEngine } from '../engine/diversification.engine';
import { IRecommendationPack, RecommendationGenerationReason } from '../types/recommendation.types';
import { IRankedCandidate } from '../types/scoring.types';
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

      // Trigger async placeholder generation in background (Phase 3 behavior with top 5)
      this.runBackgroundPlaceholderGeneration(generatingPack._id.toString(), top5Candidates);

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
   * Simulates asynchronous generation in the background.
   */
  private static runBackgroundPlaceholderGeneration(
    packId: string,
    top5: IRankedCandidate[],
  ): void {
    setTimeout(async () => {
      try {
        await RecommendationService.markReady(packId, {
          todayMission: 'Complete onboarding fully and bookmark two high-value startups.',
          perfectMatch: {
            opportunityId: top5[0]?.opportunity?._id || null,
            personalizedReason:
              top5[0]?.recommendationExplanations.map((e) => e.message).join('. ') ||
              'Matches your core skills and career goals.',
            whyNow: 'Applications are closing soon.',
            missingSkills: ['Git', 'Docker'],
            firstAction: 'Refine your project README.',
            score: top5[0]?.finalScore || 95,
            scoreBreakdown: top5[0]?.scoreBreakdown || {},
          },
          hiddenGem: {
            opportunityId: top5[1]?.opportunity?._id || null,
            personalizedReason:
              top5[1]?.recommendationExplanations.map((e) => e.message).join('. ') ||
              'An underrated opportunity that matches your branch closely.',
            whyNow: 'Limited applicant exposure right now.',
            missingSkills: [],
            firstAction: 'Apply immediately.',
            score: top5[1]?.finalScore || 88,
            scoreBreakdown: top5[1]?.scoreBreakdown || {},
          },
          stretchGoal: {
            opportunityId: top5[2]?.opportunity?._id || null,
            personalizedReason:
              top5[2]?.recommendationExplanations.map((e) => e.message).join('. ') ||
              'Highly prestigious, great for resume visibility.',
            whyNow: 'Competitive applicant pool.',
            missingSkills: ['AWS', 'K8s'],
            firstAction: 'Take a certification course first.',
            score: top5[2]?.finalScore || 82,
            scoreBreakdown: top5[2]?.scoreBreakdown || {},
          },
          quickWin: {
            opportunityId: top5[3]?.opportunity?._id || null,
            personalizedReason:
              top5[3]?.recommendationExplanations.map((e) => e.message).join('. ') ||
              'Easy application process with immediate response.',
            whyNow: 'Highly active hiring manager.',
            missingSkills: [],
            firstAction: 'Submit default resume copy.',
            score: top5[3]?.finalScore || 90,
            scoreBreakdown: top5[3]?.scoreBreakdown || {},
          },
          confidenceBuilder: {
            opportunityId: top5[4]?.opportunity?._id || null,
            personalizedReason:
              top5[4]?.recommendationExplanations.map((e) => e.message).join('. ') ||
              'Excellent match for beginner-level candidates.',
            whyNow: 'Friendly interview timeline.',
            missingSkills: [],
            firstAction: 'Brush up basic interview topics.',
            score: top5[4]?.finalScore || 92,
            scoreBreakdown: top5[4]?.scoreBreakdown || {},
          },
          aiSummary: `This placeholder pack has been generated successfully. Handled ${top5.length} recommendations from candidate pool.`,
        });
      } catch (error) {
        console.error(`[Recommendation] Background generation failed for pack ${packId}:`, error);
        await RecommendationService.markFailed(packId).catch(() => {});
      }
    }, 1000);
  }
}
