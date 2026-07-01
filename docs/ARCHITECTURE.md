# ViralVibli — System Architecture

## 1. Product

ViralVibli is a creative workspace for social media creators. The
platform combines four fully realized AI-powered studios (Vision, Story,
Vault, Assistant) with a shared workspace intelligence layer (Projects,
CreatorProfile, Activity, Command Palette) so every studio pulls from
the same brand identity, shares the same UI language, and connects the
creator's work into one continuous flow.

## 2. Stack

| Layer                | Choice                                              |
| -------------------- | --------------------------------------------------- |
| Framework            | Next.js 16 (App Router, React Server Components)    |
| Language             | TypeScript, strict mode                             |
| Styling              | Tailwind v4, dark-locked token-driven design system |
| Motion               | `motion/react` (formerly framer-motion), GSAP islands |
| Scroll               | Lenis for the marketing surface only                |
| Typography           | Geist (sans + mono) via `next/font`                 |
| Icons                | Phosphor Icons + simple-icons for brand marks       |
| AI                   | Anthropic Messages API (streaming) with local fallback |
| Persistence          | localStorage (MVP); server-side to follow           |
| Testing              | Vitest + Testing Library + jsdom                    |
| Observability        | Swappable provider (`src/lib/observability/`)       |

## 3. Directory map

```
src/
├── app/                       # Routes (App Router)
│   ├── (app)/                 # Authenticated workspace shell
│   │   ├── assistant/         # AI Assistant surface
│   │   ├── dashboard/         # Home landing
│   │   ├── m/[id]/            # Module deep-links (registry-driven)
│   │   ├── projects/          # Workspace intelligence
│   │   ├── settings/          # Profile + Brand + Notifications + Billing
│   │   ├── story/             # Story Studio
│   │   ├── vault/             # Prompt Vault
│   │   ├── vision/            # Vision Studio
│   │   └── layout.tsx         # Wraps AuthProvider → ThemeProvider → WorkspaceProvider → AppShell
│   ├── api/                   # Route handlers (Node runtime)
│   │   ├── assistant/chat/    # Streaming SSE proxy to Anthropic Messages
│   │   ├── vision/generate/   # Image job intake
│   │   ├── story/generate/    # Story job intake
│   │   └── vault/transform/   # Prompt transform job intake
│   ├── sign-in/               # Unauthenticated entry
│   ├── error.tsx              # Route-level error boundary
│   ├── global-error.tsx       # Last-resort boundary (crashes above RootLayout)
│   ├── layout.tsx             # RootLayout — global fonts + globals.css + skip-link target
│   └── page.tsx               # Marketing landing
├── components/
│   ├── ai/                    # Assistant surface
│   ├── app/                   # Workspace chrome (Sidebar, Topbar, CommandPalette, …)
│   ├── site/                  # Marketing landing sections
│   ├── story/                 # Story Studio
│   ├── studio/                # Reusable studio primitives (shell, states, generate button)
│   ├── ui/                    # Canonical design-system primitives (Button, Card, Chip, Field, Badge)
│   ├── vault/                 # Prompt Vault
│   ├── vision/                # Vision Studio
│   └── workspace/             # Projects view
├── lib/
│   ├── ai/                    # Provider abstraction, job store, types
│   ├── auth/                  # Auth abstraction (mock; server-ready seams)
│   ├── context/               # Client-side context readers (vault → assistant)
│   ├── modules/               # Module registry (single source of truth for studios)
│   ├── observability/         # Provider-agnostic logging/errors/analytics
│   ├── story/                 # Story domain: types, data, store, frameworks
│   ├── vault/                 # Vault domain: types, data, store
│   ├── vision/                # Vision domain: types, data, store
│   └── workspace/             # Workspace domain: types, store, Projects + Activity + Profile
└── test/setup.ts              # Vitest bootstrap (jsdom, matchMedia, scrollTo shims)
```

## 4. Runtime topology

```
Browser
  └── Next.js RSC
        ├── RootLayout (globals.css, Geist fonts, skip-link target)
        ├── /(app)/layout.tsx  ── Client boundary ──┐
        │                                            │
        │     AuthProvider → ThemeProvider → WorkspaceProvider → AppShell
        │                                            │
        │     AppShell renders Sidebar + Topbar + <main id="main-content"> + CommandPalette
        │
        └── /api/*             ── Node runtime, streaming SSE where applicable
              └── /api/assistant/chat → Anthropic Messages (stream: true) + AbortSignal
```

RSC boundaries are drawn as narrowly as possible. Server components render
layout chrome and metadata. Interactive islands (Sidebar, Topbar, studios,
palette, motion sections) declare `"use client"` at their leaves.

## 5. Core seams

### Auth (`src/lib/auth/`)

`useAuth()` exposes `{ user, signIn, signOut }`. The current implementation
is a client-only mock backed by localStorage. Replacing it with a real
provider (Clerk, WorkOS, Auth.js) is a single-file swap because every
consumer already talks to the same hook.

### Workspace (`src/lib/workspace/`)

`useWorkspace()` exposes the full CRUD surface for Projects, CreatorProfile,
and Activity. State is client-only for now; the same shape will map to a
server API once we introduce persistence.

### AI providers (`src/lib/ai/`)

Every studio talks to the AI layer through typed request/response contracts
(`ImageRequest`, `StoryRequest`, `VaultTransformRequest`). Providers are
resolved from `buildImageProviders()`, `buildStoryProviders()`,
`buildVaultProviders()`. Each supports Anthropic + fal + Replicate +
Ideogram + a zero-key local fallback so the app runs end-to-end offline.

### Observability (`src/lib/observability/`)

`logger`, `reporter`, `tracker` are the only names imported anywhere.
`resolveProvider()` picks noop, console, or a future Sentry/PostHog provider
from `NEXT_PUBLIC_OBSERVABILITY`. Consumers never learn the provider.

### Modules (`src/lib/modules/`)

`appModules` is the single source of truth for every studio. Sidebar,
dashboard, command palette, marketing bento — they all pull from this
array. Adding a new studio requires appending one entry, then supplying
its route + components.

## 6. Data flow

```
User input
   └─ localStorage (persisted via useEffect on the domain store)
       └─ Read by useWorkspaceContext / useVault / useStory / useVision
           └─ Injected into the AI system prompt
               └─ Streaming SSE from /api/assistant/chat
                   └─ Yielded chunk-by-chunk to the assistant UI
```

## 7. Streaming lifecycle (Assistant)

```
Client                                  Server                       Anthropic
  │                                        │                             │
  ├─ fetch POST /api/assistant/chat ──────▶│                             │
  │  { messages, context, signal }         ├─ validate + cap             │
  │                                        ├─ fetch Anthropic w/ signal ─▶
  │                                        │                             │
  │◀── SSE data: { text } (per delta) ─────┤◀── content_block_delta ─────│
  │                                        │                             │
  ├─ user hits Stop ──▶ AbortController ──▶│                             │
  │                                        ├─ req.signal.aborted → break │
  │                                        └─ reader cancelled ──────────▶
```

Both the local mock stream and the real Anthropic fetch propagate
`req.signal`, so cancellation reaches all the way to the upstream request.

## 8. Reliability

- **Prompt/message length caps** on every AI route (413 on excess).
- **Per-route error responses** are consistent `{ error: string }` JSON.
- **AbortSignal** flows end-to-end for streaming cancellation.
- **`X-Accel-Buffering: no`** on SSE to survive proxies without buffering.
- **Error boundaries**: route-level `error.tsx` and last-resort
  `global-error.tsx` render branded recovery instead of white screens.

## 9. Motion policy

- Every `motion.*` in the codebase respects `useReducedMotion()`.
- `globals.css` sets `animation-duration: 0.001ms !important` under
  `prefers-reduced-motion: reduce` as a global backstop for any CSS
  animation we forgot to guard.
- Every animation has a communicative purpose (hierarchy, feedback, state
  transition). Decorative-only motion is treated as a bug.
