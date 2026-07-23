import { posthog } from './posthog';

/**
 * ==========================================
 *       SCOUT ANALYTICS EVENT WRAPPER
 * ==========================================
 * Single abstraction layer for emitting standardized product analytics events.
 */

export const track = (eventName: string, properties?: Record<string, any>): void => {
  try {
    if (typeof window !== 'undefined' && posthog && typeof posthog.capture === 'function') {
      posthog.capture(eventName, properties);
    }
  } catch (error) {
    // Fail silently to ensure analytics never interrupt user experience or UI interactions
  }
};

export default track;
