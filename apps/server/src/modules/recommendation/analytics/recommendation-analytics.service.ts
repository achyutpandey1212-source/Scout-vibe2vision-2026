import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendationEvent extends Document {
  event: string;
  userId: mongoose.Types.ObjectId;
  recommendationPackId: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId | null;
  timestamp: Date;
  metadata: Record<string, any>;
}

const RecommendationEventSchema = new Schema<IRecommendationEvent>({
  event: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recommendationPackId: {
    type: Schema.Types.ObjectId,
    ref: 'RecommendationPack',
    required: true,
    index: true,
  },
  opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', default: null },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
});

export const RecommendationEventModel =
  mongoose.models.RecommendationEvent ||
  mongoose.model<IRecommendationEvent>('RecommendationEvent', RecommendationEventSchema);

export class RecommendationAnalyticsService {
  /**
   * Records a structured event in the recommendation event stream.
   * Runs asynchronously and safely catches database errors to never block generation.
   */
  static async recordEvent(
    event:
      | 'GENERATED'
      | 'VIEWED'
      | 'CARD_OPENED'
      | 'APPLY_CLICKED'
      | 'BOOKMARKED'
      | 'MANUAL_REFRESH'
      | 'FALLBACK_USED'
      | 'REPAIR_USED'
      | 'GENERATION_FAILED'
      | string,
    userId: string,
    recommendationPackId: string,
    opportunityId: string | null = null,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      await RecommendationEventModel.create({
        event,
        userId: new mongoose.Types.ObjectId(userId),
        recommendationPackId: new mongoose.Types.ObjectId(recommendationPackId),
        opportunityId: opportunityId ? new mongoose.Types.ObjectId(opportunityId) : null,
        metadata,
      });
      console.log(`[Analytics] Event recorded: "${event}" for User ${userId}`);
    } catch (err: any) {
      console.error(`[Analytics] Failed to record event "${event}":`, err.message);
    }
  }
}
