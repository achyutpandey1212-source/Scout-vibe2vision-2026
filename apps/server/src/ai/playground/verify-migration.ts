import { db } from '../../config/db';
import { UserIntelligenceModel } from '../../profile/models/user-intelligence.model';
import { ProfileModel } from '../../profile/models/profile.model';
import { migrateUserIntelligenceToProfile } from '../../profile/migrations/migrate-user-intelligence';

async function main() {
  console.log('🏁 Starting migration verification script...');

  // Connect to DB
  await db.connect();

  try {
    // -------------------------------------------------------------
    // STEP 1: Dry Run
    // -------------------------------------------------------------
    console.log('\n--- 1. Dry Run ---');
    const totalUI = await UserIntelligenceModel.countDocuments({});
    const totalProfilesBefore = await ProfileModel.countDocuments({});
    console.log(`Total UserIntelligence documents: ${totalUI}`);
    console.log(`Total Profile documents before: ${totalProfilesBefore}`);

    // Check for invalid users
    const invalidUI = await UserIntelligenceModel.find({ userId: { $exists: false } });
    console.log(`UserIntelligence documents missing userId: ${invalidUI.length}`);
    if (invalidUI.length > 0) {
      console.log(
        '⚠️ Invalid documents details:',
        invalidUI.map((d: any) => d._id),
      );
    }

    // -------------------------------------------------------------
    // STEP 2: Single Test User Migration
    // -------------------------------------------------------------
    console.log('\n--- 2. Single Test User Migration ---');
    const testUI = await UserIntelligenceModel.findOne({ userId: { $exists: true } });
    if (!testUI) {
      console.log('❌ No UserIntelligence documents found to test with.');
      return;
    }

    const testUserId = testUI.userId.toString();
    console.log(`Selected test userId: ${testUserId}`);

    // Ensure we start clean for this test user's Profile
    const backupProfile = await ProfileModel.findOne({ userId: testUI.userId });
    if (backupProfile) {
      console.log(`Found existing Profile for test user. Deleting it to verify clean creation...`);
      await ProfileModel.deleteOne({ userId: testUI.userId });
    }

    // Run migration on this single user (custom inline to avoid running the full migration)
    const hasInternships =
      testUI.opportunityExcitement?.some((t: string) => /internship/i.test(t)) || false;
    const hasHackathons =
      testUI.opportunityExcitement?.some((t: string) => /hackathon/i.test(t)) || false;
    const hasScholarships =
      testUI.opportunityExcitement?.some((t: string) => /scholarship/i.test(t)) || false;

    const profileData = {
      userId: testUI.userId,
      fullName: testUI.identity?.preferredName || '',
      gender: 'UNKNOWN',
      college: testUI.educationDetail?.college || '',
      university: '',
      degree: testUI.educationDetail?.qualification || '',
      branch: testUI.educationDetail?.course || '',
      expectedGraduation: testUI.educationDetail?.graduationYear || undefined,
      interestDomains: testUI.situations || [],
      preferredRoles: testUI.workDetail?.role ? [testUI.workDetail.role] : [],
      careerGoals: testUI.whyHere || [],
      primaryMotivation: testUI.whyHere?.[0] || '',
      secondaryMotivations: testUI.whyHere?.slice(1) || [],
      preferredLocations: testUI.workPreferences || [],
      remotePreference: testUI.workPreferences?.some((p: string) => /remote/i.test(p)) || false,
      startupPreference: testUI.workPreferences?.some((p: string) => /startup/i.test(p)) || false,
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
      careerReadinessScore: testUI.readinessIllustrativeLevel || 0,
      profileCompleteness: testUI.onboarding?.completed ? 100 : 20,
    };

    const createdProfile = await ProfileModel.findOneAndUpdate(
      { userId: testUI.userId },
      { $set: profileData },
      { upsert: true, returnDocument: 'after' },
    );

    // Verify UserIntelligence still exists
    const uiVerify = await UserIntelligenceModel.findOne({ userId: testUI.userId });
    console.log(`Verification - UserIntelligence document still exists: ${!!uiVerify}`);

    // Verify Profile document was created
    const profileVerify = await ProfileModel.findOne({ userId: testUI.userId });
    console.log(`Verification - Profile document was created: ${!!profileVerify}`);

    // Count Profiles for test user to ensure no duplicates
    const testProfilesCount = await ProfileModel.countDocuments({ userId: testUI.userId });
    console.log(`Verification - Count of Profiles for test user: ${testProfilesCount}`);

    // Comparison display
    console.log('\n=== Transformation Mapping Comparison ===');
    console.log('UserIntelligence (Source)                 -> Profile (Target)');
    console.log(
      `identity.preferredName: "${testUI.identity?.preferredName}" -> fullName: "${createdProfile.fullName}"`,
    );
    console.log(
      `educationDetail.college: "${testUI.educationDetail?.college}" -> college: "${createdProfile.college}"`,
    );
    console.log(
      `educationDetail.qualification: "${testUI.educationDetail?.qualification}" -> degree: "${createdProfile.degree}"`,
    );
    console.log(
      `educationDetail.course: "${testUI.educationDetail?.course}" -> branch: "${createdProfile.branch}"`,
    );
    console.log(
      `educationDetail.graduationYear: ${testUI.educationDetail?.graduationYear} -> expectedGraduation: ${createdProfile.expectedGraduation}`,
    );
    console.log(
      `situations: ${JSON.stringify(testUI.situations)} -> interestDomains: ${JSON.stringify(createdProfile.interestDomains)}`,
    );
    console.log(
      `workDetail.role: "${testUI.workDetail?.role}" -> preferredRoles: ${JSON.stringify(createdProfile.preferredRoles)}`,
    );
    console.log(
      `whyHere: ${JSON.stringify(testUI.whyHere)} -> careerGoals: ${JSON.stringify(createdProfile.careerGoals)}`,
    );
    console.log(
      `opportunityExcitement: ${JSON.stringify(testUI.opportunityExcitement)} -> opportunityPreferences: ${JSON.stringify(createdProfile.opportunityPreferences)}`,
    );
    console.log(
      `workPreferences: ${JSON.stringify(testUI.workPreferences)} -> remote: ${createdProfile.remotePreference}, startup: ${createdProfile.startupPreference}`,
    );
    console.log(
      `readinessIllustrativeLevel: ${testUI.readinessIllustrativeLevel} -> careerReadinessScore: ${createdProfile.careerReadinessScore}`,
    );
    console.log(
      `onboarding.completed: ${testUI.onboarding?.completed} -> profileCompleteness: ${createdProfile.profileCompleteness}`,
    );

    // Check for null or missing required fields
    console.log('\n--- 3. Required Fields Null Check ---');
    console.log(`userId: ${createdProfile.userId ? 'OK' : 'NULL'}`);
    console.log(`fullName: ${createdProfile.fullName !== undefined ? 'OK' : 'UNDEFINED'}`);
    console.log(`gender: ${createdProfile.gender ? 'OK' : 'NULL'}`);
    console.log(`college: ${createdProfile.college !== undefined ? 'OK' : 'UNDEFINED'}`);
    console.log(`degree: ${createdProfile.degree !== undefined ? 'OK' : 'UNDEFINED'}`);
    console.log(`branch: ${createdProfile.branch !== undefined ? 'OK' : 'UNDEFINED'}`);

    // -------------------------------------------------------------
    // STEP 3: Idempotency check
    // -------------------------------------------------------------
    console.log('\n--- 4. Idempotency Check ---');
    console.log('Running migration on the same test user again...');
    const createdProfile2 = await ProfileModel.findOneAndUpdate(
      { userId: testUI.userId },
      { $set: profileData },
      { upsert: true, returnDocument: 'after' },
    );
    const testProfilesCount2 = await ProfileModel.countDocuments({ userId: testUI.userId });
    console.log(
      `Verification - Count of Profiles for test user after run 2: ${testProfilesCount2}`,
    );

    // Check if createdProfile and createdProfile2 have the same ID andUpdatedAt timestamps
    console.log(`Same _id: ${createdProfile._id.toString() === createdProfile2._id.toString()}`);

    // Restore backup if it existed
    if (backupProfile) {
      console.log("Restoring test user's original Profile...");
      await ProfileModel.findOneAndReplace({ userId: testUI.userId }, backupProfile);
    } else {
      console.log('No original Profile to restore, deleting test Profile to keep state clean.');
      await ProfileModel.deleteOne({ userId: testUI.userId });
    }
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await db.disconnect();
    console.log('\n🔌 Database disconnected. Verification complete.');
  }
}

main().catch((err) => console.error(err));
