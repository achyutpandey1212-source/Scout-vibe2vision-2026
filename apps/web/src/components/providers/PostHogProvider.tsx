'use client';

/**
 * ==========================================
 *            POSTHOG PROVIDER
 * ==========================================
 * React context provider wrapping Scout with PostHog analytics SDK.
 */

import React, { useEffect } from 'react';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { initPostHog, posthog } from '@/lib/posthog';

export interface PostHogProviderProps {
  children: React.ReactNode;
}

export const PostHogProvider: React.FC<PostHogProviderProps> = ({ children }) => {
  useEffect(() => {
    initPostHog();
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
};

export default PostHogProvider;
