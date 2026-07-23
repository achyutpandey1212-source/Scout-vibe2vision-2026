'use client';

/**
 * ==========================================
 *            ABOUT SCOUT PAGE
 * ==========================================
 * Editorial placeholder for Scout's story & mission.
 */

import React from 'react';
import Link from 'next/link';
import { Brand } from '@/components/common/Brand';
import { Footer } from '@/components/layout/Footer';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTransition } from '@/components/ui';
import { ROUTES } from '@/lib/constants/routes';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <AppLayout showAccents={false}>
      <div className="min-h-screen flex flex-col justify-between select-none">
        {/* Header */}
        <header className="sticky top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Brand size="sm" href="/" />
            <Link
              href={ROUTES.DASHBOARD}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
          </div>
        </header>

        {/* Main Editorial Content */}
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-8 text-center flex flex-col justify-center">
          <PageTransition>
            <div className="space-y-6">
              {/* Coming Soon Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mx-auto">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Coming Soon</span>
              </div>

              {/* Large Brand Lockup */}
              <div className="flex justify-center pb-2">
                <Brand size="xl" showWordmark={true} />
              </div>

              {/* Display Headline */}
              <h1 className="text-3xl sm:text-5xl font-display font-medium text-foreground tracking-tight leading-tight">
                About Scout
              </h1>

              {/* Mission Statement */}
              <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed max-w-xl mx-auto">
                Scout is an AI-powered opportunity intelligence platform built independently to help
                students discover verified internships, hackathons, fellowships, and scholarships
                they would&apos;ve otherwise missed.
              </p>

              <p className="text-xs text-muted-foreground/70 font-light max-w-md mx-auto pt-2">
                We are currently crafting Scout&apos;s full story and engineering philosophy page.
                Check back soon for deeper insights into how our discovery engine works.
              </p>

              {/* Action Button */}
              <div className="pt-4">
                <Link
                  href={ROUTES.HOME}
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </PageTransition>
        </main>

        {/* Universal Footer */}
        <Footer />
      </div>
    </AppLayout>
  );
}
