'use client';

import React from 'react';
import { Bookmark, ArrowUpRight } from 'lucide-react';
import { Card, CardTitle, CardContent, Typography, Button, Stack, Grid } from '../ui';
import { MatchScore } from './MatchScore';
import { RecommendationBadge, RecommendationType } from './RecommendationBadge';
import { OpportunityMetadata } from './OpportunityMetadata';
import { getPlatformFromDomain } from '@scout/shared';
import Image from 'next/image';

export interface OpportunityCardProps {
  title: string;
  organization: string;
  deadline?: string;
  description?: string;
  tags?: string[];
  sourceDomain?: string;
  matchScore?: number;
  explanation?: string;
  whyNow?: string;
  slotLabel?: string;
  slotIcon?: string;
  slot?: RecommendationType | string;
  isBookmarked?: boolean;
  isWomenOnly?: boolean;
  isRemote?: boolean;
  opportunityType?: string;
  location?: string;
  stipend?: string;
  variant?: 'default' | 'featured' | 'compact';
  onBookmarkToggle?: () => void;
  onApplyClick?: () => void;
  onCardClick?: () => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  title,
  organization,
  deadline,
  description,
  tags = [],
  matchScore,
  explanation,
  whyNow,
  slotLabel,
  slotIcon,
  slot,
  isBookmarked = false,
  isWomenOnly = false,
  isRemote,
  opportunityType,
  location,
  stipend,
  sourceDomain,
  variant = 'default',
  onBookmarkToggle,
  onApplyClick,
  onCardClick,
}) => {
  const recType = (slot as RecommendationType) || undefined;
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

  const platform = getPlatformFromDomain(sourceDomain);

  const handleClick = (e: React.MouseEvent) => {
    if (onCardClick) onCardClick();
    else if (onApplyClick) onApplyClick();
  };

  /* ─── FEATURED VARIANT (Hero / Top Match) ───────────────────────────────── */
  if (isFeatured) {
    return (
      <Card
        className="relative overflow-hidden border border-primary/30 bg-primary/[0.02] dark:bg-primary/[0.04] transition-all duration-200 hover:border-primary/50 hover:shadow-md group cursor-pointer"
        onClick={handleClick}
      >
        <Grid cols={1} colsMd={12} gap="lg" className="p-6 md:p-10 items-start">
          {/* Left Column - Details */}
          <div className="md:col-span-8 space-y-5">
            <div className="space-y-2.5">
              <Stack direction="row" align="center" gap="xs" wrap>
                <RecommendationBadge
                  type={recType || 'perfectMatch'}
                  label={slotLabel}
                  icon={slotIcon}
                />
                <MatchScore score={matchScore} />
              </Stack>

              <Typography
                variant="heading-l"
                className="font-display font-medium text-2xl md:text-3xl leading-snug group-hover:text-primary transition-colors"
              >
                {title}
              </Typography>

              <Typography variant="body" className="text-muted-foreground font-light">
                {organization}
              </Typography>

              {/* Platform Badge */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                {platform.id === 'external' ? (
                  <span className="text-[14px]">🌐</span>
                ) : (
                  <Image
                    src={platform.logo}
                    alt={platform.name}
                    width={14}
                    height={14}
                    className="rounded-sm"
                  />
                )}
                <span className="font-medium">Found on {platform.name}</span>
              </div>
            </div>

            {description && (
              <Typography variant="body" className="text-foreground/80 font-light leading-relaxed">
                {description}
              </Typography>
            )}

            {/* Why Scout Recommends This Highlight */}
            {explanation && (
              <div className="bg-muted/40 rounded-2xl p-4 border border-border/60 space-y-1.5">
                <span className="text-[10px] text-primary tracking-wider uppercase font-semibold block">
                  Why Scout Recommends This
                </span>
                <Typography
                  variant="body"
                  className="text-xs text-secondary/90 leading-relaxed font-light"
                >
                  {explanation}
                </Typography>
              </div>
            )}

            {/* Metadata Row */}
            <OpportunityMetadata
              opportunityType={opportunityType}
              location={location}
              isRemote={isRemote}
              stipend={stipend}
              deadline={deadline}
            />
          </div>

          {/* Right Column - Actions */}
          <div className="md:col-span-4 flex flex-col justify-between h-full min-h-[180px] md:pl-6 md:border-l border-border/40 gap-6">
            <div className="flex justify-start md:justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onBookmarkToggle) onBookmarkToggle();
                }}
                className={`p-3 rounded-full border transition-all duration-150 outline-none ${
                  isBookmarked
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-card border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Save opportunity"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full justify-center text-sm py-2.5"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onApplyClick) onApplyClick();
                  else if (onCardClick) onCardClick();
                }}
                iconRight={<ArrowUpRight className="w-4 h-4" />}
              >
                View Details
              </Button>
            </div>
          </div>
        </Grid>
      </Card>
    );
  }

  /* ─── COMPACT VARIANT ─────────────────────────────────────────────────── */
  if (isCompact) {
    return (
      <Card
        hoverable
        className="p-4 border border-border/60 bg-card hover:border-primary/40 transition-all duration-150 flex items-center justify-between gap-4 cursor-pointer group"
        onClick={handleClick}
      >
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <RecommendationBadge type={recType} label={slotLabel} icon={slotIcon} />
            <span className="text-xs text-muted-foreground font-light truncate">
              {organization}
            </span>
          </div>
          <CardTitle className="text-sm font-medium leading-snug truncate group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <MatchScore score={matchScore} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onBookmarkToggle) onBookmarkToggle();
            }}
            className={`p-2 rounded-full border transition-all outline-none ${
              isBookmarked
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-card border-border hover:bg-muted/50 text-muted-foreground'
            }`}
            aria-label="Save opportunity"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </Card>
    );
  }

  /* ─── DEFAULT GRID CARD VARIANT ───────────────────────────────────────── */
  return (
    <Card
      hoverable
      className="relative border border-border/60 flex flex-col justify-between h-full bg-card group transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm cursor-pointer"
      onClick={handleClick}
    >
      <div>
        {/* Card Header */}
        <div className="p-6 pb-3 flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            {(slot || slotLabel) && (
              <RecommendationBadge type={recType} label={slotLabel} icon={slotIcon} />
            )}
            <Typography variant="caption" className="text-muted-foreground block truncate">
              {organization}
            </Typography>
            <CardTitle className="pr-4 text-base md:text-lg font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </CardTitle>

            {/* Platform Badge */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              {platform.id === 'external' ? (
                <span className="text-[12px]">🌐</span>
              ) : (
                <Image
                  src={platform.logo}
                  alt={platform.name}
                  width={12}
                  height={12}
                  className="rounded-sm"
                />
              )}
              <span className="font-medium">Found on {platform.name}</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onBookmarkToggle) onBookmarkToggle();
            }}
            className={`p-2 rounded-full border transition-all duration-150 outline-none shrink-0 ${
              isBookmarked
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-card border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Save opportunity"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Card Content / Personalized Reason */}
        <CardContent className="space-y-4 pt-1">
          {explanation && (
            <Typography
              variant="body"
              className="text-xs text-secondary/80 font-light leading-relaxed line-clamp-2"
            >
              {explanation}
            </Typography>
          )}

          {whyNow && (
            <div className="text-[11px] text-muted-foreground font-light italic">
              Why now: {whyNow}
            </div>
          )}

          {/* Metadata chips */}
          <OpportunityMetadata
            opportunityType={opportunityType}
            location={location}
            isRemote={isRemote}
            stipend={stipend}
            deadline={deadline}
          />
        </CardContent>
      </div>

      {/* Card Footer Actions */}
      <div className="p-6 pt-3 flex items-center justify-between gap-4 mt-auto border-t border-border/30">
        <MatchScore score={matchScore} />

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (onApplyClick) onApplyClick();
            else if (onCardClick) onCardClick();
          }}
          className="text-xs h-auto p-0 hover:bg-transparent text-primary hover:text-primary/80 font-medium"
          iconRight={<ArrowUpRight className="w-3.5 h-3.5" />}
        >
          View Details
        </Button>
      </div>
    </Card>
  );
};
