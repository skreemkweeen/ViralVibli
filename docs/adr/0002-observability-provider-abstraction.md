# ADR 0002 — Observability Provider Abstraction

## Status

Accepted (Phase 10 Pass 3, 2026-07-01).

## Context

Every studio and every API route eventually needs to emit structured
logs, capture exceptions, and track product events. Picking a single
concrete provider (Sentry, PostHog, Datadog) at this stage would either
lock the platform to that vendor's SDK or scatter provider-specific
imports across the codebase.

## Decision

Introduce `src/lib/observability/` with three interfaces (`Logger`,
`ErrorReporter`, `EventTracker`) and a resolver that picks a concrete
provider based on `NEXT_PUBLIC_OBSERVABILITY`:

- `noop` (default) — zero cost in production; ships nothing.
- `console` — verbose console output for local dev.
- Future: `sentry`, `posthog`, `datadog` — implement the same three
  interfaces and register with the resolver. No consumer code changes.

Consumers only ever import `logger`, `reporter`, or `tracker`. They
never learn the provider they are talking to.

## Consequences

Positive:

- Swapping providers is a single-file change.
- Local dev keeps a signal (`console`) without shipping a vendor SDK.
- Tests do not require mocks — the noop provider is silent by default.

Negative:

- Callers pay the small tax of shaping structured attributes into an
  object literal on every call.
- The abstraction hides provider-specific features (breadcrumbs,
  distributed tracing). We accept this trade-off; when we need those
  features we will extend the interfaces.
