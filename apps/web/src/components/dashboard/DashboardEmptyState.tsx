'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles } from 'lucide-react';
import { Card, Typography, Button, Stack } from '../ui';
import { ROUTES } from '@/lib/constants/routes';

export interface DashboardEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  title = "Scout is preparing today's recommendations.",
  description = "We're putting together opportunities that best match your profile. This shouldn't take long.",
  actionLabel = 'Discover Opportunities',
  actionHref = ROUTES.EXPLORE,
  onActionClick,
}) => {
  return (
    <Card className="text-center p-8 md:p-12 max-w-lg mx-auto bg-card border border-border/60 rounded-3xl my-8">
      <Stack gap="md" align="center" className="space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Compass className="w-6 h-6 animate-pulse" />
        </div>

        <div className="space-y-1.5">
          <Typography
            variant="heading-m"
            className="font-display font-medium text-xl text-foreground"
          >
            {title}
          </Typography>
          <Typography
            variant="body"
            className="text-muted-foreground text-xs md:text-sm leading-relaxed max-w-sm mx-auto font-light"
          >
            {description}
          </Typography>
        </div>

        <div className="pt-4">
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="primary" size="sm" iconRight={<Sparkles className="w-3.5 h-3.5" />}>
                {actionLabel} →
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onActionClick}
              iconRight={<Sparkles className="w-3.5 h-3.5" />}
            >
              {actionLabel} →
            </Button>
          )}
        </div>
      </Stack>
    </Card>
  );
};

export default DashboardEmptyState;
