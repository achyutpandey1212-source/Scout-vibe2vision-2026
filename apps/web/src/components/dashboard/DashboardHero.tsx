'use client';

import React from 'react';
import { Typography, Stack } from '../ui';
import { OrigamiDecoration } from '../ui/decorations';

interface DashboardHeroProps {
  userName?: string;
  greeting?: string;
  subtext?: string;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  userName = 'Maya',
  greeting = 'Good morning',
  subtext = "Ready to discover something amazing today? We've updated your matches.",
}) => {
  return (
    <div className="relative w-full overflow-hidden p-6 md:p-10 border border-border/60 bg-card rounded-3xl flex items-center justify-between gap-6">
      {/* Decorative background bird */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none select-none">
        <OrigamiDecoration
          name="freedom_bird"
          size={100}
          floating
          floatingOffset={5}
          floatingDuration={6}
        />
      </div>

      <Stack gap="xs" className="max-w-xl relative z-10">
        <Typography variant="display" className="text-3xl md:text-5xl font-light">
          {greeting}, <span className="font-normal text-primary">{userName}</span>
        </Typography>
        <Typography variant="body-large" className="text-secondary/70">
          {subtext}
        </Typography>
      </Stack>
    </div>
  );
};
