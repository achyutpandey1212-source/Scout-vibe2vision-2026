'use client';

import React from 'react';

export type RecommendationType =
  | 'perfectMatch'
  | 'topMatch'
  | 'hiddenGem'
  | 'stretchGoal'
  | 'quickWin'
  | 'fastApply'
  | 'confidenceBuilder'
  | 'curated';

interface RecommendationBadgeProps {
  type?: RecommendationType;
  label?: string;
  icon?: string;
  className?: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  perfectMatch: { label: 'Top Match', icon: '⭐' },
  topMatch: { label: 'Top Match', icon: '⭐' },
  hiddenGem: { label: 'Hidden Gem', icon: '💎' },
  stretchGoal: { label: 'Stretch Goal', icon: '🚀' },
  quickWin: { label: 'Quick Win', icon: '⚡' },
  fastApply: { label: 'Quick Win', icon: '⚡' },
  confidenceBuilder: { label: 'Confidence Builder', icon: '🌱' },
  curated: { label: 'Curated Match', icon: '✨' },
};

export const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({
  type,
  label,
  icon,
  className = '',
}) => {
  const config = (type && CATEGORY_CONFIG[type]) || {
    label: label || 'Match',
    icon: icon || '✨',
  };

  const displayLabel = label || config.label;
  const displayIcon = icon || config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-primary/10 text-primary border border-primary/20 select-none ${className}`}
    >
      <span aria-hidden="true" className="text-xs">
        {displayIcon}
      </span>
      <span>{displayLabel}</span>
    </span>
  );
};
