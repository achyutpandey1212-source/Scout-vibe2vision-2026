'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/auth-context';
import { LogOut } from 'lucide-react';

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
        <h1 className="text-3xl font-light">
          Welcome to the Protected <span className="font-semibold text-primary">Dashboard</span>
        </h1>
        <p className="text-secondary max-w-md font-light">
          Hello {user?.name || 'Scout User'}! You have successfully logged in using Google OAuth.
        </p>
        <button
          onClick={signOut}
          className="flex items-center space-x-2 px-6 py-2.5 bg-card hover:bg-destructive hover:text-destructive-foreground text-foreground border border-border rounded-full text-sm font-medium transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </ProtectedRoute>
  );
}
