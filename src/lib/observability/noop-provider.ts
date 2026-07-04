/**
 * Silent provider — production default. No side effects, no bytes shipped.
 * Swap in Sentry/PostHog by setting NEXT_PUBLIC_OBSERVABILITY at build time.
 */

import type { Observability } from "./types";

const noop = () => {};

export const noopProvider: Observability = {
  logger: {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
  },
  reporter: {
    captureException: noop,
    captureMessage: noop,
  },
  tracker: {
    track: noop,
    identify: noop,
  },
};
