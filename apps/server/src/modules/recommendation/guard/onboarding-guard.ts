import { UserIntelligenceModel } from '../../../profile/models/user-intelligence.model';
import { ProfileModel } from '../../../profile/models/profile.model';
import mongoose from 'mongoose';

export class OnboardingGuard {
  /**
   * Evaluates if user has completed onboarding and profile requirements.
   * Generation is only permitted if onboarding & profile are complete.
   */
  static async isOnboardingCompleted(userId: string): Promise<boolean> {
    if (!userId) return false;

    try {
      const objectId = new mongoose.Types.ObjectId(userId);

      // 1. Check UserIntelligence model
      const intelligence = await UserIntelligenceModel.findOne({ userId: objectId });
      if (intelligence && intelligence.onboarding && intelligence.onboarding.completed === true) {
        return true;
      }

      // 2. Check ProfileModel completeness
      const profile = await ProfileModel.findOne({ userId: objectId });
      if (
        profile &&
        (profile.profileCompleteness >= 20 ||
          (profile.degree && profile.degree.trim() !== '') ||
          (profile.technicalSkills && profile.technicalSkills.length > 0))
      ) {
        return true;
      }

      return false;
    } catch (err) {
      console.error(`[OnboardingGuard] Error checking onboarding status for user ${userId}:`, err);
      return false;
    }
  }
}
