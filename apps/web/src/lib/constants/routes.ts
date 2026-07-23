export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD: '/dashboard',
  ONBOARDING: '/onboarding',
  BOOKMARKS: '/bookmarks',
  EXPLORE: '/explore',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  OPPORTUNITY: (id: string) => `/opportunity/${id}`,
  DESIGN_SYSTEM: '/design-system',
};
