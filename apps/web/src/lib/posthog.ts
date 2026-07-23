import posthog from 'posthog-js';

/**
 * ==========================================
 *        POSTHOG ANALYTICS INITIALIZATION
 * ==========================================
 * Centralized, idempotent initialization for PostHog Product Analytics SDK.
 */

let initialized = false;

export const initPostHog = (): typeof posthog | null => {
  // 1. Guard against SSR environment
  if (typeof window === 'undefined') {
    return null;
  }

  // 2. Prevent duplicate initialization
  if (initialized || (posthog as any).__loaded) {
    return posthog;
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  // 3. Environment variable guard: Fail gracefully if missing
  if (!posthogKey) {
    return null;
  }

  try {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: true,
      capture_pageleave: true,
      person_profiles: 'identified_only',
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') {
          ph.debug(false);
        }
      },
    });
    initialized = true;
    return posthog;
  } catch (error) {
    // Fail gracefully without crashing the application
    return null;
  }
};

export { posthog };
