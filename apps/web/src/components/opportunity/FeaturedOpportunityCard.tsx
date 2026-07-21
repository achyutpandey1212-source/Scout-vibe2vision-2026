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
  explanation?: string;
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
    <Card className="relative overflow-hidden border border-primary/20 bg-primary/[0.01]">
      <Grid cols={1} colsMd={12} gap="lg" className="p-8 md:p-12 items-start">
        {/* Left Column - Details */}
        <div className="md:col-span-8 space-y-6">
          <div className="space-y-3">
            <Stack direction="row" align="center" gap="xs">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary select-none">
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span>Featured Recommendation</span>
              </span>
              <MatchScore score={matchScore} />
            </Stack>

            <Typography
              variant="heading-l"
              className="font-normal text-3xl md:text-4xl leading-tight"
            >
              {title}
            </Typography>

            <Typography variant="body" className="text-secondary/70 font-light">
              {organization}
            </Typography>
          </div>

          {/* Description */}
          <Typography variant="body" className="text-foreground/80 font-light leading-relaxed">
            {description}
          </Typography>

          {/* Human Recommendation explanation */}
          <div className="bg-accent/30 rounded-2xl p-4.5 border border-border/40 space-y-2">
            <Typography
              variant="label"
              className="text-[10px] text-primary tracking-wider uppercase font-semibold"
            >
              Why Scout Recommends This
            </Typography>
            <Typography
              variant="body"
              className="text-xs text-secondary/90 leading-relaxed font-light"
            >
              Your leadership projects and engineering interests make this one of your strongest
              matches. The program aligns with your career stage and preferred remote timeline.
            </Typography>
          </div>

          <Stack direction="row" align="center" gap="xs" wrap className="pt-2">
            {isWomenOnly && <OpportunityBadge label="Women Preferred" variant="women-only" />}
            {stipend && <OpportunityBadge label={stipend} variant="stipend" />}
            {tags.map((tag) => (
              <OpportunityBadge key={tag} label={tag} variant="default" />
            ))}
          </Stack>
        </div>

        {/* Right Column - CTAs & Highlights */}
        <div className="md:col-span-4 flex flex-col justify-between h-full min-h-[220px] md:pl-8 md:border-l border-border/40 gap-8">
          <div className="space-y-4 text-left md:text-right">
            <div className="flex md:justify-end">
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

            <div className="space-y-1.5 pt-2">
              <Typography
                variant="label"
                className="text-[10px] text-secondary/50 block select-none"
              >
                Application Deadline
              </Typography>
              <div className="flex items-center gap-1.5 md:justify-end text-xs text-secondary/90 font-light">
                <Calendar className="w-3.5 h-3.5" />
                <span>{deadline}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full justify-center"
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
