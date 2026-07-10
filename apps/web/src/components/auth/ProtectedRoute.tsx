'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/');
      } else if (!user.onboardingCompleted && pathname !== '/onboarding') {
        router.replace('/onboarding');
      } else if (user.onboardingCompleted && pathname === '/onboarding') {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
        {/* Premium Minimalist Spinner / Origami-style loader */}
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-light text-secondary tracking-wide">
          Resolving credentials...
        </span>
      </div>
    );
  }

  const isAuthorized =
    user &&
    ((pathname === '/onboarding' && !user.onboardingCompleted) ||
      (pathname !== '/onboarding' && user.onboardingCompleted));

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
