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
    <Card
      hoverable
      className="relative border border-border/40 flex flex-col justify-between h-full bg-card group"
      onClick={onCardClick}
    >
      <div>
        {/* Header section */}
        <div className="p-6 pb-3 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Typography variant="caption" className="text-secondary/70">
              {organization}
            </Typography>
            <CardTitle className="pr-8 text-base md:text-lg font-medium leading-snug group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onBookmarkToggle) onBookmarkToggle();
            }}
            className={`
              p-2 rounded-full border transition-all duration-200 outline-none shrink-0
              ${
                isBookmarked
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'bg-card border-border hover:bg-accent/40 text-secondary/60 hover:text-foreground'
              }
            `}
            aria-label="Bookmark opportunity"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content section */}
        <CardContent className="space-y-4">
          {/* Why this matters */}
          <Typography
            variant="body"
            className="text-xs text-secondary/80 font-light leading-relaxed"
          >
            Matches your preferred domain and matches your remote location schedule.
          </Typography>

          <Stack direction="row" align="center" gap="xs" wrap>
            <MatchScore score={matchScore} />
            {isWomenOnly && <OpportunityBadge label="Women Preferred" variant="women-only" />}
            {stipend && <OpportunityBadge label={stipend} variant="stipend" />}
            {tags.slice(0, 2).map((tag) => (
              <OpportunityBadge key={tag} label={tag} variant="default" />
            ))}
          </Stack>
        </CardContent>
      </div>

      {/* Footer info (whitespace driven, no border line) */}
      <div className="p-6 pt-2 flex items-center justify-between gap-4 mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-secondary/65 font-light">
          <Calendar className="w-3.5 h-3.5" />
          <span>Apply by {deadline}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (onApplyClick) onApplyClick();
          }}
          className="text-xs h-auto p-0 hover:bg-transparent text-primary hover:text-primary/80"
          iconRight={<ArrowUpRight className="w-3.5 h-3.5" />}
        >
          View details
        </Button>
      </div>
    </Card>
  );
};
