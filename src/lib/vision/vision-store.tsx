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
import type { Job } from "@/lib/ai/types";
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
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<GenerateError>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [saved, setSaved] = useState<SavedPrompt[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Cancellation — ref so the closure always sees the latest value
  const abortRef = useRef<AbortController | null>(null);
  const jobIdRef = useRef<string | null>(null);

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

  // Clear stale enhanced preview when the composed brief changes
  useEffect(() => {
    setEnhancedPrompt(null);
    setGenerateError(null);
  }, [prompt]);

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

  // ── Cancel ────────────────────────────────────────────────────────────────
  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
    // Best-effort job cancellation — fire and forget
    if (jobIdRef.current) {
      void fetch(`/api/vision/jobs/${jobIdRef.current}`, { method: "DELETE" });
      jobIdRef.current = null;
    }
    setGenerating(false);
    setEnhancing(false);
    setGenerateError(null);
  }, []);

  // ── Generate ──────────────────────────────────────────────────────────────
  const generate = useCallback(() => {
    if (generating) return;

    const ac = new AbortController();
    abortRef.current = ac;
    setGenerating(true);
    setEnhancing(true);
    setEnhancedPrompt(null);
    setGenerateError(null);

    const assembledPrompt = prompt;
    const snapshotDirection = direction;

    (async () => {
      // ── Step 1: Enhance ────────────────────────────────────────────────
      let finalPrompt = assembledPrompt;
      try {
        const enhRes = await fetch("/api/vision/enhance", {
          method: "POST",
          signal: ac.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: assembledPrompt,
            subject: direction.subject || "",
            goals: allEnhanceGoals,
          }),
        });
        if (enhRes.ok) {
          const enhData = (await enhRes.json()) as { prompt: string };
          finalPrompt = enhData.prompt;
          setEnhancedPrompt(finalPrompt);
        }
      } catch {
        // Enhancement failure is non-fatal — proceed with base prompt
      }
      setEnhancing(false);

      if (ac.signal.aborted) return;

      // ── Step 2: Create job ─────────────────────────────────────────────
      const aspectRaw = snapshotDirection.aspect.replace("-", ":");
      let jobId: string;
      try {
        const jobRes = await fetch("/api/vision/generate", {
          method: "POST",
          signal: ac.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: finalPrompt,
            aspect: aspectRaw,
            count: 3,
            quality: snapshotDirection.quality,
          }),
        });
        if (!jobRes.ok) throw new Error(`HTTP ${jobRes.status}`);
        const job = (await jobRes.json()) as Job;
        jobId = job.id;
        jobIdRef.current = jobId;
      } catch (err) {
        if (!ac.signal.aborted) {
          setGenerateError({
            message: err instanceof Error ? err.message : "Failed to start generation",
          });
          setGenerating(false);
        }
        return;
      }

      // ── Step 3: Poll ───────────────────────────────────────────────────
      const deadline = Date.now() + 3 * 60 * 1000;
      while (Date.now() < deadline) {
        if (ac.signal.aborted) return;
        await new Promise((r) => setTimeout(r, 1200));
        if (ac.signal.aborted) return;

        try {
          const pollRes = await fetch(`/api/vision/jobs/${jobId}`, { signal: ac.signal });
          if (!pollRes.ok) continue;
          const job = (await pollRes.json()) as Job;

          if (job.status === "succeeded" && job.result) {
            const made: Concept[] = job.result.images.map((img, i) => ({
              id: uid("concept"),
              prompt: assembledPrompt,
              enhancedPrompt: finalPrompt !== assembledPrompt ? finalPrompt : undefined,
              seed: img.seed,
              imageUrl: img.url,
              width: img.width,
              height: img.height,
              categoryId: snapshotDirection.category,
              aspectId: snapshotDirection.aspect,
              styleId: snapshotDirection.style,
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
                  prompt: assembledPrompt,
                  enhancedPrompt: finalPrompt !== assembledPrompt ? finalPrompt : undefined,
                  direction: snapshotDirection,
                  createdAt: Date.now(),
                },
                ...h,
              ].slice(0, 50),
            );
            setGenerating(false);
            jobIdRef.current = null;
            return;
          }

          if (job.status === "failed" || job.status === "cancelled") {
            setGenerateError({ message: job.error ?? "Generation failed" });
            setGenerating(false);
            jobIdRef.current = null;
            return;
          }
        } catch {
          // transient poll error — keep polling
        }
      }

      setGenerateError({ message: "Generation timed out. Please try again." });
      setGenerating(false);
      jobIdRef.current = null;
    })();
  }, [generating, prompt, direction]);

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
      generateError,
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
      generateError,
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
