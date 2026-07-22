'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`border-b border-border/50 pb-3.5 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 ${className}`}
    >
      <div className="space-y-1">
        <h2 className="text-xl md:text-2xl font-display font-medium text-foreground tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs md:text-sm text-muted-foreground font-light">{description}</p>
        )}
      </div>

      {action && (
        <div className="shrink-0 pt-1 sm:pt-0">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors group"
            >
              <span>{action.label}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors group outline-none"
            >
              <span>{action.label}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
