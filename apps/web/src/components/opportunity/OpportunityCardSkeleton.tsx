'use client';

import React from 'react';

interface OpportunityCardSkeletonProps {
  variant?: 'default' | 'featured' | 'compact';
}

export const OpportunityCardSkeleton: React.FC<OpportunityCardSkeletonProps> = ({
  variant = 'default',
}) => {
  if (variant === 'featured') {
    return (
      <div className="p-6 md:p-8 rounded-3xl border border-border/80 bg-card shadow-sm space-y-6 animate-pulse select-none">
        <div className="flex items-center justify-between">
          <div className="h-5 w-28 bg-muted rounded-full" />
          <div className="h-5 w-20 bg-muted rounded-full" />
        </div>
        <div className="space-y-3">
          <div className="h-7 w-3/4 bg-muted rounded-lg" />
          <div className="h-4 w-1/3 bg-muted rounded-md" />
        </div>
        <div className="h-16 w-full bg-muted/60 rounded-xl" />
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-muted rounded-full" />
            <div className="h-6 w-20 bg-muted rounded-full" />
          </div>
          <div className="h-9 w-28 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-4 animate-pulse select-none">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-muted rounded-full" />
        <div className="h-4 w-16 bg-muted rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-5/6 bg-muted rounded-md" />
        <div className="h-3.5 w-1/2 bg-muted rounded-md" />
      </div>
      <div className="h-10 w-full bg-muted/50 rounded-lg" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-5 w-16 bg-muted rounded-full" />
        <div className="h-8 w-24 bg-muted rounded-xl" />
      </div>
    </div>
  );
};
