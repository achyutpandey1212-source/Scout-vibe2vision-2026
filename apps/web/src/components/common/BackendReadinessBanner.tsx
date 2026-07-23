'use client';

import React from 'react';
import { useBackendStatus } from '@/context/backend-status-context';
import { CheckCircle2, Loader2 } from 'lucide-react';

export const BackendReadinessBanner: React.FC = () => {
  const { isReady, elapsedSeconds, showReadyToast } = useBackendStatus();

  // If backend is ready and showReadyToast has expired, render nothing
  if (isReady && !showReadyToast) {
    return null;
  }

  // 1. Success Toast (when backend just woke up)
  if (isReady && showReadyToast) {
    return (
      <div className="w-full bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-400 py-3 px-4 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Scout is ready</span>
              <span className="text-secondary/70 ml-2">Authentication is now available.</span>
            </div>
          </div>
          <span className="text-[10px] font-mono opacity-80 shrink-0 hidden sm:inline">
            Connected
          </span>
        </div>
      </div>
    );
  }

  // 2. Readiness Banner (while backend is waking up)
  const isOver60s = elapsedSeconds >= 60;

  return (
    <div className="w-full bg-amber-500/10 dark:bg-amber-950/30 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 py-3 px-4 transition-all duration-300 animate-in fade-in select-none">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0 mt-1" />
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <span>
                {isOver60s
                  ? 'Scout is taking a little longer than expected to start'
                  : 'Scout is getting ready'}
              </span>
            </p>
            <p className="text-secondary/80 text-[11px] leading-relaxed font-light">
              {isOver60s
                ? "We're running on free infrastructure while building Scout. Thank you for your patience."
                : "We're starting our backend services on free infrastructure. Authentication and personalized recommendations will be available in a few moments. While you wait, feel free to explore Scout."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-300/90 font-mono shrink-0 pl-4 sm:pl-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
          <span>Checking connection...</span>
        </div>
      </div>
    </div>
  );
};
