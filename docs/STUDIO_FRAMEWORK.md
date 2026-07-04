# Studio Framework

The studio framework is the reusable substrate every ViralVibli creator
module composes from. It exists so studios (Vision, Story, Vault, and every
future addition) share the same shell, the same state contract, the same
loading behavior, and the same visual language — without any studio
learning what the others are doing.

## 1. Anatomy of a studio

```
<StudioShell>
  <controls>            ← left panel (fixed width)
    <ControlSection title="…">
      <ChipGroup options={…} value={…} onChange={…} />
    </ControlSection>
    <StudioGenerateButton generating={…} onGenerate={…} onCancel={…} />
  </controls>
  <canvas>              ← right pane (scrollable)
    <StudioEmptyState /> | <StudioLoadingState /> | <StudioResultGrid /> | <StudioErrorState />
  </canvas>
</StudioShell>
```

## 2. Primitives (`src/components/studio/`)

| Component               | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `StudioShell`           | Two-pane layout (controls left, canvas right)    |
| `ControlSection`        | Collapsible group with title + optional summary  |
| `ChipGroup`             | Multi-option selector (single-select or clearable) |
| `StudioGenerateButton`  | Primary action + cancel affordance during work   |
| `StudioEmptyState`      | Icon + title + body + optional action            |
| `StudioLoadingState`    | Skeleton grid matching the canvas aspect         |
| `StudioErrorState`      | Inline error card with `role="alert"`            |
| `StudioResultGrid`      | Result render pattern (favorite / save / expand) |

## 3. Domain layer contract

Every studio implements the same shape:

```
src/lib/<domain>/
├── types.ts     # Request/response contracts + persisted state types
├── data.ts      # Static seed data (categories, presets, defaults)
├── store.tsx    # React context provider + `use<Domain>()` hook
├── frameworks.ts (or similar) # Optional domain-specific data
```

Store providers persist to localStorage on write; they hydrate on mount
behind a `hydrated` flag so SSR and CSR agree.

## 4. AI plumbing contract

Studios never talk to a provider directly. They post to a route handler
under `/api/<domain>/<verb>`:

```
POST /api/vision/generate   → { prompt, aspect, count, seed, quality } → job
POST /api/story/generate    → { brief, framework, platform, count, … } → job
POST /api/vault/transform   → { content, operation, platform, count } → job
POST /api/assistant/chat    → { messages, context } → SSE text stream
```

Non-streaming routes return a `Job` object immediately (`202 Accepted`)
and the studio polls `/api/jobs/:id` for progress. The streaming route
returns SSE frames `data: { text }\n\n` per delta and `data: [DONE]\n\n`
at the end.

Every route:
- Validates input and returns a consistent `{ error: string }` shape on
  failure.
- Caps prompt / content / brief length and returns `413` on excess.
- Falls back to a local deterministic mock if the required upstream API
  key is not present. The app remains fully usable offline.

## 5. Cancellation

Every generation flow supports cancellation:

- **Client**: `AbortController` per generation. `cancel()` calls
  `controller.abort()` and clears the in-flight job.
- **Server**: streaming routes propagate `req.signal` to the upstream
  fetch. Non-streaming routes mark the job cancelled and stop polling.

The cancel button appears next to the generate button whenever a job is
active.

## 6. State-of-generation UX

| State       | Rendered by            | Contract                                         |
| ----------- | ---------------------- | ------------------------------------------------ |
| Empty       | `StudioEmptyState`     | Icon + explain + first-action CTA                |
| Loading     | `StudioLoadingState`   | Skeleton grid at the canvas aspect               |
| Streaming   | Studio-specific        | Progressive reveal + spinner                     |
| Success     | `StudioResultGrid`     | Save / favorite / open, ≥ 44px touch targets     |
| Error       | `StudioErrorState`     | `role="alert"`, retry affordance, dismissable    |

Every studio must implement every state; skipping any is treated as a bug.

## 7. Persistence

Each studio's store persists:

- User inputs (direction / draft / working prompt)
- Generated results (favorited or explicitly saved)
- User-created collections
- Version history where the studio supports edits

Keys use the `vv-<domain>-<slice>` convention so tools can enumerate
studio storage without collisions.

## 8. Adding a new studio

1. Add the module entry to `src/lib/modules/registry.ts` with `status:
   "live"` when ready.
2. Create the domain layer under `src/lib/<name>/` mirroring the existing
   studios.
3. Create the route under `src/app/(app)/<name>/page.tsx` that renders
   your studio component.
4. Compose your UI from `StudioShell` + primitives. Never re-invent
   loading/empty/error shells.
5. Add AI route(s) under `src/app/api/<name>/`, with prompt-length caps
   and consistent `{ error }` shape.
6. Provide a local deterministic mock so the studio works offline.
7. Colocate tests under `<component>.test.tsx` for at least the store and
   the interactive components (generate, cancel, save).
