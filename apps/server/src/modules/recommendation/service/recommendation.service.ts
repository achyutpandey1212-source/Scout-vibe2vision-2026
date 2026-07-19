import { ProfileModel, ResumeModel } from '@/profile';
import { RecommendationRepository } from '../repository/recommendation.repository';
import { ProfileHashGenerator } from '../hash/profile-hash.generator';
import { RecommendationTriggerService } from '../triggers/recommendation-trigger.service';
import {
  IRecommendationPack,
  RecommendationGenerationReason,
  RecommendationStatus,
} from '../types/recommendation.types';
import { RECOMMENDATION_VERSION, PACK_EXPIRY_HOURS } from '../constants';
import mongoose from 'mongoose';

export class RecommendationService {
  /**
   * Helper to retrieve or generate profile hash for the user.
   */
  static async generateProfileHash(userId: string): Promise<string> {
    const profile = await ProfileModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();
    const resume = await ResumeModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();
    return ProfileHashGenerator.generate(profile, resume, RECOMMENDATION_VERSION);
  }

  /**
   * Evaluates if a new recommendation pack needs to be generated.
   */
  static async shouldGenerate(
    userId: string,
  ): Promise<{
    shouldGenerate: boolean;
    reason?: RecommendationGenerationReason;
    currentHash: string;
  }> {
    const latestPack = await RecommendationRepository.findLatestByUser(userId);
    const currentHash = await this.generateProfileHash(userId);
    const decision = RecommendationTriggerService.shouldGenerateRecommendation(
      latestPack,
      currentHash,
    );
    return {
      shouldGenerate: decision.shouldGenerate,
      reason: decision.reason,
      currentHash,
    };
  }

  /**
   * Returns the latest pack for the user.
   */
  static async getLatestPack(userId: string): Promise<IRecommendationPack | null> {
    return RecommendationRepository.findLatestByUser(userId);
  }

  /**
   * Creates a new pack in GENERATING state.
   */
  static async createGeneratingPack(
    userId: string,
    profileHash: string,
    reason?: RecommendationGenerationReason,
  ): Promise<IRecommendationPack> {
    console.log('[Recommendation] Generation started');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PACK_EXPIRY_HOURS * 60 * 60 * 1000);

    return RecommendationRepository.createPack({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'GENERATING',
      generatedAt: now,
      expiresAt,
      recommendationVersion: RECOMMENDATION_VERSION,
      profileHash,
      generationReason: reason || 'LOGIN',
      todayMission: 'Placeholder mission for Phase 1.',
      perfectMatch: {},
      hiddenGem: {},
      stretchGoal: {},
      quickWin: {},
      confidenceBuilder: {},
      aiSummary: 'Placeholder summary for Phase 1.',
      metadata: {
        provider: 'placeholder',
        model: 'placeholder',
        promptVersion: RECOMMENDATION_VERSION,
        generationTimeMs: 0,
        candidateCount: 0,
        filteredCount: 0,
        aiLatency: 0,
        cacheHit: false,
      },
    });
  }

  /**
   * Marks a pack as ready.
   */
  static async markReady(
    packId: string,
    updateData: Partial<IRecommendationPack>,
  ): Promise<IRecommendationPack | null> {
    console.log('[Recommendation] Generation finished');
    return RecommendationRepository.markReady(packId, updateData);
  }

  /**
   * Marks a pack as failed.
   */
  static async markFailed(packId: string): Promise<IRecommendationPack | null> {
    console.log('[Recommendation] Generation failed');
    return RecommendationRepository.markFailed(packId);
  }
}
