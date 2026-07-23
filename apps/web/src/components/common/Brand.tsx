'use client';

/**
 * ==========================================
 *             SHARED BRAND LOCKUP
 * ==========================================
 * Single Source of Truth for Scout's Brand Logo & Wordmark Lockup
 */

import React from 'react';
import Link from 'next/link';

export interface BrandProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
  href?: string;
}

export const Brand: React.FC<BrandProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
  wordmarkClassName = '',
  href,
}) => {
  // Dimensions per size variant
  const getMarkSize = () => {
    switch (size) {
      case 'sm':
        return 'w-7 h-7';
      case 'xl':
        return 'w-14 h-14 sm:w-18 sm:h-18';
      case 'lg':
        return 'w-11 h-11 sm:w-14 sm:h-14';
      case 'md':
      default:
        return 'w-9 h-9 sm:w-10 sm:h-10';
    }
  };

  const getWordmarkSize = () => {
    switch (size) {
      case 'sm':
        return 'text-lg sm:text-xl';
      case 'xl':
        return 'text-3xl sm:text-4xl';
      case 'lg':
        return 'text-2xl sm:text-3xl';
      case 'md':
      default:
        return 'text-xl sm:text-2xl';
    }
  };

  const markSizeClass = getMarkSize();
  const wordmarkSizeClass = getWordmarkSize();

  const content = (
    <div
      className={`inline-flex items-center gap-3 select-none transition-opacity hover:opacity-95 ${className}`}
    >
      {/* ── Brand Logo Mark ── */}
      <div className={`relative shrink-0 ${markSizeClass} flex items-center justify-center`}>
        <div
          className="w-full h-full bg-primary dark:bg-[#A8C3B3] transition-colors duration-200"
          style={{
            WebkitMaskImage: 'url(/Logo/scout_v2_logo.png)',
            maskImage: 'url(/Logo/scout_v2_logo.png)',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />
      </div>

      {/* ── Editorial "Scout" Wordmark ── */}
      {showWordmark && (
        <span
          className={`font-display font-medium tracking-tight text-foreground leading-none ${wordmarkSizeClass} ${wordmarkClassName}`}
        >
          Scout
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1 inline-flex"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Brand;
