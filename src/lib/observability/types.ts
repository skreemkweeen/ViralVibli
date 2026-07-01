/**
 * Provider-agnostic observability contract. Sentry, PostHog, Datadog, and a
 * no-op default all implement the same shape so consumer code never learns
 * the provider it is talking to.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogAttributes = Record<string, unknown>;

export interface Logger {
  debug(message: string, attrs?: LogAttributes): void;
  info(message: string, attrs?: LogAttributes): void;
  warn(message: string, attrs?: LogAttributes): void;
  error(message: string, attrs?: LogAttributes): void;
}

export interface ErrorReporter {
  /** Report a caught error with optional structured context. */
  captureException(error: unknown, context?: LogAttributes): void;
  /** Report a synthetic error (no stack). */
  captureMessage(message: string, level?: LogLevel, context?: LogAttributes): void;
}

export interface EventTracker {
  /** Track a user-facing product event (page view, generation, save). */
  track(event: string, props?: LogAttributes): void;
  /** Associate the current session with a user identity. */
  identify(userId: string, traits?: LogAttributes): void;
}

export interface Observability {
  logger: Logger;
  reporter: ErrorReporter;
  tracker: EventTracker;
}
