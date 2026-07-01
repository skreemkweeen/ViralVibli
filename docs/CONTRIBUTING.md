# Contributing to ViralVibli

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

Optional env (drop in `.env.local`):

```
ANTHROPIC_API_KEY=sk-...           # unlocks real assistant streaming
NEXT_PUBLIC_OBSERVABILITY=console  # verbose console logging
VISION_PROVIDER=local              # override vision provider (default: auto)
STORY_PROVIDER=local
VAULT_PROVIDER=local
```

Absent an `ANTHROPIC_API_KEY`, every AI surface falls back to a rich
local mock so the app is fully usable offline.

## Scripts

| Command             | What it does                                |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Next.js dev server                          |
| `npm run build`     | Production build (Turbopack)                |
| `npm run start`     | Serve the production build                  |
| `npm run lint`      | ESLint against `.`                          |
| `npm run typecheck` | `tsc --noEmit`                              |
| `npm test`          | Vitest run (single pass)                    |
| `npm run test:watch`| Vitest in watch mode                        |

## Quality gates (must pass before commit)

1. `npm run typecheck` — TypeScript strict mode, zero errors.
2. `npm run lint` — ESLint, zero warnings.
3. `npm test` — Vitest suite must be green.
4. `/skill ui-ux-pro-max` review — no meaningful UX regressions.
5. `/skill design-taste-frontend` review — no aesthetic regressions.

The two design skills are treated as mandatory review gates. Any commit
that introduces raw hex CTAs, missing focus rings, hover-only touch
affordances, or em-dashes is rejected.

## Adding a new studio

1. Add the module entry to `src/lib/modules/registry.ts`.
2. Create a route under `src/app/(app)/<module>/page.tsx`.
3. Compose from `StudioShell` + shared studio primitives — never
   re-invent empty / loading / error shells.
4. If the studio talks to AI, add a request/response contract to
   `src/lib/ai/types.ts` and a provider under `src/lib/ai/providers/`.
5. Every button must satisfy the interactive-state contract in
   `docs/DESIGN_SYSTEM.md` §6.

## Adding a new UI primitive

Primitives live in `src/components/ui/`. Each primitive must:

- Take an unopinionated `className` escape hatch.
- Ship a colocated `<name>.test.tsx` covering role, aria state, and
  interaction.
- Be dark/light-safe by consuming semantic tokens only.

## Design tokens

Never hard-code a color or radius. All values live in `globals.css` under
`@theme` and are surfaced through Tailwind semantic classes
(`bg-surface`, `text-ink`, etc.). Adding a token requires a note in
`docs/DESIGN_SYSTEM.md` under §2.

## Motion

Every `motion.*` in the codebase must consume `useReducedMotion()`.
Entry animations use `initial={reduce ? false : {...}}`. Global CSS
neutralizes every animation under `prefers-reduced-motion: reduce` as a
backstop.

## Observability

Import from `@/lib/observability`. Never import a specific provider
directly. Log lines include a short structured attributes object:

```ts
import { logger, reporter, tracker } from "@/lib/observability";

logger.info("assistant.stream.start", { messages: history.length });
tracker.track("assistant.message.sent", { platform: profile.primaryPlatform });
reporter.captureException(err, { where: "vault.transform" });
```

Set `NEXT_PUBLIC_OBSERVABILITY=console` locally to see the log stream.

## Commit style

- Follow the existing conventional-commit shape (`feat(area): summary`).
- Group commits by subsystem, not by file.
- Every commit body ends with a `Co-Authored-By` trailer and a
  `Claude-Session:` link.

## Pull requests

- Push to the designated branch (see the branch spec at the top of any
  session).
- Create a draft PR; a template is available at `.github/pull_request_template.md`.
- Attach a test plan checklist.
- Do not force-push after review has started.
