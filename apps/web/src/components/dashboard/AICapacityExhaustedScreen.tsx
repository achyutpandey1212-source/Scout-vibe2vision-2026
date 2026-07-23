'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/branding';
import { Clock, Check, ArrowRight, RotateCcw, AlertTriangle, Heart } from 'lucide-react';

interface AICapacityExhaustedScreenProps {
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const AICapacityExhaustedScreen: React.FC<AICapacityExhaustedScreenProps> = ({
  onRetry,
  isRetrying = false,
}) => {
  const router = useRouter();
  const [retryAttempted, setRetryAttempted] = useState(false);

  const handleRetryClick = () => {
    setRetryAttempted(true);
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8 md:p-12 select-none max-w-4xl mx-auto space-y-8">
      {/* Header Branding */}
      <header className="w-full flex items-center justify-between py-2 border-b border-border/40">
        <BrandLogo size="md" showWordmark={true} />
        <div className="flex items-center gap-2 text-xs text-amber-500 font-mono">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>High Demand • AI Capacity Busy</span>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex flex-col justify-center py-6 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-8 sm:p-10 border border-amber-500/20 bg-card/80 backdrop-blur-md rounded-3xl space-y-8 shadow-sm"
        >
          {/* Headline & Body */}
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight leading-tight">
              We&apos;re experiencing unusually high demand.
            </h1>
            <div className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed space-y-2 max-w-2xl">
              <p>Scout is currently running entirely on community-supported free infrastructure.</p>
              <p>Today our AI generation capacity has been fully used.</p>
              <p className="text-foreground font-normal">
                The good news is that your profile has already been saved successfully.
              </p>
              <p>
                We&apos;ll automatically generate your personalized recommendation portfolio as soon
                as AI capacity becomes available again.
              </p>
            </div>
          </div>

          {/* Second Section: While you wait... */}
          <div className="p-6 border border-border/80 bg-background/60 rounded-2xl space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              While you wait...
            </h3>
            <p className="text-xs text-muted-foreground font-light">You can already:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-foreground font-medium pt-1">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Explore hundreds of verified opportunities</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Search across multiple platforms in one place</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Bookmark opportunities</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Build your application shortlist</span>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="text-xs text-muted-foreground/80 font-light border-l-2 border-primary/30 pl-3 py-0.5">
            <strong className="font-medium text-foreground">
              You do NOT need to complete onboarding again.
            </strong>{' '}
            Everything has already been saved.
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/explore')}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>Explore Opportunities</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRetryClick}
              disabled={isRetrying}
              className="w-full sm:w-auto px-6 py-3 border border-border/80 bg-background text-foreground text-xs font-medium rounded-xl hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 text-muted-foreground ${isRetrying ? 'animate-spin' : ''}`}
              />
              <span>
                {isRetrying ? 'Checking Capacity...' : retryAttempted ? 'Retrying...' : 'Retry Now'}
              </span>
            </button>
          </div>

          {/* Nice Reassurance */}
          <p className="text-[11px] text-muted-foreground/70 font-light leading-relaxed">
            Recommendation reports are usually generated automatically within the next daily AI
            refresh. We&apos;ll be waiting when you come back.
          </p>
        </motion.div>
      </main>

      {/* Small Footer */}
      <footer className="w-full py-3 text-center text-[11px] text-muted-foreground/60 font-light border-t border-border/40 flex items-center justify-center gap-1">
        <span>
          Thank you for trying Scout while we&apos;re still building. Every new user helps us
          improve the platform.
        </span>
        <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline-block" />
      </footer>
    </div>
  );
};
