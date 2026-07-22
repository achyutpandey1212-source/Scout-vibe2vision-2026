'use client';

import React from 'react';
import { Card, Typography, Stack } from '../ui';
import { Sparkles } from 'lucide-react';

export interface TodaysMissionCardProps {
  userName?: string;
  missionTitle?: string;
  summary?: string;
  matchCount?: number;
}

export const TodaysMissionCard: React.FC<TodaysMissionCardProps> = ({
  userName = 'User',
  missionTitle = 'Explore internship opportunities to strengthen your career portfolio.',
  summary = 'These recommendations are tailored to your skills and interests, focusing on opportunities that expand your real-world experience.',
  matchCount = 5,
}) => {
  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <Card className="relative overflow-hidden border border-border/80 bg-card p-6 md:p-10 shadow-xs transition-colors duration-200">
      <Stack gap="md" className="max-w-3xl">
        {/* Time-based greeting pill */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-primary/10 text-primary border border-primary/20 select-none">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {getGreeting()}, {userName}
            </span>
          </span>
          {matchCount > 0 && (
            <span className="text-xs text-muted-foreground font-light">
              • {matchCount} personalized recommendations ready
            </span>
          )}
        </div>

        {/* Today's Mission (Hero Focus) */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 block">
            Today&apos;s Mission
          </span>
          <h2 className="text-2xl md:text-4xl font-display font-medium text-foreground leading-tight tracking-tight">
            {missionTitle}
          </h2>
        </div>

        {/* AI Summary / Executive Brief */}
        {summary && (
          <div className="pt-2 border-t border-border/40">
            <Typography
              variant="body"
              className="text-secondary/80 font-light text-sm md:text-base leading-relaxed"
            >
              {summary}
            </Typography>
          </div>
        )}
      </Stack>
    </Card>
  );
};

export default TodaysMissionCard;
