'use client';

import { createContext, useContext } from 'react';

export interface AuthUser {
  userId: string;
}

const AuthContext = createContext<AuthUser | null>(null);

export function AuthProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AuthUser | null;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthUser | null {
  return useContext(AuthContext);
}

/** Throws if called outside an authenticated layout — use in app shell components. */
export function useRequiredAuth(): AuthUser {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useRequiredAuth must be used inside an authenticated layout');
  return auth;
}
