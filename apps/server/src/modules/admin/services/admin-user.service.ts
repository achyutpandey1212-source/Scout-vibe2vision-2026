import { UserModel } from '../../../auth/models/user.model';
import { ProfileModel } from '../../../profile/models/profile.model';
import { BookmarkModel } from '../../../auth/models/bookmark.model';
import { ResumeModel } from '../../../profile/models/resume.model';
import { RecommendationPackModel } from '../../recommendation/schemas/recommendation-pack.schema';
import { RecommendationEventModel } from '../../recommendation/analytics/recommendation-analytics.service';
import mongoose from 'mongoose';

export class AdminUserService {
  /**
   * Retrieves user list with search, filter, sorting, and computed stats.
   */
  static async listUsers(query: {
    search?: string;
    authProvider?: string;
    recStatus?: string;
    profileCompletion?: string;
    role?: string;
    sortBy?: string;
  }) {
    const filter: any = {};

    // Search by name or email
    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ displayName: searchRegex }, { email: searchRegex }];
    }

    // Auth Provider filter
    if (query.authProvider && query.authProvider !== 'ALL') {
      if (query.authProvider === 'Google') {
        filter.provider = { $regex: /google/i };
      } else if (query.authProvider === 'Guest') {
        filter.provider = { $regex: /guest/i };
      } else {
        filter.provider = new RegExp(query.authProvider, 'i');
      }
    }

    // Role filter
    if (query.role && query.role !== 'ALL') {
      filter.role = query.role.toUpperCase();
    }

    // Fetch users
    const users = await UserModel.find(filter).sort({ createdAt: -1 }).lean().exec();

    // Enrich users with profiles, latest recommendation pack, bookmarks count
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const userId = u._id.toString();

        const [profile, latestPack, savedCount, eventCount] = await Promise.all([
          ProfileModel.findOne({ userId: u._id }).lean().exec(),
          RecommendationPackModel.findOne({ userId: u._id })
            .sort({ generatedAt: -1 })
            .lean()
            .exec(),
          BookmarkModel.countDocuments({ userId: u._id }),
          RecommendationEventModel.countDocuments({ userId: u._id }),
        ]);

        // Calculate profile completion %
        let profileCompletion = 0;
        if (profile) {
          let filled = 0;
          const total = 7;
          if (profile.fullName) filled++;
          if (profile.degree || profile.branch) filled++;
          if (profile.college || profile.university) filled++;
          if (profile.technicalSkills && profile.technicalSkills.length > 0) filled++;
          if (profile.preferredRoles && profile.preferredRoles.length > 0) filled++;
          if (profile.interestDomains && profile.interestDomains.length > 0) filled++;
          if (profile.state || profile.city) filled++;
          profileCompletion = Math.round((filled / total) * 100);
        }

        const recStatus = latestPack ? latestPack.status : 'NO_PACK';
        const recsGeneratedCount = await RecommendationPackModel.countDocuments({ userId: u._id });

        return {
          id: userId,
          _id: userId,
          displayName: u.displayName || u.email.split('@')[0],
          email: u.email,
          photoURL: u.photoURL || null,
          provider: u.provider || 'google.com',
          role: u.role || 'USER',
          status: u.status || 'ACTIVE',
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt || u.createdAt,
          lastSeenAt: u.lastSeenAt || (u as any).updatedAt || u.createdAt,
          // Persona & Career Stage
          persona: profile?.degree ? `${profile.degree} Student` : 'Candidate',
          careerStage: profile?.currentYear
            ? `Year ${profile.currentYear}`
            : profile?.degree || 'Fresh Graduate',
          profileCompletion,
          // Recommendation & Activity stats
          recommendationStatus: recStatus,
          recommendationsGenerated: recsGeneratedCount,
          savedOpportunitiesCount: savedCount,
          analyticsEventCount: eventCount,
        };
      }),
    );

    // Apply Rec Status filter if provided
    let result = enrichedUsers;
    if (query.recStatus && query.recStatus !== 'ALL') {
      result = result.filter((u) => u.recommendationStatus === query.recStatus);
    }

    // Apply Profile Completion filter if provided
    if (query.profileCompletion && query.profileCompletion !== 'ALL') {
      if (query.profileCompletion === 'Complete') {
        result = result.filter((u) => u.profileCompletion === 100);
      } else if (query.profileCompletion === 'Incomplete') {
        result = result.filter((u) => u.profileCompletion < 100);
      }
    }

    // Apply Sorting
    const sortBy = query.sortBy || 'Newest';
    result.sort((a: any, b: any) => {
      if (sortBy === 'Newest')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'Oldest')
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'Last Active')
        return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
      if (sortBy === 'Most Recommendations')
        return b.recommendationsGenerated - a.recommendationsGenerated;
      if (sortBy === 'Profile Completion') return b.profileCompletion - a.profileCompletion;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }

  /**
   * Retrieves comprehensive user details for the side drawer view.
   */
  static async getUserDetails(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid User ID');
    }
    const userObjId = new mongoose.Types.ObjectId(userId);

    const [user, profile, resume, latestPack, totalPacks, savedCount, eventCount] =
      await Promise.all([
        UserModel.findById(userObjId).lean().exec(),
        ProfileModel.findOne({ userId: userObjId }).lean().exec(),
        ResumeModel.findOne({ userId: userObjId }).lean().exec(),
        RecommendationPackModel.findOne({ userId: userObjId })
          .sort({ generatedAt: -1 })
          .lean()
          .exec(),
        RecommendationPackModel.countDocuments({ userId: userObjId }),
        BookmarkModel.countDocuments({ userId: userObjId }),
        RecommendationEventModel.countDocuments({ userId: userObjId }),
      ]);

    if (!user) {
      throw new Error('User not found');
    }

    let profileCompletion = 0;
    if (profile) {
      let filled = 0;
      const total = 7;
      if (profile.fullName) filled++;
      if (profile.degree || profile.branch) filled++;
      if (profile.college || profile.university) filled++;
      if (profile.technicalSkills && profile.technicalSkills.length > 0) filled++;
      if (profile.preferredRoles && profile.preferredRoles.length > 0) filled++;
      if (profile.interestDomains && profile.interestDomains.length > 0) filled++;
      if (profile.state || profile.city) filled++;
      profileCompletion = Math.round((filled / total) * 100);
    }

    return {
      basic: {
        id: user._id.toString(),
        displayName: user.displayName || 'Unnamed Candidate',
        email: user.email,
        firebaseUid: user.firebaseUid,
        photoURL: user.photoURL,
        provider: user.provider || 'google.com',
        role: user.role || 'USER',
        status: user.status || 'ACTIVE',
        createdAt: user.createdAt,
        updatedAt: (user as any).updatedAt,
        lastLoginAt: user.lastLoginAt,
        lastSeenAt: user.lastSeenAt,
      },
      profile: profile
        ? {
            fullName: profile.fullName,
            gender: profile.gender,
            state: profile.state,
            city: profile.city,
            college: profile.college,
            university: profile.university,
            degree: profile.degree,
            branch: profile.branch,
            currentYear: profile.currentYear,
            expectedGraduation: profile.expectedGraduation,
            technicalSkills: profile.technicalSkills || [],
            preferredRoles: profile.preferredRoles || [],
            interestDomains: profile.interestDomains || [],
            profileCompletion,
          }
        : null,
      activity: {
        recommendationsGenerated: totalPacks,
        savedOpportunitiesCount: savedCount,
        analyticsEventCount: eventCount,
        resumeUploaded: Boolean(resume),
        resumeFileName: (resume as any)?.originalFilename || null,
        resumeUploadedAt: (resume as any)?.createdAt || null,
        lastRecommendationGenerated: latestPack?.generatedAt || null,
        lastActive: user.lastSeenAt || user.lastLoginAt || user.createdAt,
      },
      recommendationStatus: {
        currentFingerprint: latestPack?.profileHash || 'None',
        latestPackStatus: latestPack?.status || 'NO_PACK',
        latestPackGenerated: latestPack?.generatedAt || null,
        latestPackVersion: latestPack?.promptVersion || 'N/A',
        cacheStatus: latestPack?.status === 'READY' ? 'VALID' : 'STALE_OR_MISSING',
      },
    };
  }
}
