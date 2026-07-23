'use client';

/**
 * ==========================================
 *        SCROLL DEPTH ANALYTICS HOOK
 * ==========================================
 * Tracks scroll depth thresholds (25%, 50%, 75%, 100%) once per page load.
 */

import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics';

export function useScrollDepth(pageName: string) {
  const firedThresholds = useRef<Set<number>>(new Set());

  useEffect(() => {
    firedThresholds.current.clear();

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (scrollHeight <= 0) return;

      const percent = Math.round((scrollTop / scrollHeight) * 100);

      const thresholds = [25, 50, 75, 100];
      thresholds.forEach((threshold) => {
        if (percent >= threshold && !firedThresholds.current.has(threshold)) {
          firedThresholds.current.add(threshold);
          track('scroll_depth_reached', {
            page: pageName,
            percent: threshold,
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pageName]);
}

export default useScrollDepth;
