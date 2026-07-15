export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD: (orgSlug: string) => `/${orgSlug}/dashboard`,
  SETTINGS: (orgSlug: string) => `/${orgSlug}/settings`,
  ONBOARDING: '/onboarding',
} as const;
