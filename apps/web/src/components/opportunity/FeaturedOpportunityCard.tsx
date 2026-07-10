'use client';

import React from 'react';
import { Bookmark, Calendar, ArrowUpRight, Sparkles } from 'lucide-react';
import { Card, Typography, Button, Stack, Grid } from '../ui';
import { MatchScore } from './MatchScore';
import { OpportunityBadge } from './OpportunityBadge';

export interface FeaturedOpportunityCardProps {
  title: string;
  organization: string;
  description: string;
  deadline: string;
  matchScore: number;
  tags?: string[];
  isBookmarked?: boolean;
  isWomenOnly?: boolean;
  stipend?: string;
  onBookmarkToggle?: () => void;
  onApplyClick?: () => void;
}

export const FeaturedOpportunityCard: React.FC<FeaturedOpportunityCardProps> = ({
  title,
  organization,
  description,
  deadline,
  matchScore,
  tags = [],
  isBookmarked = false,
  isWomenOnly = true,
  stipend,
  onBookmarkToggle,
  onApplyClick,
}) => {
  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-primary/[0.01]">
      {/* Decorative subtle gradient accent background */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <Grid cols={1} colsMd={12} gap="lg" className="p-6 md:p-10">
        {/* Left Side: Detail column */}
        <div className="md:col-span-8 space-y-4">
          <div className="space-y-2">
            <Stack direction="row" align="center" gap="xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-semibold uppercase tracking-wider text-primary select-none">
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span>Top Recommendation</span>
              </span>
              <MatchScore score={matchScore} />
            </Stack>

            <Typography variant="heading-l" className="font-normal leading-tight">
              {title}
            </Typography>

            <Typography variant="body" className="text-secondary/70">
              {organization}
            </Typography>
          </div>

          <Typography
            variant="body"
            className="text-foreground/80 line-clamp-3 font-light leading-relaxed"
          >
            {description}
          </Typography>

          <Stack direction="row" align="center" gap="xs" wrap>
            {isWomenOnly && <OpportunityBadge label="Women Preferred" variant="women-only" />}
            {stipend && <OpportunityBadge label={stipend} variant="stipend" />}
            {tags.map((tag) => (
              <OpportunityBadge key={tag} label={tag} variant="default" />
            ))}
          </Stack>

          <div className="flex items-center gap-2 text-xs text-secondary/65 font-light pt-2">
            <Calendar className="w-4 h-4" />
            <span>Apply before {deadline}</span>
          </div>
        </div>

        {/* Right Side: Quick Action CTA Column */}
        <div className="md:col-span-4 flex flex-col justify-between items-stretch md:items-end gap-6 border-t md:border-t-0 md:border-l border-border/60 pt-6 md:pt-0 md:pl-8">
          {/* Bookmark placement top right */}
          <div className="hidden md:block">
            <button
              onClick={onBookmarkToggle}
              className={`
                p-3 rounded-full border transition-all duration-200 outline-none
                ${
                  isBookmarked
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-card border-border hover:bg-accent/40 text-secondary/60 hover:text-foreground'
                }
              `}
              aria-label="Bookmark opportunity"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Primary Action buttons */}
          <div className="w-full space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={onApplyClick}
              iconRight={<ArrowUpRight className="w-4 h-4" />}
            >
              Apply Now
            </Button>
            <Button
              variant="secondary"
              className="w-full md:hidden"
              onClick={onBookmarkToggle}
              iconLeft={
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
              }
            >
              {isBookmarked ? 'Bookmarked' : 'Save opportunity'}
            </Button>
          </div>
        </div>
      </Grid>
    </Card>
  );
};
