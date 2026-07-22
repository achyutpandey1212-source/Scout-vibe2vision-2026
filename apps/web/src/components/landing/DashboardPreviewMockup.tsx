'use client';

import React from 'react';
import { OpportunityCard } from '@/components/opportunity/OpportunityCard';
import { TodaysMissionCard } from '@/components/dashboard/TodaysMissionCard';
import { Lock, Sparkles } from 'lucide-react';

export const DashboardPreviewMockup: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden select-none">
      {/* Browser Top Window Bar */}
      <div className="w-full px-4 py-3 bg-muted/40 border-b border-border/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-400/80" />
          <div className="w-3 h-3 rounded-full bg-amber-400/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
        </div>

        {/* Address Bar */}
        <div className="flex-1 max-w-sm mx-auto bg-background/80 border border-border/60 rounded-full px-3 py-1 text-xs text-muted-foreground font-mono flex items-center justify-center gap-1.5 shadow-inner">
          <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>scout.app/dashboard</span>
        </div>

        <div className="w-12" />
      </div>

      {/* Mockup Dashboard Body */}
      <div className="p-4 sm:p-6 md:p-8 bg-background/50 space-y-6 text-left">
        {/* Anonymized Mission Greeting */}
        <TodaysMissionCard
          userName="Member"
          matchCount={3}
          summary="Scout discovered 3 high-confidence opportunities matching your backend engineering goals today. Application deadlines are approaching for top engineering fellowships."
        />

        {/* Featured Top Match Card Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Top Recommendation
            </span>
            <span className="text-xs text-muted-foreground font-mono">Scout Index #402</span>
          </div>

          <OpportunityCard
            variant="featured"
            title="Google Software Engineering Fellowship 2026"
            organization="Google"
            deadline="12 Days Left"
            stipend="₹85,000 / mo"
            location="Bangalore, India"
            matchScore={96}
            explanation="Directly matches your interest in distributed systems and backend engineering. Strong alignment with your current academic year."
            whyNow="Applications opened yesterday with limited cohort seats. Early applicants receive priority review."
            tags={['Python', 'Distributed Systems', 'C++', 'Algorithms']}
            isBookmarked={true}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPreviewMockup;
