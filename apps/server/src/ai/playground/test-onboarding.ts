import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { UserIntelligenceRepository } from '../../profile/repository/user-intelligence.repository';
import { UserModel } from '../../auth/models/user.model';
import { UserIntelligenceModel } from '../../profile/models/user-intelligence.model';

async function runOnboardingPlayground() {
  console.log('🏁 Starting Onboarding & User Intelligence Playground...\n');

  // Connect database and cache
  await db.connect();
  redis.connect();

  try {
    const mockUid = 'mock-onboarder-uid-56789';
    const mockEmail = 'onboarding.test@example.com';

    // 1. Create a dummy user to link the profile
    console.log('👤 Synchronizing mockup user...');
    await UserModel.deleteOne({ firebaseUid: mockUid });
    const dummyUser = await UserModel.create({
      firebaseUid: mockUid,
      email: mockEmail,
      displayName: 'Maya Devi',
      photoURL: null,
      provider: 'google.com',
      emailVerified: true,
    });
    const userId = dummyUser._id.toString();

    // Clean existing intelligence profile if present
    await UserIntelligenceModel.deleteOne({ userId: dummyUser._id });

    // 2. Test profile initialization
    console.log('\n📝 Testing profile initialization...');
    const profile = await UserIntelligenceRepository.findOrCreateByUserId(userId);
    console.log(
      `✅ Profile Initialized. Step: ${profile.onboarding.currentStep} | Completed: ${profile.onboarding.completed}`,
    );

    // 3. Test partial update autosave (Step 3: situations & Step 7: magic problem)
    console.log('\n🔄 Testing partial profile updates (Autosave emulation)...');
    const update1 = await UserIntelligenceRepository.upsertProfile(userId, {
      identity: { preferredName: 'Maya' },
      situations: ["🏠 I'm managing my home and family", "🔄 I'm planning a comeback"],
      magicOneProblem: 'Help me restart my career',
      onboarding: {
        version: '1.0',
        completed: false,
        currentStep: 7,
        completedAt: null,
      },
    });
    console.log(
      `✅ Upserted partial profile. Current step set to: ${update1.onboarding.currentStep}`,
    );
    console.log(`Preferred Name: ${update1.identity.preferredName}`);
    console.log(`Selected situations: ${update1.situations.join(', ')}`);
    console.log(`Magic problem target: ${update1.magicOneProblem}`);

    // Verify subdocument merging (updating companionPreferences shouldn't wipe details)
    const update2 = await UserIntelligenceRepository.upsertProfile(userId, {
      companionPreferences: {
        tone: 'gentle',
        celebrationStyle: '🎉 Loud',
        guidanceLevel: 'Guide me like a mentor',
        preferredLanguage: 'Hinglish',
        reminderStyle: 'Flexible',
      },
    });
    console.log(`✅ Exchanged companion preferences. Verification check:`);
    console.log(`Language Natural Comfort: ${update2.companionPreferences.preferredLanguage}`);
    console.log(`Preferred Name (should be preserved): ${update2.identity.preferredName}`);

    if (update2.identity.preferredName !== 'Maya') {
      throw new Error('Identity subdocument was overwritten during companion update!');
    } else {
      console.log('✅ Identity subdocument successfully preserved (nested dot-notation verified)');
    }

    // 4. Test onboarding completion API
    console.log('\n🏆 Testing onboarding completion finalization...');
    const finalProfile = await UserIntelligenceRepository.completeOnboarding(userId);
    if (!finalProfile) {
      throw new Error('Failed to complete onboarding profile');
    }
    console.log(`✅ Onboarding complete: ${finalProfile.onboarding.completed}`);
    console.log(`Completion timestamp: ${finalProfile.onboarding.completedAt}`);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Onboarding playground test failed:', errMsg);
  } finally {
    console.log('\n🔌 Disconnecting database and cache connections...');
    await db.disconnect();
    await redis.disconnect();
    console.log('👋 Done.');
  }
}

runOnboardingPlayground().catch((err: unknown) => {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error('Fatal playground error:', errMsg);
  db.disconnect().catch(() => {});
  redis.disconnect().catch(() => {});
});
