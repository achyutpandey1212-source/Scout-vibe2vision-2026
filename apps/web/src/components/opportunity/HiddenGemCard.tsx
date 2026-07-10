'use client';

import React from 'react';
import { Bookmark, Compass, ArrowUpRight } from 'lucide-react';
import { Card, Typography, Stack } from '../ui';
import { MatchScore } from './MatchScore';

export interface HiddenGemCardProps {
  title: string;
  organization: string;
  matchScore: number;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  onApplyClick?: () => void;
}

export const HiddenGemCard: React.FC<HiddenGemCardProps> = ({
  title,
  organization,
  matchScore,
  isBookmarked = false,
  onBookmarkToggle,
  onApplyClick,
}) => {
  return (
    <Card
      hoverable
      className="min-w-[280px] w-[280px] relative overflow-hidden border border-amber-500/10 bg-amber-500/[0.005]"
    >
      {/* Editorial corner stamp indicator */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/[0.02] border-b border-l border-amber-500/10 rounded-bl-3xl flex items-center justify-center">
        <Compass className="w-4 h-4 text-amber-600 dark:text-amber-500 opacity-60" />
      </div>

      <div className="p-6 pb-4 flex flex-col space-y-4 h-[180px] justify-between">
        <div className="space-y-1.5 pr-8">
          <Typography
            variant="caption"
            className="text-amber-700/80 dark:text-amber-400/80 text-[10px] font-semibold tracking-wider uppercase"
          >
            {organization}
          </Typography>
          <Typography variant="heading-s" className="line-clamp-2 leading-snug font-normal">
            {title}
          </Typography>
        </div>

        <Stack direction="row" align="center" justify="between">
          <MatchScore score={matchScore} />

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onBookmarkToggle) onBookmarkToggle();
              }}
              className={`
                p-2 rounded-full border transition-all duration-200 outline-none
                ${
                  isBookmarked
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-card border-border hover:bg-accent/40 text-secondary/60 hover:text-foreground'
                }
              `}
              aria-label="Bookmark hidden gem"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onApplyClick) onApplyClick();
              }}
              className="p-2 rounded-full border border-border hover:bg-primary hover:text-primary-foreground text-secondary/70 transition-all outline-none"
              aria-label="View hidden gem details"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Stack>
      </div>
    </Card>
  );
};
