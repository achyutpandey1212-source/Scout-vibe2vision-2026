'use client';

/**
 * ==========================================
 *          APPLICATION ERROR PAGE
 * ==========================================
 * Redesigned system error page following Scout Editorial Design Language
 */

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardLayout } from '@/components/layout';
import { BrandLogo } from '@/components/branding';
import { PageTransition } from '@/components/ui';
import { ROUTES } from '@/lib/constants/routes';
import { RotateCw, LayoutDashboard } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const { user } = useAuth();

  useEffect(() => {
    // Log unexpected runtime errors for diagnostic tracking
    console.error('Unhandled application error:', error);
  }, [error]);

  const content = (
    <PageTransition>
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-8 sm:py-12 px-4 max-w-xl mx-auto select-none">
        {/* Illustration */}
        <div className="relative w-full max-w-[280px] sm:max-w-[420px] aspect-[4/3] mx-auto flex items-center justify-center">
          <img
            src="/Illustrations/error.png"
            alt="Application Error"
            className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
          />
        </div>

        {/* Headlines & Supporting Copy */}
        <div className="space-y-2 max-w-md">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-medium text-foreground tracking-tight leading-tight">
            Something went wrong.
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
            Scout ran into an unexpected problem while loading this page. Please try again.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href={ROUTES.DASHBOARD}
            className="w-full sm:w-auto px-6 py-2.5 bg-card border border-border/80 text-foreground text-xs font-medium rounded-xl hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4 text-muted-foreground/70" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </PageTransition>
  );

  // Render within application shell if authenticated
  if (user) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  // Standalone layout for unauthenticated visitors
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header Logo */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-4">
        <Link href={ROUTES.HOME} className="flex items-center">
          <BrandLogo size="md" showWordmark={true} />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center my-auto">{content}</main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto py-4 text-center text-[11px] text-muted-foreground/60 font-light">
        © {new Date().getFullYear()} Scout Opportunity Intelligence. All rights reserved.
      </footer>
    </div>
  );
}
