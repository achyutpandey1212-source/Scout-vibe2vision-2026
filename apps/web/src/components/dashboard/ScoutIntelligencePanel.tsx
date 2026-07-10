'use client';

import React from 'react';
import { Eye, Bookmark, TrendingUp, CheckCircle, Sparkles } from 'lucide-react';
import { Typography, Grid } from '../ui';

interface StatProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

const IntelligenceStat: React.FC<StatProps> = ({ label, value, icon, description }) => (
  <div className="p-5 border border-border/40 rounded-2xl bg-accent/10 flex flex-col justify-between h-[105px]">
    <div className="flex items-center justify-between gap-4 text-secondary/60">
      <Typography variant="label" className="text-[10px] tracking-widest uppercase">
        {label}
      </Typography>
      {icon}
    </div>
    <div>
      <Typography variant="heading-m" className="font-semibold leading-none">
        {value}
      </Typography>
      {description && (
        <Typography variant="caption" className="text-secondary/50 text-[10px] mt-1 block">
          {description}
        </Typography>
      )}
    </div>
  </div>
);

export const ScoutIntelligencePanel: React.FC = () => {
  return (
    <div className="space-y-8 select-none py-4">
      {/* Editorial Title */}
      <div className="border-b border-border/40 pb-3 flex items-center justify-between">
        <Typography variant="heading-m" className="font-normal font-sans">
          Today&apos;s Scout Brief
        </Typography>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-secondary/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sync Completed</span>
        </div>
      </div>

      {/* 2-Column Split: Left is Narrative Bullet points, Right is Metrics Grid */}
      <Grid cols={1} colsMd={12} gap="lg" className="items-stretch">
        {/* Narrative Intel Bullet Points */}
        <div className="md:col-span-6 border border-border/40 rounded-3xl p-6 md:p-8 flex flex-col justify-center bg-card">
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <Typography
                variant="body"
                className="text-sm font-light text-foreground/90 leading-relaxed"
              >
                <span className="font-medium text-foreground">3 exceptional matches</span>{' '}
                identified based on your engineering profile
              </Typography>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <Typography
                variant="body"
                className="text-sm font-light text-foreground/90 leading-relaxed"
              >
                <span className="font-medium text-foreground">2 critical deadlines</span>{' '}
                approaching this week
              </Typography>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-2 shrink-0" />
              <Typography
                variant="body"
                className="text-sm font-light text-foreground/90 leading-relaxed"
              >
                <span className="font-medium text-foreground">1 hidden gem</span> with low
                competition discovered overnight
              </Typography>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary/40 mt-2 shrink-0" />
              <Typography
                variant="body"
                className="text-sm font-light text-foreground/90 leading-relaxed"
              >
                <span className="font-medium text-foreground">7 secondary opportunities</span> worth
                reviewing at your convenience
              </Typography>
            </li>
          </ul>
        </div>

        {/* Supporting stats grid */}
        <div className="md:col-span-6">
          <Grid cols={2} gap="md" className="h-full">
            <IntelligenceStat
              label="Crawled Sources"
              value="413 Streams"
              icon={<Eye className="w-4 h-4 text-primary" />}
              description="Last scanned 2h ago"
            />
            <IntelligenceStat
              label="Discovered Items"
              value="2,314 Opportunities"
              icon={<TrendingUp className="w-4 h-4 text-primary" />}
              description="Global Scout index"
            />
            <IntelligenceStat
              label="Relevance Fit"
              value="11 Matches"
              icon={<CheckCircle className="w-4 h-4 text-primary" />}
              description="Match confidence > 75%"
            />
            <IntelligenceStat
              label="Saved items"
              value="3 bookmarks"
              icon={<Bookmark className="w-4 h-4 text-primary" />}
              description="Active tracking"
            />
          </Grid>
        </div>
      </Grid>
    </div>
  );
};
