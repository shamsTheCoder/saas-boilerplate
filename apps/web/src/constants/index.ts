// App-wide constants — keeps magic strings out of the components
export const APP_NAME = "SaaS Boilerplate";

// ROUTES — canonical source is @/constants/routes.ts
// Re-export for convenience so components don't need two imports
export { ROUTES } from "@/constants/routes";

export const API_ROUTES = {
  health: "/health",
  auth: {
    login: "/api/v1/auth/login",
    register: "/api/v1/auth/register",
    refresh: "/api/v1/auth/refresh",
    logout: "/api/v1/auth/logout",
  },
} as const;
