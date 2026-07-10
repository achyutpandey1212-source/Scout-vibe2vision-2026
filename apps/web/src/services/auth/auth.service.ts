import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword as fbSignInWithEmail,
  createUserWithEmailAndPassword as fbCreateUserWithEmail,
  signInAnonymously as fbSignInAnonymously,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/client';

export class AuthService {
  async loginWithGoogle(): Promise<User> {
    if (!auth || !auth.app) {
      throw new Error(
        'Firebase Auth is not initialized. Please configure your environment variables.',
      );
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Error during Google Sign In:', error);
      throw error;
    }
  }

  async loginWithEmail(email: string, pass: string): Promise<User> {
    if (!auth || !auth.app) {
      throw new Error('Firebase Auth is not initialized.');
    }
    try {
      const result = await fbSignInWithEmail(auth, email, pass);
      return result.user;
    } catch (error) {
      console.error('Error during Email Sign In:', error);
      throw error;
    }
  }

  async signupWithEmail(email: string, pass: string, name: string): Promise<User> {
    if (!auth || !auth.app) {
      throw new Error('Firebase Auth is not initialized.');
    }
    try {
      const result = await fbCreateUserWithEmail(auth, email, pass);
      await updateProfile(result.user, {
        displayName: name,
      });
      return result.user;
    } catch (error) {
      console.error('Error during Email Sign Up:', error);
      throw error;
    }
  }

  async signInAsGuest(): Promise<User> {
    if (!auth || !auth.app) {
      throw new Error('Firebase Auth is not initialized.');
    }
    try {
      const result = await fbSignInAnonymously(auth);
      return result.user;
    } catch (error) {
      console.error('Error during Guest Sign In:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    if (!auth || !auth.app) {
      return;
    }
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.error('Error during log out:', error);
      throw error;
    }
  }

  onAuthChange(callback: (user: User | null) => void): () => void {
    if (!auth || !auth.app) {
      console.warn('Firebase Auth is not initialized. Auth changes will not be tracked.');
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }
}

export const authService = new AuthService();
export default authService;
