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
    const pack = await RecommendationPackModel.findByIdAndUpdate(
      packId,
      { $set: updateData },
      { new: true },
    )
      .populate('perfectMatch.opportunityId')
      .populate('hiddenGem.opportunityId')
      .populate('stretchGoal.opportunityId')
      .populate('quickWin.opportunityId')
      .populate('confidenceBuilder.opportunityId')
      .exec();

    return pack;
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
