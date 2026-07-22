'use client';

/**
 * ==========================================
 *              BRAND LOGO
 * ==========================================
 * Reusable Scout Brand Logo & Wordmark
 */

import React from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
  wordmarkClassName = '',
}) => {
  // Dimensions per size variant
  const getMarkSize = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'lg':
        return 'w-16 h-16';
      case 'md':
      default:
        return 'w-11 h-11';
    }
  };

  const getWordmarkSize = () => {
    switch (size) {
      case 'sm':
        return 'text-lg';
      case 'lg':
        return 'text-3xl';
      case 'md':
      default:
        return 'text-2xl';
    }
  };

  const markSizeClass = getMarkSize();
  const wordmarkSizeClass = getWordmarkSize();

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* ── Brand Logo Mark ── */}
      <div className={`relative shrink-0 ${markSizeClass} flex items-center justify-center`}>
        {/* CSS Mask Container for Pixel-Perfect Color Tinting */}
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
          className={`font-display font-medium tracking-tight text-foreground ${wordmarkSizeClass} ${wordmarkClassName}`}
        >
          Scout
        </span>
      )}
    </div>
  );
};

export default BrandLogo;
