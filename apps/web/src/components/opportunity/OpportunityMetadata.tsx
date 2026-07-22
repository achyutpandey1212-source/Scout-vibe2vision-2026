'use client';

import React from 'react';
import { MapPin, Calendar, Briefcase, DollarSign, Globe } from 'lucide-react';

export interface OpportunityMetadataProps {
  opportunityType?: string;
  location?: string;
  isRemote?: boolean;
  stipend?: string;
  deadline?: string;
  className?: string;
}

export const OpportunityMetadata: React.FC<OpportunityMetadataProps> = ({
  opportunityType,
  location,
  isRemote,
  stipend,
  deadline,
  className = '',
}) => {
  // Collect non-empty metadata items
  const items: Array<{
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }> = [];

  if (isRemote) {
    items.push({ id: 'remote', icon: Globe, label: 'Remote' });
  }

  if (opportunityType && opportunityType.trim() !== '') {
    items.push({
      id: 'type',
      icon: Briefcase,
      label: opportunityType.charAt(0).toUpperCase() + opportunityType.slice(1).toLowerCase(),
    });
  }

  if (location && location.trim() !== '') {
    items.push({ id: 'location', icon: MapPin, label: location });
  }

  if (stipend && stipend.trim() !== '') {
    items.push({ id: 'stipend', icon: DollarSign, label: stipend });
  }

  if (deadline && deadline.trim() !== '') {
    items.push({ id: 'deadline', icon: Calendar, label: `Apply by ${deadline}` });
  }

  if (items.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-light ${className}`}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <React.Fragment key={item.id}>
            {idx > 0 && (
              <span className="text-border select-none" aria-hidden="true">
                •
              </span>
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              <Icon className="w-3.5 h-3.5 text-secondary/70" />
              <span>{item.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
