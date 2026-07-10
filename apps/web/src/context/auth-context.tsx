'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '@/services/auth/auth.service';
import { api } from '@/lib/api';
import { DEV_USER, isDevelopmentMode } from '@/lib/mock/dev-session';

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
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<ScoutUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user details with backend
  const syncWithBackend = async () => {
    try {
      const response = await api.post('/api/v1/auth/sync');
      if (response.data && response.data.success) {
        const dbUser = response.data.data;
        setUser({
          ...dbUser,
          name: dbUser.displayName || dbUser.email.split('@')[0],
          picture: dbUser.photoURL || null,
        });
      }
    } catch (error) {
      console.error('Backend sync failed:', error);
      if (isDevelopmentMode) {
        console.warn('Development mode: falling back to mock user session.');
        setUser(DEV_USER);
      } else {
        setUser(null);
      }
    }
  };

  useEffect(() => {
    // If in development mode, automatically log in with DEV_USER to bypass Firebase client setup requirements
    if (isDevelopmentMode) {
      setUser(DEV_USER);
      setLoading(false);
      return;
    }

    const unsubscribe = authService.onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Fetch verified user details from our server
        await syncWithBackend();
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    setLoading(true);
    try {
      await authService.loginWithGoogle();
      await syncWithBackend();
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.logout();
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
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signOut, syncWithBackend }}>
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
