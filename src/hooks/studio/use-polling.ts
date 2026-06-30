import { useRef, useCallback } from "react";

type PollFn = () => Promise<"continue" | "done">;

/**
 * Returns a `start` function that runs `fn` on a fixed interval until it
 * returns `"done"`, the deadline elapses, or the returned `stop` is called.
 */
export function usePolling(intervalMs = 1200, deadlineMs = 3 * 60 * 1000) {
  const stopRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  const start = useCallback(
    (fn: PollFn, onTimeout?: () => void) => {
      stopRef.current?.();
      let active = true;
      stopRef.current = () => {
        active = false;
      };

      const deadline = Date.now() + deadlineMs;

      async function tick() {
        while (active && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, intervalMs));
          if (!active) return;
          try {
            const result = await fn();
            if (result === "done" || !active) return;
          } catch {
            // transient error — keep polling
          }
        }
        if (active) onTimeout?.();
      }

      void tick();
    },
    [intervalMs, deadlineMs],
  );

  return { start, stop };
}
