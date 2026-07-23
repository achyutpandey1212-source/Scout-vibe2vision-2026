'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '@/services/auth/auth.service';
import { api } from '@/lib/api';
import { DEV_USER, isDevelopmentMode } from '@/lib/mock/dev-session';
import { identifyUser, resetAnalytics } from '@/lib/analytics';
import { ROUTES } from '@/lib/constants/routes';

interface ScoutUser {
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  provider: string;
  emailVerified: boolean;
  isActive: boolean;
  role: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  // Compatibility getters
  name: string;
  picture: string | null;
}

interface AuthContextType {
  user: ScoutUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: () => Promise<void>; // Default Google Auth
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<FirebaseUser | null>;
  syncWithBackend: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.VERIFY_EMAIL,
  ROUTES.DESIGN_SYSTEM,
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<ScoutUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Sync user details with backend
  const syncWithBackend = async () => {
    try {
      const response = await api.post('/api/v1/auth/sync');
      if (response.data && response.data.success) {
        const dbUser = response.data.data;
        const isGoogleOrGuest =
          dbUser.provider?.includes('google') ||
          dbUser.provider === 'guest' ||
          dbUser.role === 'guest';
        const isVerified = isGoogleOrGuest
          ? true
          : (firebaseUser?.emailVerified ?? dbUser.emailVerified);

        const mappedUser: ScoutUser = {
          ...dbUser,
          emailVerified: isVerified,
          name: dbUser.displayName || dbUser.email?.split('@')[0] || 'Student',
          picture: dbUser.photoURL || null,
        };
        setUser(mappedUser);
        identifyUser(dbUser.firebaseUid || dbUser.id || dbUser.email, {
          email: dbUser.email,
          authProvider: dbUser.provider || 'email',
          isGuest: dbUser.provider === 'guest' || dbUser.role === 'guest',
          onboardingCompleted: dbUser.onboardingCompleted || false,
        });
      }
    } catch (error) {
      console.error('Backend sync failed:', error);
      if (isDevelopmentMode) {
        console.warn('Development mode: falling back to mock user session.');
        setUser(DEV_USER);
        identifyUser(DEV_USER.firebaseUid, {
          email: DEV_USER.email,
          authProvider: DEV_USER.provider,
          isGuest: false,
          onboardingCompleted: DEV_USER.onboardingCompleted,
        });
      } else {
        setUser(null);
      }
    }
  };

  useEffect(() => {
    // If in development mode, automatically log in with DEV_USER
    if (isDevelopmentMode) {
      setUser(DEV_USER);
      identifyUser(DEV_USER.firebaseUid, {
        email: DEV_USER.email,
        authProvider: DEV_USER.provider,
        isGuest: false,
        onboardingCompleted: DEV_USER.onboardingCompleted,
      });
      setLoading(false);
      return;
    }

    const unsubscribe = authService.onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await syncWithBackend();
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Route protection for unverified email accounts
  useEffect(() => {
    if (loading || isDevelopmentMode) return;

    if (firebaseUser) {
      const isPasswordProvider = firebaseUser.providerData?.[0]?.providerId === 'password';
      const isUnverifiedPasswordUser = isPasswordProvider && !firebaseUser.emailVerified;

      // If user has unverified email and is on a protected route, redirect to /verify-email
      if (isUnverifiedPasswordUser && !PUBLIC_ROUTES.includes(pathname as any)) {
        router.push(ROUTES.VERIFY_EMAIL);
      }
    }
  }, [firebaseUser, pathname, loading, router]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await authService.loginWithGoogle();
      await syncWithBackend();
    } catch (error) {
      console.error('Google Sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = signInWithGoogle;

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const fbUser = await authService.loginWithEmail(email, pass);
      await syncWithBackend();
      if (!fbUser.emailVerified) {
        router.push(ROUTES.VERIFY_EMAIL);
      }
    } catch (error) {
      console.error('Email Sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      await authService.signupWithEmail(email, pass, name);
      await syncWithBackend();
      router.push(ROUTES.VERIFY_EMAIL);
    } catch (error) {
      console.error('Email Sign up failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    if (firebaseUser) {
      await authService.sendVerificationEmail(firebaseUser);
    }
  };

  const reloadUser = async () => {
    if (firebaseUser) {
      const reloaded = await authService.reloadUser();
      setFirebaseUser(reloaded);
      if (reloaded) {
        await syncWithBackend();
      }
      return reloaded;
    }
    return null;
  };

  const signInAsGuest = async () => {
    setLoading(true);
    try {
      await authService.signInAsGuest();
      await syncWithBackend();
    } catch (error) {
      console.error('Guest Sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.logout();
      resetAnalytics();
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signIn,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        signOut,
        sendVerificationEmail,
        reloadUser,
        syncWithBackend,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
