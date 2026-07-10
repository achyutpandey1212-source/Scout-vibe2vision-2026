'use client';

import React from 'react';
import { Bookmark, Calendar, ArrowUpRight } from 'lucide-react';
import { Card, CardTitle, CardContent, Typography, Button, Stack } from '../ui';
import { MatchScore } from './MatchScore';
import { OpportunityBadge } from './OpportunityBadge';

export interface OpportunityCardProps {
  title: string;
  organization: string;
  deadline: string;
  tags?: string[];
  matchScore?: number;
  isBookmarked?: boolean;
  isWomenOnly?: boolean;
  stipend?: string;
  onBookmarkToggle?: () => void;
  onApplyClick?: () => void;
  onCardClick?: () => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  title,
  organization,
  deadline,
  tags = [],
  matchScore = 75,
  isBookmarked = false,
  isWomenOnly = false,
  stipend,
  onBookmarkToggle,
  onApplyClick,
  onCardClick,
}) => {
  return (
    <Card hoverable className="relative" onClick={onCardClick}>
      {/* Upper header segment: Title and Bookmark button */}
      <div className="p-6 md:p-8 pb-3 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Typography variant="caption" className="text-secondary/70">
            {organization}
          </Typography>
          <CardTitle className="pr-8">{title}</CardTitle>
        </div>

        {/* Bookmark Toggle Icon */}
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
          aria-label="Bookmark opportunity"
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Middle segment: Tags and Badges */}
      <CardContent className="pb-4">
        <Stack direction="row" align="center" gap="xs" wrap className="mb-4">
          <MatchScore score={matchScore} />
          {isWomenOnly && <OpportunityBadge label="Women Preferred" variant="women-only" />}
          {stipend && <OpportunityBadge label={stipend} variant="stipend" />}
          {tags.slice(0, 2).map((tag) => (
            <OpportunityBadge key={tag} label={tag} variant="default" />
          ))}
        </Stack>

        {/* Closing / Deadline info */}
        <div className="flex items-center gap-2 text-xs text-secondary/65 font-light">
          <Calendar className="w-3.5 h-3.5" />
          <span>Apply by {deadline}</span>
        </div>
      </CardContent>

      {/* Bottom Footer segment: Apply action CTA */}
      <div className="px-6 py-4 md:px-8 md:py-5 border-t border-border/40 flex items-center justify-between gap-4 bg-accent/5">
        <Typography variant="caption" className="text-secondary/50 font-light truncate">
          Discovered in Discovery Run
        </Typography>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (onApplyClick) onApplyClick();
          }}
          iconRight={<ArrowUpRight className="w-3.5 h-3.5" />}
        >
          View Details
        </Button>
      </div>
    </Card>
  );
};
