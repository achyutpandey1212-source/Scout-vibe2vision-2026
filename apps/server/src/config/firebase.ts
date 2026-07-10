import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth, Auth, DecodedIdToken } from 'firebase-admin/auth';
import { env } from './env';

class FirebaseManager {
  private isConfigured = false;
  private authInstance: Auth | null = null;

  initialize(): void {
    if (this.isConfigured) {
      return;
    }

    try {
      const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

      initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });

      this.authInstance = getAuth();
      this.isConfigured = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  getAuth(): Auth {
    if (!this.isConfigured) {
      this.initialize();
    }
    return this.authInstance!;
  }

  isInitialized(): boolean {
    return this.isConfigured;
  }
}

export const firebase = new FirebaseManager();
export type { DecodedIdToken };
