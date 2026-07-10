'use client';

import React from 'react';
import { Eye, Bookmark, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, Typography, Grid, Stack } from '../ui';

interface StatProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

const IntelligenceStat: React.FC<StatProps> = ({ label, value, icon, description }) => (
  <div className="p-5 border border-border/40 rounded-2xl bg-accent/5 flex flex-col justify-between h-[110px]">
    <div className="flex items-center justify-between gap-4 text-secondary/60">
      <Typography variant="label" className="text-[10px]">
        {label}
      </Typography>
      {icon}
    </div>
    <div>
      <Typography variant="heading-l" className="font-semibold leading-none">
        {value}
      </Typography>
      {description && (
        <Typography variant="caption" className="text-secondary/50 text-[10px] mt-1 block">
          {description}
        </Typography>
      )}
    </div>
  </div>
);

export const ScoutIntelligencePanel: React.FC = () => {
  return (
    <Card className="border border-primary/10">
      <div className="p-6 md:p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <Stack gap="xxs">
            <Typography variant="heading-s" className="font-medium">
              Scout Intelligence
            </Typography>
            <Typography variant="caption" className="text-secondary/70 font-light">
              Continuous background exploration metrics
            </Typography>
          </Stack>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold uppercase tracking-wider select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active</span>
          </div>
        </div>

        <Grid cols={1} colsSm={2} colsLg={4} gap="md">
          <IntelligenceStat
            label="Sources Crawled"
            value="413"
            icon={<Eye className="w-4 h-4 text-primary" />}
            description="Last scanned 2 hours ago"
          />
          <IntelligenceStat
            label="Opportunities Found"
            value="2,314"
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
            description="Total database catalog"
          />
          <IntelligenceStat
            label="Personal Matches"
            value="11"
            icon={<CheckCircle className="w-4 h-4 text-primary" />}
            description="Relevance confidence > 75%"
          />
          <IntelligenceStat
            label="Saved Lists"
            value="3"
            icon={<Bookmark className="w-4 h-4 text-primary" />}
            description="Bookmarked opportunities"
          />
        </Grid>
      </div>
    </Card>
  );
};
