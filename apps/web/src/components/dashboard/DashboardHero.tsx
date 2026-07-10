'use client';

import React from 'react';
import { Typography, Stack } from '../ui';
import { OrigamiDecoration } from '../ui/decorations';

interface DashboardHeroProps {
  userName?: string;
  matchCount?: number;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  userName = 'User',
  matchCount = 11,
}) => {
  // Get time-bound greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  };

  return (
    <div className="relative w-full py-8 md:py-12 select-none">
      {/* Watermark-like crane in the corner (extremely low opacity) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.05] dark:opacity-[0.03] pointer-events-none select-none">
        <OrigamiDecoration
          name="crane"
          size={140}
          floating
          floatingOffset={4}
          floatingDuration={8}
        />
      </div>

      <Stack gap="sm" className="max-w-2xl relative z-10">
        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-foreground leading-tight">
          {getGreeting()},
          <br />
          <span className="font-serif italic text-primary">{userName}.</span>
        </h1>

        <div className="space-y-1 pt-2">
          <Typography variant="body-large" className="text-foreground/90 font-medium">
            Today Scout found {matchCount} opportunities worth your attention.
          </Typography>
          <Typography variant="body" className="text-secondary/70 font-light">
            Matches are continuously calculated against your career goals.
          </Typography>
        </div>
      </Stack>
    </div>
  );
};
export default DashboardHero;
