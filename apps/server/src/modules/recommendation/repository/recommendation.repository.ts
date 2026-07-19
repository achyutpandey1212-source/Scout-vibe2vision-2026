import mongoose from 'mongoose';
import { RecommendationPackModel } from '../schemas/recommendation-pack.schema';
import { IRecommendationPack, RecommendationStatus } from '../types/recommendation.types';

export class RecommendationRepository {
  static async findLatestByUser(userId: string): Promise<IRecommendationPack | null> {
    return RecommendationPackModel.findOne({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ generatedAt: -1 })
      .populate('perfectMatch.opportunityId')
      .populate('hiddenGem.opportunityId')
      .populate('stretchGoal.opportunityId')
      .populate('quickWin.opportunityId')
      .populate('confidenceBuilder.opportunityId')
      .exec();
  }

  static async createPack(packData: Partial<IRecommendationPack>): Promise<IRecommendationPack> {
    return RecommendationPackModel.create(packData);
  }

  static async updatePack(
    packId: string,
    updateData: Partial<IRecommendationPack>,
  ): Promise<IRecommendationPack | null> {
    console.log(`[Repository] updatePack: started for packId: ${packId}`);
    const pack = await RecommendationPackModel.findById(packId);
    if (!pack) {
      console.error(`[Repository] updatePack: packId ${packId} not found in DB`);
      return null;
    }

    if (updateData.status) pack.status = updateData.status;
    if (updateData.progressPhase) pack.progressPhase = updateData.progressPhase;
    if (updateData.todayMission) pack.todayMission = updateData.todayMission;
    if (updateData.aiSummary) pack.aiSummary = updateData.aiSummary;

    if (updateData.perfectMatch !== undefined) {
      pack.perfectMatch = updateData.perfectMatch;
      pack.markModified('perfectMatch');
    }
    if (updateData.hiddenGem !== undefined) {
      pack.hiddenGem = updateData.hiddenGem;
      pack.markModified('hiddenGem');
    }
    if (updateData.stretchGoal !== undefined) {
      pack.stretchGoal = updateData.stretchGoal;
      pack.markModified('stretchGoal');
    }
    if (updateData.quickWin !== undefined) {
      pack.quickWin = updateData.quickWin;
      pack.markModified('quickWin');
    }
    if (updateData.confidenceBuilder !== undefined) {
      pack.confidenceBuilder = updateData.confidenceBuilder;
      pack.markModified('confidenceBuilder');
    }

    if (updateData.metadata) {
      pack.metadata = {
        ...pack.metadata,
        ...updateData.metadata,
      };
      pack.markModified('metadata');
    }
    if (updateData.expiresAt) pack.expiresAt = updateData.expiresAt;
    if (updateData.generatedAt) pack.generatedAt = updateData.generatedAt;
    if (updateData.profileHash) pack.profileHash = updateData.profileHash;
    if (updateData.generationReason) pack.generationReason = updateData.generationReason;

    try {
      const savedDoc = await pack.save();
      console.log(`[Repository] updatePack: Mongo save success for packId: ${savedDoc._id}`);
    } catch (err: any) {
      console.error(`[Repository] updatePack: Mongo save failed:`, err.message);
      throw err;
    }

    return RecommendationPackModel.findById(packId)
      .populate('perfectMatch.opportunityId')
      .populate('hiddenGem.opportunityId')
      .populate('stretchGoal.opportunityId')
      .populate('quickWin.opportunityId')
      .populate('confidenceBuilder.opportunityId')
      .exec();
  }

  static async markGenerating(packId: string): Promise<IRecommendationPack | null> {
    return this.updatePack(packId, { status: 'GENERATING' });
  }

  static async markReady(
    packId: string,
    data: Partial<IRecommendationPack>,
  ): Promise<IRecommendationPack | null> {
    return this.updatePack(packId, {
      ...data,
      status: 'READY',
    });
  }

  static async markFailed(packId: string): Promise<IRecommendationPack | null> {
    return this.updatePack(packId, { status: 'FAILED', progressPhase: 'COMPLETED' as any });
  }

  static async updateProgressPhase(
    packId: string,
    progressPhase: IRecommendationPack['progressPhase'],
  ): Promise<IRecommendationPack | null> {
    return this.updatePack(packId, { progressPhase });
  }

  static async deleteExpired(userId: string): Promise<number> {
    const result = await RecommendationPackModel.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
      expiresAt: { $lt: new Date() },
    }).exec();
    return result.deletedCount || 0;
  }
}
