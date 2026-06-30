"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { assemblePrompt, emptyDirection, type Direction } from "./prompt";
import type { ImageResult } from "@/lib/ai/types";
import { useGeneration } from "@/hooks/studio/use-generation";
import { allEnhanceGoals } from "@/lib/ai/types";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type Concept = {
  id: string;
  /** Assembled (pre-enhancement) brief */
  prompt: string;
  /** AI-enhanced version; undefined if enhancement was skipped */
  enhancedPrompt?: string;
  /** Provider-issued seed for deterministic re-generation */
  seed: string;
  /** Remote image URL when a real provider rendered the asset */
  imageUrl?: string;
  width?: number;
  height?: number;
  categoryId: string;
  aspectId: string;
  styleId: string | null;
  presetId?: string;
  provider: string;
  createdAt: number;
  favorite: boolean;
  collectionId: string | null;
  /** Display name; defaults to a formatted timestamp */
  label?: string;
};

export type HistoryEntry = {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
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

// ─── Store contract ───────────────────────────────────────────────────────────

type GenerateError = { message: string } | null;

type VisionState = {
  direction: Direction;
  setField: <K extends keyof Direction>(key: K, value: Direction[K]) => void;
  setDirection: (d: Direction) => void;
  applyPreset: (values: Partial<Direction>) => void;
  resetDirection: () => void;
  prompt: string;

  /** true while enhance + generate is in flight */
  generating: boolean;
  /** true during the enhance step specifically */
  enhancing: boolean;
  /** the latest AI-enhanced prompt (shown in the canvas preview) */
  enhancedPrompt: string | null;
  generateError: GenerateError;
  /** cancel the in-flight job */
  cancelGeneration: () => void;

  concepts: Concept[];
  generate: () => void;
  toggleFavorite: (id: string) => void;
  removeConcept: (id: string) => void;
  assignCollection: (id: string, collectionId: string | null) => void;
  duplicateConcept: (id: string) => void;
  renameConcept: (id: string, label: string) => void;

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

// ─── Storage keys ─────────────────────────────────────────────────────────────

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

// ─── Provider ─────────────────────────────────────────────────────────────────

export function VisionProvider({ children }: { children: React.ReactNode }) {
  const [direction, setDirection] = useState<Direction>(emptyDirection);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [saved, setSaved] = useState<SavedPrompt[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Captures direction at generate-call time so the async result can read it
  const directionSnapshotRef = useRef<Direction>(direction);

  // ── Hydrate ──
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

  // ── Persist ──
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.concepts, JSON.stringify(concepts));
  }, [concepts, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.history, JSON.stringify(history));
  }, [history, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.collections, JSON.stringify(collections));
  }, [collections, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.saved, JSON.stringify(saved));
  }, [saved, hydrated]);

  const prompt = useMemo(() => assemblePrompt(direction), [direction]);

  // ── Generation hook ───────────────────────────────────────────────────────
  const onResult = useCallback(
    (result: ImageResult, finalPrompt: string | null, basePrompt: string) => {
      const snap = directionSnapshotRef.current;
      const made: Concept[] = result.images.map((img, i) => ({
        id: uid("concept"),
        prompt: basePrompt,
        enhancedPrompt: finalPrompt ?? undefined,
        seed: img.seed,
        imageUrl: img.url,
        width: img.width,
        height: img.height,
        categoryId: snap.category,
        aspectId: snap.aspect,
        styleId: snap.style,
        provider: img.provider,
        createdAt: Date.now() + i,
        favorite: false,
        collectionId: null,
      }));

      setConcepts((c) => [...made, ...c]);
      setHistory((h) =>
        [
          {
            id: uid("h"),
            prompt: basePrompt,
            enhancedPrompt: finalPrompt ?? undefined,
            direction: snap,
            createdAt: Date.now(),
          },
          ...h,
        ].slice(0, 50),
      );
    },
    [],
  );

  const {
    generating,
    enhancing,
    enhancedPrompt,
    error,
    generate: runGenerate,
    cancel: cancelGeneration,
    reset,
  } = useGeneration(onResult);

  // Clear stale enhanced preview when the composed brief changes
  useEffect(() => {
    reset();
  }, [prompt, reset]);

  const setField = useCallback(
    <K extends keyof Direction>(key: K, value: Direction[K]) =>
      setDirection((d) => ({ ...d, [key]: value })),
    [],
  );

  const applyPreset = useCallback(
    (values: Partial<Direction>) => setDirection((d) => ({ ...d, ...values })),
    [],
  );

  const resetDirection = useCallback(() => setDirection(emptyDirection), []);

  const generate = useCallback(() => {
    directionSnapshotRef.current = direction;
    runGenerate({
      basePrompt: prompt,
      enhance: { prompt, subject: direction.subject || "", goals: allEnhanceGoals },
      body: {
        prompt,
        aspect: direction.aspect.replace("-", ":"),
        count: 3,
        quality: direction.quality,
      },
    });
  }, [runGenerate, prompt, direction]);

  // ── Concept management ────────────────────────────────────────────────────
  const savePrompt = useCallback(
    (tags: string[]) =>
      setSaved((s) => [
        { id: uid("saved"), prompt, direction, tags, createdAt: Date.now() },
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

  const duplicateConcept = useCallback(
    (id: string) =>
      setConcepts((c) => {
        const src = c.find((x) => x.id === id);
        if (!src) return c;
        const clone: Concept = {
          ...src,
          id: uid("concept"),
          createdAt: Date.now(),
          label: src.label ? `${src.label} (copy)` : undefined,
        };
        const idx = c.findIndex((x) => x.id === id);
        return [...c.slice(0, idx + 1), clone, ...c.slice(idx + 1)];
      }),
    [],
  );

  const renameConcept = useCallback(
    (id: string, label: string) =>
      setConcepts((c) =>
        c.map((x) => (x.id === id ? { ...x, label: label.trim() || undefined } : x)),
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
      enhancing,
      enhancedPrompt,
      generateError: error ? { message: error } : null,
      cancelGeneration,
      concepts,
      generate,
      toggleFavorite,
      removeConcept,
      assignCollection,
      duplicateConcept,
      renameConcept,
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
      enhancing,
      enhancedPrompt,
      error,
      cancelGeneration,
      concepts,
      generate,
      toggleFavorite,
      removeConcept,
      assignCollection,
      duplicateConcept,
      renameConcept,
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
