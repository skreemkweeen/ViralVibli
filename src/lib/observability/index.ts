/**
 * Public entry point. Every caller depends on this file, never on a specific
 * provider. To swap providers, change the resolver below — no downstream
 * refactor required.
 *
 * Env selector: NEXT_PUBLIC_OBSERVABILITY
 *   - "console" → verbose console output (dev / debug)
 *   - "noop" | undefined → silent (production default)
 *   Future values ("sentry", "posthog") land here without touching consumers.
 */

import { consoleProvider } from "./console-provider";
import { noopProvider } from "./noop-provider";
import type { Observability } from "./types";

function resolveProvider(): Observability {
  const mode =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_OBSERVABILITY
      : undefined;

  switch (mode) {
    case "console":
      return consoleProvider;
    case "noop":
    default:
      return noopProvider;
  }
}

export const observability = resolveProvider();

export const logger = observability.logger;
export const reporter = observability.reporter;
export const tracker = observability.tracker;

export type {
  Logger,
  ErrorReporter,
  EventTracker,
  Observability,
  LogLevel,
  LogAttributes,
} from "./types";
