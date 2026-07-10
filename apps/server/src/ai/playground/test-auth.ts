import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { UserRepository } from '../../auth/repository/user.repository';
import { AuthService } from '../../auth/services/auth.service';
import { UserModel } from '../../auth/models/user.model';

async function runAuthPlayground() {
  console.log('🏁 Starting Authentication Core Playground...\n');

  // Connect database and cache
  await db.connect();
  redis.connect();

  try {
    const mockUid = 'mock-firebase-uid-12345';
    const mockEmail = 'mentor.scout@example.com';
    const mockClaims = {
      uid: mockUid,
      email: mockEmail,
      name: 'Elena Rostova',
      picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      emailVerified: true,
      provider: 'google.com',
    };

    // 1. Clean existing mock user if present
    console.log('🧹 Cleaning existing mock users from MongoDB...');
    await UserModel.deleteOne({ firebaseUid: mockUid });

    // 2. Test User Creation / Upsert via Repository
    console.log('\n📝 Testing User creation via UserRepository...');
    const user1 = await UserRepository.upsertUser(mockUid, {
      email: mockClaims.email,
      displayName: mockClaims.name,
      photoURL: mockClaims.picture,
      emailVerified: mockClaims.emailVerified,
      provider: mockClaims.provider,
    });
    console.log(`✅ User Upserted: ${user1.displayName} (${user1.email}) | Role: ${user1.role}`);

    // Verify properties
    if (user1.firebaseUid !== mockUid || user1.email !== mockEmail) {
      throw new Error('User creation properties mismatch');
    }

    // 3. Test Retrieval
    console.log('\n🔍 Testing User retrieval by Firebase UID...');
    const retrievedUser = await UserRepository.findByFirebaseUid(mockUid);
    if (!retrievedUser) {
      throw new Error('Failed to retrieve user by Firebase UID');
    }
    console.log(
      `✅ Retrieved user: ${retrievedUser.displayName} | Active: ${retrievedUser.isActive}`,
    );

    // 4. Test Service Identity Sync & Logging
    console.log('\n🔄 Testing AuthService identity sync logic...');
    // This will log "Existing User Authenticated" because the user already exists in DB
    const syncedUser = await AuthService.syncUser(mockClaims);
    console.log(`✅ Synced User displayName: ${syncedUser.displayName}`);

    // Verify lastLoginAt exists and is close to now
    if (syncedUser.lastLoginAt) {
      const now = new Date();
      const diffMs = Math.abs(syncedUser.lastLoginAt.getTime() - now.getTime());
      if (diffMs > 5000) {
        console.warn('⚠️ lastLoginAt timestamp is older than expected');
      } else {
        console.log('`✅ lastLoginAt verified near current system time`');
      }
    } else {
      throw new Error('lastLoginAt is undefined');
    }

    // 5. Test health status checks
    console.log('\n🩺 Checking DB and services health diagnostics...');
    const mongoHealth = db.getHealth();
    console.log(`✅ MongoDB Connection status: ${mongoHealth}`);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Authentication core test failed:', errMsg);
  } finally {
    console.log('\n🔌 Disconnecting database and cache connections...');
    await db.disconnect();
    await redis.disconnect();
    console.log('👋 Done.');
  }
}

runAuthPlayground().catch((err: unknown) => {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error('Fatal playground error:', errMsg);
  db.disconnect().catch(() => {});
  redis.disconnect().catch(() => {});
});
