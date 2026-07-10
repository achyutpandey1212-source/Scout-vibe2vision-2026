export const AUTH_CONFIG = {
  apiPrefix: '/api/v1/auth',
  tokenHeader: 'authorization',
  publicRoutes: [
    '/api/v1/auth/health',
    '/api/v1/auth/login', // old fallback if needed
    '/api/v1/auth/sync',
  ],
  protectedRoutes: ['/api/v1/auth/me'],
};
