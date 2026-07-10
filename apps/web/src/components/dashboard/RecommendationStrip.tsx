'use client';

import React from 'react';
import { Typography, Stack } from '../ui';

interface RecommendationStripProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const RecommendationStrip: React.FC<RecommendationStripProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <Stack gap="sm" className="w-full">
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-1 border-b border-border/40 pb-3">
        <Typography variant="heading-m" className="font-normal tracking-tight">
          {title}
        </Typography>
        {description && (
          <Typography variant="caption" className="text-secondary/60 font-light">
            {description}
          </Typography>
        )}
      </div>

      {/* Horizontal Scroll Layout Container */}
      <div className="w-full overflow-x-auto no-scrollbar scroll-smooth flex gap-6 py-2">
        {children}
      </div>
    </Stack>
  );
};
