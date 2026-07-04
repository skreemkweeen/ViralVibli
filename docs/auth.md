# Authentication

The app consumes a single `useAuth()` hook (`src/lib/auth/auth-provider.tsx`)
and never imports an auth vendor directly. This keeps the backend swappable.

Today, with no keys configured, a **demo provider** supplies a fixed signed-in
user so the whole workspace is explorable. The `/sign-in` route routes straight
into `/dashboard`.

## Wiring Clerk

1. Install: `npm install @clerk/nextjs`
2. Set env vars:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   ```
3. In `src/app/layout.tsx`, wrap the tree in `<ClerkProvider>`.
4. Replace the demo state in `src/lib/auth/auth-provider.tsx` with a bridge that
   maps Clerk onto the existing `AuthState` shape:
   ```tsx
   import { useUser, useClerk } from "@clerk/nextjs";

   export function AuthProvider({ children }) {
     const { user, isLoaded } = useUser();
     const { signOut } = useClerk();
     const value = useMemo(() => ({
       user: user && {
         id: user.id,
         name: user.fullName ?? user.username ?? "Creator",
         email: user.primaryEmailAddress?.emailAddress ?? "",
         initials: (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? ""),
         plan: (user.publicMetadata.plan as Plan) ?? "Starter",
       },
       isLoaded,
       signOut: () => signOut(),
     }), [user, isLoaded, signOut]);
     return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
   }
   ```
5. Add `src/middleware.ts` with `clerkMiddleware()` and protect the `(app)`
   routes via a matcher.
6. Point `/sign-in` at Clerk's `<SignIn />` (or set it as `signInUrl`).

No consumer component changes are required: the sidebar, topbar, user menu,
dashboard, and assistant all read from `useAuth()`.
