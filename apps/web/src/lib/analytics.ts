import { posthog } from './posthog';

/**
 * ==========================================
 *       SCOUT ANALYTICS EVENT WRAPPER
 * ==========================================
 * Single abstraction layer for emitting standardized product analytics events,
 * identifying users, and managing person properties.
 */

// Helper to filter out null/undefined properties before sending to PostHog
const cleanProperties = (props?: Record<string, any>): Record<string, any> | undefined => {
  if (!props) return undefined;
  const cleaned: Record<string, any> = {};
  Object.keys(props).forEach((key) => {
    const val = props[key];
    if (val !== undefined && val !== null && val !== '') {
      cleaned[key] = val;
    }
  });
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
};

export const track = (eventName: string, properties?: Record<string, any>): void => {
  try {
    if (typeof window !== 'undefined' && posthog && typeof posthog.capture === 'function') {
      posthog.capture(eventName, cleanProperties(properties));
    }
  } catch (error) {
    // Fail silently to ensure analytics never interrupt user experience or UI interactions
  }
};

export const identifyUser = (userId: string, properties?: Record<string, any>): void => {
  try {
    if (typeof window !== 'undefined' && posthog && typeof posthog.identify === 'function') {
      const cleaned = cleanProperties(properties);
      if (cleaned) {
        posthog.identify(userId, cleaned);
      } else {
        posthog.identify(userId);
      }
    }
  } catch (error) {
    // Fail silently
  }
};

export const setUserProperties = (properties: Record<string, any>): void => {
  try {
    if (typeof window !== 'undefined' && posthog) {
      const cleaned = cleanProperties(properties);
      if (cleaned && typeof posthog.setPersonProperties === 'function') {
        posthog.setPersonProperties(cleaned);
      } else if (
        cleaned &&
        (posthog as any).people &&
        typeof (posthog as any).people.set === 'function'
      ) {
        (posthog as any).people.set(cleaned);
      }
    }
  } catch (error) {
    // Fail silently
  }
};

export const resetAnalytics = (): void => {
  try {
    if (typeof window !== 'undefined' && posthog && typeof posthog.reset === 'function') {
      posthog.reset();
    }
  } catch (error) {
    // Fail silently
  }
};

export default track;
