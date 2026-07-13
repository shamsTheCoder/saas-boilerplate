// App-wide constants — keeps magic strings out of the components
export const APP_NAME = 'SaaS Boilerplate';

export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  dashboard: (orgSlug: string) => `/${orgSlug}/dashboard`,
  settings:  (orgSlug: string) => `/${orgSlug}/settings`,
  members:   (orgSlug: string) => `/${orgSlug}/members`,
} as const;

export const API_ROUTES = {
  health: '/health',
  auth: {
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    refresh: '/api/v1/auth/refresh',
    logout: '/api/v1/auth/logout',
  },
} as const;
