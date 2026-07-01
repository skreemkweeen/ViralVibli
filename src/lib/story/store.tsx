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
import {
  emptyStoryDirection,
  type StoryDirection,
  type StoryConcept,
  type StoryHistoryEntry,
  type StorySaved,
} from "./types";
import { assembleStoryBrief, slideCount } from "./composer";
import type { StoryResult } from "@/lib/ai/types";
import type { StudioCollection } from "@/hooks/studio";
import { useGeneration } from "@/hooks/studio/use-generation";

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY = {
  concepts: "vv-story-concepts",
  history: "vv-story-history",
  collections: "vv-story-collections",
  saved: "vv-story-saved",
};

const StoryContext = createContext<StoryState | null>(null);

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

// ─── State contract ───────────────────────────────────────────────────────────

type GenerateError = { message: string } | null;

type StoryState = {
  direction: StoryDirection;
  setField: <K extends keyof StoryDirection>(key: K, value: StoryDirection[K]) => void;
  setDirection: (d: StoryDirection) => void;
  resetDirection: () => void;
  brief: string;

  generating: boolean;
  enhancing: boolean;
  generateError: GenerateError;
  cancelGeneration: () => void;

  concepts: StoryConcept[];
  generate: () => void;
  toggleFavorite: (id: string) => void;
  removeConcept: (id: string) => void;
  assignCollection: (id: string, collectionId: string | null) => void;
  duplicateConcept: (id: string) => void;
  renameConcept: (id: string, label: string) => void;
  /** Overwrite a single slide's copy inside a concept. */
  updateSlideCopy: (conceptId: string, slideIndex: number, copy: string) => void;

  history: StoryHistoryEntry[];
  restore: (entry: StoryHistoryEntry) => void;
  clearHistory: () => void;

  collections: StudioCollection[];
  createCollection: (name: string) => string;

  saved: StorySaved[];
  savePrompt: (tags: string[]) => void;
  removeSaved: (id: string) => void;
  restoreSaved: (entry: StorySaved) => void;
  allTags: string[];
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const [direction, setDirection] = useState<StoryDirection>(emptyStoryDirection);
  const [concepts, setConcepts] = useState<StoryConcept[]>([]);
  const [history, setHistory] = useState<StoryHistoryEntry[]>([]);
  const [collections, setCollections] = useState<StudioCollection[]>([]);
  const [saved, setSaved] = useState<StorySaved[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const directionSnapshotRef = useRef<StoryDirection>(direction);

  // ── Hydrate ──
  useEffect(() => {
    setConcepts(load<StoryConcept[]>(KEY.concepts, []));
    setHistory(load<StoryHistoryEntry[]>(KEY.history, []));
    setCollections(load<StudioCollection[]>(KEY.collections, []));
    setSaved(load<StorySaved[]>(KEY.saved, []));
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

  const brief = useMemo(() => assembleStoryBrief(direction), [direction]);

  // ── Result handler ────────────────────────────────────────────────────────
  const onResult = useCallback(
    (result: StoryResult, _enhancedPrompt: string | null, baseBrief: string) => {
      const snap = directionSnapshotRef.current;
      const concept: StoryConcept = {
        id: uid("story"),
        direction: snap,
        brief: baseBrief,
        slides: result.slides,
        provider: result.provider,
        createdAt: Date.now(),
        favorite: false,
        collectionId: null,
      };
      setConcepts((c) => [concept, ...c]);
      setHistory((h) =>
        [
          {
            id: uid("sh"),
            brief: baseBrief,
            direction: snap,
            createdAt: Date.now(),
          },
          ...h,
        ].slice(0, 50),
      );
    },
    [],
  );

  const { generating, enhancing, error, generate: runGenerate, cancel: cancelGeneration } =
    useGeneration<StoryResult>(onResult, {
      createEndpoint: "/api/story/generate",
      jobsBase: "/api/jobs",
    });

  const setField = useCallback(
    <K extends keyof StoryDirection>(key: K, value: StoryDirection[K]) =>
      setDirection((d) => ({ ...d, [key]: value })),
    [],
  );

  const resetDirection = useCallback(() => setDirection(emptyStoryDirection), []);

  const generate = useCallback(() => {
    directionSnapshotRef.current = direction;
    const count = slideCount(direction);
    runGenerate({
      basePrompt: brief,
      enhance: null,
      body: {
        brief,
        subject: direction.subject || undefined,
        framework: direction.framework,
        platform: direction.platform,
        count,
        voice: direction.voice ?? undefined,
        tone: direction.tone ?? undefined,
        hookStrength: direction.hookStrength,
        visualDirection: direction.visualDirection ?? undefined,
        ctaStyle: direction.ctaStyle ?? undefined,
        audience: direction.audience ?? undefined,
        goal: direction.goal,
      },
    });
  }, [runGenerate, brief, direction]);

  // ── Concept management ────────────────────────────────────────────────────
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
        const clone: StoryConcept = {
          ...src,
          id: uid("story"),
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

  const updateSlideCopy = useCallback(
    (conceptId: string, slideIndex: number, copy: string) => {
      const trimmed = copy.trim();
      if (!trimmed) return;
      setConcepts((c) =>
        c.map((concept) => {
          if (concept.id !== conceptId) return concept;
          const slides = concept.slides.map((s, i) =>
            i === slideIndex ? { ...s, copy: trimmed } : s,
          );
          return { ...concept, slides };
        }),
      );
    },
    [],
  );

  const restore = useCallback(
    (entry: StoryHistoryEntry) => setDirection(entry.direction),
    [],
  );
  const clearHistory = useCallback(() => setHistory([]), []);

  const createCollection = useCallback((name: string) => {
    const id = uid("sc");
    setCollections((c) => [...c, { id, name }]);
    return id;
  }, []);

  const savePrompt = useCallback(
    (tags: string[]) =>
      setSaved((s) => [
        { id: uid("ss"), brief, direction, tags, createdAt: Date.now() },
        ...s,
      ]),
    [brief, direction],
  );

  const removeSaved = useCallback(
    (id: string) => setSaved((s) => s.filter((x) => x.id !== id)),
    [],
  );

  const restoreSaved = useCallback(
    (entry: StorySaved) => setDirection(entry.direction),
    [],
  );

  const allTags = useMemo(
    () => Array.from(new Set(saved.flatMap((s) => s.tags))).sort(),
    [saved],
  );

  const value = useMemo<StoryState>(
    () => ({
      direction,
      setField,
      setDirection,
      resetDirection,
      brief,
      generating,
      enhancing,
      generateError: error ? { message: error } : null,
      cancelGeneration,
      concepts,
      generate,
      toggleFavorite,
      removeConcept,
      assignCollection,
      duplicateConcept,
      renameConcept,
      updateSlideCopy,
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
      resetDirection,
      brief,
      generating,
      enhancing,
      error,
      cancelGeneration,
      concepts,
      generate,
      toggleFavorite,
      removeConcept,
      assignCollection,
      duplicateConcept,
      renameConcept,
      updateSlideCopy,
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

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

export function useStory(): StoryState {
  const ctx = useContext(StoryContext);
  if (!ctx) throw new Error("useStory must be used within <StoryProvider>");
  return ctx;
}
