import { RecommendationRepository } from '../repository/recommendation.repository';
import { RecommendationService } from '../service/recommendation.service';
import { BackgroundGenerationService } from '../generation/background-generation.service';
import { IRecommendationPack } from '../types/recommendation.types';
import { RecommendationPackModel } from '../schemas/recommendation-pack.schema';
import mongoose from 'mongoose';

export class RecommendationSchedulerService {
  /**
   * Helper checking if a pack is expired based on Date.now() compared to expiresAt.
   */
  static shouldRegenerate(pack: IRecommendationPack | null): boolean {
    if (!pack) return true;
    return new Date() >= new Date(pack.expiresAt);
  }

  /**
   * Evaluates and regenerates all packs that have passed their expiresAt timestamp.
   * Scans the database for expired packs and initiates a background trigger for each.
   */
  static async regenerateExpiredRecommendations(): Promise<number> {
    const expiredPacks = await RecommendationPackModel.find({
      status: { $ne: 'GENERATING' },
      expiresAt: { $lte: new Date() },
    }).exec();

    let count = 0;
    for (const pack of expiredPacks) {
      try {
        const userIdStr = pack.userId.toString();
        const currentHash = await RecommendationService.generateProfileHash(userIdStr);
        await BackgroundGenerationService.trigger(userIdStr, currentHash, 'CACHE_EXPIRED');
        count++;
      } catch (err: any) {
        console.error(
          `[Scheduler] Failed to trigger regeneration for user ${pack.userId}:`,
          err.message,
        );
      }
    }
    return count;
  }

  /**
   * Admin Hook: Force generation for a user.
   */
  static async generateForUser(userId: string): Promise<void> {
    const currentHash = await RecommendationService.generateProfileHash(userId);
    await BackgroundGenerationService.trigger(userId, currentHash, 'LOGIN');
  }

  /**
   * Admin Hook: Delete / invalidate all existing packs for a user.
   */
  static async invalidateUser(userId: string): Promise<void> {
    await RecommendationPackModel.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();
    console.log(`[Scheduler] Invalidated all packs for user ${userId}`);
  }

  /**
   * Admin Hook: Invalidate and immediately start generation for a user.
   */
  static async regenerateUser(userId: string): Promise<void> {
    await this.invalidateUser(userId);
    await this.generateForUser(userId);
  }
}
