"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { AuthState, AuthUser } from "./types";

/**
 * Auth abstraction. The whole app consumes `useAuth()` and never imports an
 * auth vendor directly, so the backend is swappable.
 *
 * CLERK SEAM: when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is configured, wrap the
 * tree in Clerk's <ClerkProvider> and replace the demo state below with a
 * bridge that maps Clerk's `useUser()` / `useClerk()` onto this same AuthState
 * shape. No consumer changes are needed. See docs/auth.md for the exact wiring.
 */

const demoUser: AuthUser = {
  id: "demo-user",
  name: "Aria Botanica",
  email: "aria@botanica.studio",
  initials: "AB",
  plan: "Creator",
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(demoUser);
  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo<AuthState>(
    () => ({ user, isLoaded: true, signOut }),
    [user, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
