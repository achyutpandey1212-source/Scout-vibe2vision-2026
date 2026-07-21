'use client';

import React from 'react';
import { Bookmark, Compass, ArrowUpRight } from 'lucide-react';
import { Card, Typography, Stack } from '../ui';
import { MatchScore } from './MatchScore';

export interface HiddenGemCardProps {
  title: string;
  organization: string;
  matchScore: number;
  explanation?: string;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  onApplyClick?: () => void;
}

export const HiddenGemCard: React.FC<HiddenGemCardProps> = ({
  title,
  organization,
  matchScore,
  explanation,
  isBookmarked = false,
  onBookmarkToggle,
  onApplyClick,
}) => {
  return (
    <Card
      hoverable
      onClick={() => {
        if (onApplyClick) onApplyClick();
      }}
      className="min-w-[300px] w-[300px] relative overflow-hidden border border-amber-500/20 bg-amber-500/[0.01] cursor-pointer flex flex-col justify-between"
    >
      {/* Editorial corner stamp indicator */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/[0.04] border-b border-l border-amber-500/20 rounded-bl-3xl flex items-center justify-center">
        <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400 opacity-80" />
      </div>

      <div className="p-6 pb-4 flex flex-col space-y-3 justify-between h-full">
        <div className="space-y-1.5 pr-8">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <span>💎 Hidden Gem</span>
          </span>

          <Typography
            variant="caption"
            className="text-amber-800/80 dark:text-amber-300/80 text-[10px] font-semibold tracking-wider uppercase block pt-1"
          >
            {organization}
          </Typography>
          <Typography variant="heading-s" className="text-sm md:text-base font-normal leading-snug">
            {title}
          </Typography>
        </div>

        {explanation && (
          <Typography
            variant="body"
            className="text-xs text-secondary/80 font-light leading-relaxed whitespace-normal break-words pt-1"
          >
            {explanation}
          </Typography>
        )}

        <Stack direction="row" align="center" justify="between" className="pt-2">
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
