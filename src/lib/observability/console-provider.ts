/**
 * Default provider: routes everything to console with structured attributes.
 * Silent by default in production; enable via env NEXT_PUBLIC_OBSERVABILITY=console.
 */

import type {
  ErrorReporter,
  EventTracker,
  LogAttributes,
  LogLevel,
  Logger,
  Observability,
} from "./types";

function format(prefix: string, message: string, attrs?: LogAttributes): string {
  if (!attrs || Object.keys(attrs).length === 0) return `[${prefix}] ${message}`;
  try {
    return `[${prefix}] ${message} ${JSON.stringify(attrs)}`;
  } catch {
    return `[${prefix}] ${message}`;
  }
}

const logger: Logger = {
  debug: (m, a) => console.debug(format("debug", m, a)),
  info: (m, a) => console.info(format("info", m, a)),
  warn: (m, a) => console.warn(format("warn", m, a)),
  error: (m, a) => console.error(format("error", m, a)),
};

const reporter: ErrorReporter = {
  captureException: (error, context) => {
    console.error(
      format("error", "Unhandled exception", {
        ...context,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    );
  },
  captureMessage: (message, level: LogLevel = "info", context) => {
    logger[level](message, context);
  },
};

const tracker: EventTracker = {
  track: (event, props) => console.debug(format("event", event, props)),
  identify: (userId, traits) => console.debug(format("identify", userId, traits)),
};

export const consoleProvider: Observability = { logger, reporter, tracker };
