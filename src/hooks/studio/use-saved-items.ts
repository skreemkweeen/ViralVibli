"use client";

import { useState, useCallback, useMemo, useEffect } from "react";

type Saveable = { id: string; tags: string[]; createdAt: number };

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

let n = 0;
const uid = (p: string) => `${p}-${Date.now()}-${++n}`;

/**
 * Generic localStorage-backed list of tagged items.
 * T must have `id`, `tags`, and `createdAt`.
 */
export function useSavedItems<T extends Saveable>(storageKey: string) {
  const [items, setItems] = useState<T[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(load<T[]>(storageKey, []));
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, hydrated, storageKey]);

  const add = useCallback(
    (data: Omit<T, "id" | "createdAt">) =>
      setItems((s) => [
        { ...data, id: uid("saved"), createdAt: Date.now() } as T,
        ...s,
      ]),
    [],
  );

  const remove = useCallback(
    (id: string) => setItems((s) => s.filter((x) => x.id !== id)),
    [],
  );

  const allTags = useMemo(
    () => Array.from(new Set(items.flatMap((s) => s.tags))).sort(),
    [items],
  );

  return { items, add, remove, allTags };
}
