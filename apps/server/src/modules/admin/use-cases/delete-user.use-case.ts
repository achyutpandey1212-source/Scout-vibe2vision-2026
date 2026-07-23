import { UserModel } from '../../../auth/models/user.model';
import { ProfileModel } from '../../../profile/models/profile.model';
import { UserIntelligenceModel } from '../../../profile/models/user-intelligence.model';
import { ResumeModel } from '../../../profile/models/resume.model';
import { BookmarkModel } from '../../../auth/models/bookmark.model';
import { RecommendationPackModel } from '../../recommendation/schemas/recommendation-pack.schema';
import { RecommendationEventModel } from '../../recommendation/analytics/recommendation-analytics.service';
import mongoose from 'mongoose';

export interface IDeleteUserResult {
  success: boolean;
  deletedUserId: string;
  userEmail: string;
  stats: {
    user: number;
    profiles: number;
    intelligence: number;
    resumes: number;
    bookmarks: number;
    packs: number;
    analytics: number;
  };
}

export class DeleteUserUseCase {
  /**
   * Orchestrates cascading deletion of a user account and ALL associated documents across MongoDB.
   * Safety rules:
   * 1. Cannot delete currently authenticated admin.
   * 2. Cannot delete another ADMIN account unless ALLOW_ADMIN_USER_DELETION env is true.
   */
  static async execute(
    targetUserId: string,
    currentAdminEmailOrId?: string,
  ): Promise<IDeleteUserResult> {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new Error('Invalid user ID specified.');
    }

    const userObjId = new mongoose.Types.ObjectId(targetUserId);
    const targetUser = await UserModel.findById(userObjId).exec();

    if (!targetUser) {
      throw new Error('User not found.');
    }

    // Safety Rule 1: Prevent deleting yourself
    if (
      currentAdminEmailOrId &&
      (currentAdminEmailOrId === targetUserId ||
        currentAdminEmailOrId.toLowerCase() === targetUser.email.toLowerCase())
    ) {
      throw new Error('You cannot delete the currently authenticated administrator.');
    }

    // Safety Rule 2: Prevent deleting another ADMIN unless explicitly allowed by config
    if (targetUser.role === 'ADMIN') {
      const allowAdminDeletion = process.env.ALLOW_ADMIN_USER_DELETION === 'true';
      if (!allowAdminDeletion) {
        throw new Error('You cannot delete an Administrator account.');
      }
    }

    // Cascading deletion across ALL collections referencing this user ID
    const [userRes, profileRes, intelRes, resumeRes, bookmarkRes, packRes, analyticsRes] =
      await Promise.all([
        UserModel.deleteOne({ _id: userObjId }),
        ProfileModel.deleteMany({ userId: userObjId }),
        UserIntelligenceModel.deleteMany({ userId: userObjId }),
        ResumeModel.deleteMany({ userId: userObjId }),
        BookmarkModel.deleteMany({ userId: userObjId }),
        RecommendationPackModel.deleteMany({ userId: userObjId }),
        RecommendationEventModel.deleteMany({ userId: userObjId }),
      ]);

    const stats = {
      user: userRes.deletedCount || 0,
      profiles: profileRes.deletedCount || 0,
      intelligence: intelRes.deletedCount || 0,
      resumes: resumeRes.deletedCount || 0,
      bookmarks: bookmarkRes.deletedCount || 0,
      packs: packRes.deletedCount || 0,
      analytics: analyticsRes.deletedCount || 0,
    };

    console.log(
      `[Admin DeleteUserUseCase] Cascading deletion complete for user ${targetUser.email} (${targetUserId}):`,
      stats,
    );

    return {
      success: true,
      deletedUserId: targetUserId,
      userEmail: targetUser.email,
      stats,
    };
  }
}
