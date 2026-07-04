"use client";

import { useState, useCallback, useEffect } from "react";

export type StudioCollection = { id: string; name: string };

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

/** Generic localStorage-backed collection list with create/remove. */
export function useCollections(
  storageKey: string,
  initialCollections: StudioCollection[] = [],
) {
  const [collections, setCollections] = useState<StudioCollection[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollections(load<StudioCollection[]>(storageKey, initialCollections));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, JSON.stringify(collections));
  }, [collections, hydrated, storageKey]);

  const createCollection = useCallback((name: string): string => {
    const id = uid("col");
    setCollections((c) => [...c, { id, name }]);
    return id;
  }, []);

  const removeCollection = useCallback((id: string) => {
    setCollections((c) => c.filter((x) => x.id !== id));
  }, []);

  return { collections, createCollection, removeCollection };
}
