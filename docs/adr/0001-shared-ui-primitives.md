# ADR 0001 — Shared UI Primitives in `src/components/ui/`

## Status

Accepted (Phase 10 Pass 2, 2026-07-01).

## Context

Between Phase 2 (workspace shell) and Phase 9 (workspace intelligence)
the platform accumulated four studios and a growing app shell, each of
which shipped its own button, chip, input, and card markup. The result
was:

- 4+ competing implementations of the same "pill toggle" pattern.
- Raw hex `#d6f56b` and `text-black` leaking across studios.
- Inconsistent focus rings, cursor states, and active feedback.
- Hover-only affordances invisible on touch devices.

The Phase 10 Pass 2 sweep proved that studio consistency cannot be
achieved by lint rules alone; a shared primitive layer is required.

## Decision

`src/components/ui/` is the canonical home for primitives that (a) are
generic enough to appear in more than one studio and (b) encode
accessibility contracts.

The initial layer:

- `Button` — supports native `<button>` and `next/link`, with size,
  variant, and loading state.
- `Card` — surface container with padding scale and semantic `as` prop.
- `Chip` — toggleable pill / rounded-rect with `aria-pressed`.
- `Field` / `Input` / `Textarea` — form controls with `useId` +
  `aria-describedby` wiring.
- `Badge` — status pill with tone variants.

Each primitive:

- Consumes semantic tokens only (no raw hex).
- Ships a colocated `<name>.test.tsx` covering role, aria state, and
  interaction.
- Provides an unopinionated `className` escape hatch.

Studio-specific primitives (`StudioShell`, `StudioLoadingState`, etc.)
remain in `src/components/studio/` — they are not generic enough for
the marketing surface or settings.

## Consequences

Positive:

- One edit to `Button` propagates to every CTA.
- New studios inherit the interactive-state contract by default.
- Design tokens are enforced at compile time (any raw hex leak is
  reviewable in a single grep).

Negative:

- Studios that need a specialised control (e.g. Vision's `ChipGroup`
  with `size="sm"` + tooltip detail) still keep a domain-local
  implementation. Duplication is accepted here in exchange for
  domain-specific ergonomics.

## Alternatives considered

- **shadcn/ui.** Rejected: pulls in Radix primitives and a large
  component surface the platform does not need. The overhead of owning
  50 components exceeds the value of the 5 we actually use.
- **Radix Themes.** Rejected: token model conflicts with our
  dark-locked semantic tokens.
- **Do nothing.** Rejected: proven to produce drift within a single
  quarter.
