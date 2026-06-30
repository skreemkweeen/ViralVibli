"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { assemblePrompt, emptyDirection, type Direction } from "./prompt";

export type Concept = {
  id: string;
  prompt: string;
  categoryId: string;
  aspectId: string;
  styleId: string | null;
  seed: string;
  createdAt: number;
  favorite: boolean;
  collectionId: string | null;
};

export type HistoryEntry = {
  id: string;
  prompt: string;
  direction: Direction;
  createdAt: number;
};

export type Collection = { id: string; name: string };

export type SavedPrompt = {
  id: string;
  prompt: string;
  direction: Direction;
  tags: string[];
  createdAt: number;
};

type VisionState = {
  direction: Direction;
  setField: <K extends keyof Direction>(key: K, value: Direction[K]) => void;
  setDirection: (d: Direction) => void;
  applyPreset: (values: Partial<Direction>) => void;
  resetDirection: () => void;
  prompt: string;

  generating: boolean;
  concepts: Concept[];
  generate: () => void;
  toggleFavorite: (id: string) => void;
  removeConcept: (id: string) => void;
  assignCollection: (id: string, collectionId: string | null) => void;

  history: HistoryEntry[];
  restore: (entry: HistoryEntry) => void;
  clearHistory: () => void;

  collections: Collection[];
  createCollection: (name: string) => string;

  saved: SavedPrompt[];
  savePrompt: (tags: string[]) => void;
  removeSaved: (id: string) => void;
  restoreSaved: (entry: SavedPrompt) => void;
  allTags: string[];
};

const KEY = {
  concepts: "vv-vision-concepts",
  history: "vv-vision-history",
  collections: "vv-vision-collections",
  saved: "vv-vision-saved",
};

const VisionContext = createContext<VisionState | null>(null);

let n = 0;
const uid = (p: string) => `${p}-${Date.now()}-${++n}`;

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function VisionProvider({ children }: { children: React.ReactNode }) {
  const [direction, setDirection] = useState<Direction>(emptyDirection);
  const [generating, setGenerating] = useState(false);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [saved, setSaved] = useState<SavedPrompt[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // hydrate once
  useEffect(() => {
    setConcepts(load<Concept[]>(KEY.concepts, []));
    setHistory(load<HistoryEntry[]>(KEY.history, []));
    setCollections(
      load<Collection[]>(KEY.collections, [
        { id: "c-launch", name: "Spring launch" },
        { id: "c-moods", name: "Moodboard" },
      ]),
    );
    setSaved(load<SavedPrompt[]>(KEY.saved, []));
    setHydrated(true);
  }, []);

  // persist
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.concepts, JSON.stringify(concepts));
  }, [concepts, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.history, JSON.stringify(history));
  }, [history, hydrated]);
  useEffect(() => {
    if (hydrated)
      localStorage.setItem(KEY.collections, JSON.stringify(collections));
  }, [collections, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.saved, JSON.stringify(saved));
  }, [saved, hydrated]);

  const prompt = useMemo(() => assemblePrompt(direction), [direction]);

  const setField = useCallback(
    <K extends keyof Direction>(key: K, value: Direction[K]) =>
      setDirection((d) => ({ ...d, [key]: value })),
    [],
  );

  const applyPreset = useCallback(
    (values: Partial<Direction>) =>
      setDirection((d) => ({ ...d, ...values })),
    [],
  );

  const resetDirection = useCallback(() => setDirection(emptyDirection), []);

  const generate = useCallback(() => {
    setGenerating(true);
    // brief, intentional latency so the gallery reads as a real render pass
    window.setTimeout(() => {
      const made: Concept[] = Array.from({ length: 3 }).map((_, i) => {
        const id = uid("concept");
        return {
          id,
          prompt,
          categoryId: direction.category,
          aspectId: direction.aspect,
          styleId: direction.style,
          seed: `${id}-${i}`,
          createdAt: Date.now(),
          favorite: false,
          collectionId: null,
        };
      });
      setConcepts((c) => [...made, ...c]);
      setHistory((h) =>
        [
          { id: uid("h"), prompt, direction, createdAt: Date.now() },
          ...h,
        ].slice(0, 50),
      );
      setGenerating(false);
    }, 700);
  }, [prompt, direction]);

  const savePrompt = useCallback(
    (tags: string[]) =>
      setSaved((s) => [
        {
          id: uid("saved"),
          prompt,
          direction,
          tags,
          createdAt: Date.now(),
        },
        ...s,
      ]),
    [prompt, direction],
  );

  const removeSaved = useCallback(
    (id: string) => setSaved((s) => s.filter((x) => x.id !== id)),
    [],
  );

  const restoreSaved = useCallback(
    (entry: SavedPrompt) => setDirection(entry.direction),
    [],
  );

  const allTags = useMemo(
    () => Array.from(new Set(saved.flatMap((s) => s.tags))).sort(),
    [saved],
  );

  const toggleFavorite = useCallback(
    (id: string) =>
      setConcepts((c) =>
        c.map((x) => (x.id === id ? { ...x, favorite: !x.favorite } : x)),
      ),
    [],
  );

  const removeConcept = useCallback(
    (id: string) => setConcepts((c) => c.filter((x) => x.id !== id)),
    [],
  );

  const assignCollection = useCallback(
    (id: string, collectionId: string | null) =>
      setConcepts((c) =>
        c.map((x) => (x.id === id ? { ...x, collectionId } : x)),
      ),
    [],
  );

  const restore = useCallback(
    (entry: HistoryEntry) => setDirection(entry.direction),
    [],
  );
  const clearHistory = useCallback(() => setHistory([]), []);

  const createCollection = useCallback((name: string) => {
    const id = uid("col");
    setCollections((c) => [...c, { id, name }]);
    return id;
  }, []);

  const value = useMemo<VisionState>(
    () => ({
      direction,
      setField,
      setDirection,
      applyPreset,
      resetDirection,
      prompt,
      generating,
      concepts,
      generate,
      toggleFavorite,
      removeConcept,
      assignCollection,
      history,
      restore,
      clearHistory,
      collections,
      createCollection,
      saved,
      savePrompt,
      removeSaved,
      restoreSaved,
      allTags,
    }),
    [
      direction,
      setField,
      applyPreset,
      resetDirection,
      prompt,
      generating,
      concepts,
      generate,
      toggleFavorite,
      removeConcept,
      assignCollection,
      history,
      restore,
      clearHistory,
      collections,
      createCollection,
      saved,
      savePrompt,
      removeSaved,
      restoreSaved,
      allTags,
    ],
  );

  return (
    <VisionContext.Provider value={value}>{children}</VisionContext.Provider>
  );
}

export function useVision(): VisionState {
  const ctx = useContext(VisionContext);
  if (!ctx) throw new Error("useVision must be used within <VisionProvider>");
  return ctx;
}
