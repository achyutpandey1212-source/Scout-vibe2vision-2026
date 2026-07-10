'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '@/services/auth/auth.service';
import { api } from '@/lib/api';

interface ScoutUser {
  uid: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: ScoutUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<ScoutUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user details with backend
  const syncWithBackend = async () => {
    try {
      const response = await api.get('/api/v1/auth/me');
      if (response.data && response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Backend sync failed:', error);
      setUser(null);
    }
  };

  useEffect(() => {
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
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signOut }}>
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
