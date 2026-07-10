/**
 * Design Tokens for Scout
 * Follows the Design Manifesto to ensure premium, calm, and consistent styles.
 */

export const tokens = {
  // Spacing Scale (rem based, 1rem = 16px)
  spacing: {
    xxs: '0.25rem', // 4px
    xs: '0.5rem', // 8px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    xxl: '3rem', // 48px
    xxxl: '4rem', // 64px
  },

  // Border Radius Scale (manifesto prescribes generous 18-24px corners for card elements)
  borderRadius: {
    none: '0px',
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '0.75rem', // 12px
    lg: '1.25rem', // 20px (Per 18-24px visual philosophy)
    xl: '1.5rem', // 24px
    full: '9999px',
  },

  // Shadow System
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
    md: '0 4px 12px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
    lg: '0 10px 24px -4px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
    xl: '0 20px 40px -8px rgba(0, 0, 0, 0.06), 0 8px 20px -4px rgba(0, 0, 0, 0.04)',
    focus: '0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--primary))',
  },

  // Transition & Animation Timing (manifesto specifies 150-300ms range)
  transitions: {
    fast: '0.15s ease-out',
    normal: '0.25s cubic-bezier(0.16, 1, 0.3, 1)', // Apple/Linear-style micro-animation curves
    slow: '0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    curve: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },

  // Maximum width boundaries
  containerWidths: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    wide: '1440px',
  },

  // Z-Index Elevation Scale
  zIndex: {
    hide: -1,
    base: 0,
    header: 50,
    popover: 60,
    drawer: 70,
    modal: 80,
    toast: 90,
  },

  // Standard responsiveness media breakpoints
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};
