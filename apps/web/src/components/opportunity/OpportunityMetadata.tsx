'use client';

import React from 'react';
import { MapPin, Calendar, Briefcase, DollarSign, Globe } from 'lucide-react';
import { formatDateFromAPI } from '@/lib/utils';

export interface OpportunityMetadataProps {
  opportunityType?: string;
  location?: string;
  isRemote?: boolean;
  stipend?: string;
  deadline?: string;
  deadlineIntelligence?: {
    rawText: string | null;
    type: string;
    normalizedDate: string | null;
    daysRemaining: number | null;
    expired: boolean;
    displayLabel: string;
  } | null;
  className?: string;
}

export const OpportunityMetadata: React.FC<OpportunityMetadataProps> = ({
  opportunityType,
  location,
  isRemote,
  stipend,
  deadline,
  deadlineIntelligence,
  className = '',
}) => {
  // Collect non-empty metadata items
  const items: Array<{
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    colorClass?: string;
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

  if (deadlineIntelligence) {
    const { type, daysRemaining, displayLabel } = deadlineIntelligence;
    let labelText = displayLabel;

    // Custom label transformations for today & tomorrow per prompt spec (Closes Today, Tomorrow, X Days Left)
    if (type === 'FIXED_DATE' && daysRemaining !== null) {
      if (daysRemaining === 0) {
        labelText = 'Closes Today';
      } else if (daysRemaining === 1) {
        labelText = 'Tomorrow';
      }
    }

    let colorClass = 'text-muted-foreground'; // Default neutral

    if (type === 'FIXED_DATE' && daysRemaining !== null) {
      if (daysRemaining < 0) {
        colorClass = 'text-muted-foreground';
      } else if (daysRemaining === 0) {
        colorClass = 'text-red-500 font-medium'; // Red -> Closes Today
      } else if (daysRemaining === 1) {
        colorClass = 'text-orange-500 font-medium'; // Orange -> Tomorrow
      } else if (daysRemaining >= 2 && daysRemaining <= 3) {
        colorClass = 'text-orange-500 font-medium'; // Orange -> 1-3 Days
      } else if (daysRemaining >= 4 && daysRemaining <= 7) {
        colorClass = 'text-amber-500 font-medium'; // Amber -> Less than one week
      }
    } else if (type === 'ROLLING' || type === 'ONGOING') {
      colorClass = 'text-green-600 dark:text-green-400 font-medium'; // Green -> Rolling / Always Open
    }

    items.push({
      id: 'deadline',
      icon: Calendar,
      label: labelText,
      colorClass,
    });
  } else if (deadline && deadline.trim() !== '') {
    items.push({
      id: 'deadline',
      icon: Calendar,
      label: `Apply by ${formatDateFromAPI(deadline)}`,
    });
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
            <div className={`flex items-center gap-1.5 shrink-0 ${item.colorClass || ''}`}>
              <Icon className="w-3.5 h-3.5 text-secondary/70" />
              <span>{item.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
