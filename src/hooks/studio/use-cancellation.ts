import { useRef, useCallback } from "react";

/** Manages an AbortController ref so closures always see the latest signal. */
export function useCancellation() {
  const ref = useRef<AbortController | null>(null);

  const reset = useCallback((): AbortController => {
    const ac = new AbortController();
    ref.current = ac;
    return ac;
  }, []);

  const cancel = useCallback(() => {
    ref.current?.abort();
    ref.current = null;
  }, []);

  return { abortRef: ref, reset, cancel };
}
