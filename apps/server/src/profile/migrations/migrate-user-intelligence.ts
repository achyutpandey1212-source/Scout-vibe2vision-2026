import { UserIntelligenceModel } from '../models/user-intelligence.model';
import { ProfileModel } from '../models/profile.model';

export async function migrateUserIntelligenceToProfile(): Promise<{
  total: number;
  migrated: number;
  errors: number;
}> {
  console.log('[MIGRATION] Starting migration from UserIntelligence to Profile...');
  const userIntelligences = await UserIntelligenceModel.find({});
  let migrated = 0;
  let errors = 0;

  for (const ui of userIntelligences) {
    try {
      const userId = ui.userId;

      // Map preferences based on string values
      const hasInternships =
        ui.opportunityExcitement?.some((t: string) => /internship/i.test(t)) || false;
      const hasHackathons =
        ui.opportunityExcitement?.some((t: string) => /hackathon/i.test(t)) || false;
      const hasScholarships =
        ui.opportunityExcitement?.some((t: string) => /scholarship/i.test(t)) || false;

      const profileData = {
        userId,
        fullName: ui.identity?.preferredName || '',
        gender: 'UNKNOWN',
        college: ui.educationDetail?.college || '',
        university: '',
        degree: ui.educationDetail?.qualification || '',
        branch: ui.educationDetail?.course || '',
        expectedGraduation: ui.educationDetail?.graduationYear || undefined,
        interestDomains: ui.situations || [],
        preferredRoles: ui.workDetail?.role ? [ui.workDetail.role] : [],
        careerGoals: ui.whyHere || [],
        primaryMotivation: ui.whyHere?.[0] || '',
        secondaryMotivations: ui.whyHere?.slice(1) || [],
        preferredLocations: ui.workPreferences || [],
        remotePreference: ui.workPreferences?.some((p: string) => /remote/i.test(p)) || false,
        startupPreference: ui.workPreferences?.some((p: string) => /startup/i.test(p)) || false,
        opportunityPreferences: {
          internships: hasInternships,
          hackathons: hasHackathons,
          scholarships: hasScholarships,
          research: false,
          events: false,
          bootcamps: false,
          opensource: false,
          competitions: false,
          training: false,
          volunteer: false,
          earlyCareerPrograms: false,
          partTime: false,
        },
        careerReadinessScore: ui.readinessIllustrativeLevel || 0,
        profileCompleteness: ui.onboarding?.completed ? 100 : 20,
      };

      await ProfileModel.findOneAndUpdate(
        { userId },
        { $set: profileData },
        { upsert: true, returnDocument: 'after' },
      );
      migrated++;
    } catch (err) {
      console.error(`[MIGRATION] Error migrating user ${ui.userId}:`, err);
      errors++;
    }
  }

  console.log(
    `[MIGRATION] Completed. Total processed: ${userIntelligences.length}, Migrated: ${migrated}, Errors: ${errors}`,
  );
  return {
    total: userIntelligences.length,
    migrated,
    errors,
  };
}
