import { UserIntelligenceModel, IUserIntelligence } from '../models/user-intelligence.model';
import mongoose from 'mongoose';

export class UserIntelligenceRepository {
  static async findByUserId(userId: string): Promise<IUserIntelligence | null> {
    return await UserIntelligenceModel.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  }

  static async findOrCreateByUserId(userId: string): Promise<IUserIntelligence> {
    const objectId = new mongoose.Types.ObjectId(userId);
    let profile = await UserIntelligenceModel.findOne({ userId: objectId });
    if (!profile) {
      profile = await UserIntelligenceModel.create({ userId: objectId });
      console.log(`[USER_INTELLIGENCE] Initialized empty model for User: ${userId}`);
    }
    return profile;
  }

  static async upsertProfile(
    userId: string,
    data: Partial<IUserIntelligence>,
  ): Promise<IUserIntelligence> {
    const objectId = new mongoose.Types.ObjectId(userId);

    // Convert nested objects to dot-notation to avoid overwriting entire subdocuments
    const updateQuery: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof mongoose.Types.ObjectId)
      ) {
        for (const [subKey, subValue] of Object.entries(value)) {
          updateQuery[`${key}.${subKey}`] = subValue;
        }
      } else {
        updateQuery[key] = value;
      }
    }

    return (await UserIntelligenceModel.findOneAndUpdate(
      { userId: objectId },
      { $set: updateQuery },
      { upsert: true, returnDocument: 'after' },
    )) as IUserIntelligence;
  }

  static async completeOnboarding(userId: string): Promise<IUserIntelligence | null> {
    const objectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    return await UserIntelligenceModel.findOneAndUpdate(
      { userId: objectId },
      {
        $set: {
          'onboarding.completed': true,
          'onboarding.completedAt': now,
        },
      },
      { returnDocument: 'after' },
    );
  }
}
