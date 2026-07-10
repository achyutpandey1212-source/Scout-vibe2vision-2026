import React from 'react';

interface OpportunityBadgeProps {
  label: string;
  variant?: 'default' | 'women-only' | 'stipend' | 'closing';
}

export const OpportunityBadge: React.FC<OpportunityBadgeProps> = ({
  label,
  variant = 'default',
}) => {
  const styles = {
    default: 'bg-accent/40 text-secondary border-border/80',
    'women-only': 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    stipend: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    closing: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse',
  };

  return (
    <span
      className={`
        inline-flex items-center text-[10px] md:text-xs font-light tracking-wide px-3 py-1 rounded-full border select-none
        ${styles[variant]}
      `}
    >
      {label}
    </span>
  );
};
