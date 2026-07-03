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
import {
  emptyCreativeBrief,
  mergeBrief,
  type CreativeBrief,
} from "./brief";
import {
  DEFAULT_TARGET_MODEL,
  formatForModel,
  type TargetModelId,
} from "./models";
import {
  applyDirectorAction,
  type DirectorAction,
  type DirectorResult,
} from "./director";
import {
  applyStyleTo,
  deleteStyle,
  saveStyle,
  withPresets,
  type SavedStyle,
} from "./style-library";
import {
  emptyLightingSetup,
  findPreset as findLightingPreset,
  updateLight,
  type Light,
  type LightRole,
  type LightingPresetId,
  type LightingSetup,
} from "./lighting";
import type { ImageResult } from "@/lib/ai/types";
import { useGeneration } from "@/hooks/studio/use-generation";
import { allEnhanceGoals } from "@/lib/ai/types";
import { useWorkspace } from "@/lib/workspace/store";
import {
  addManualReference,
  isConceptPinned,
  pinConceptReference,
  removeReference,
  reorderReferences,
  updateNote,
  type MoodboardItem,
} from "./moodboard";

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
  /**
   * Direction snapshot at the moment of generation. Optional so legacy
   * concepts persisted before this field hydrate cleanly.
   */
  direction?: Direction;
  /** Free-form notes the creator attaches after seeing the render. */
  notes?: string;
  /** Optional project this concept belongs to; set when generated inside a
   * project workspace so the Project Graph and Timeline surface it. */
  projectId?: string;
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
  /** Load a concept's direction snapshot back into the builder. */
  remixConcept: (id: string) => void;
  /** Attach a free-form note to a concept. */
  setConceptNotes: (id: string, notes: string) => void;

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

  // Moodboard
  moodboard: MoodboardItem[];
  addMoodboardReference: (title: string, note?: string, hue?: number) => void;
  pinConceptToMoodboard: (conceptId: string, note?: string) => void;
  removeMoodboardReference: (id: string) => void;
  updateMoodboardNote: (id: string, note: string) => void;
  reorderMoodboard: (from: number, to: number) => void;
  isConceptOnMoodboard: (conceptId: string) => boolean;

  // ── Pass B.1 additions ──
  brief: CreativeBrief;
  updateBrief: (patch: Partial<CreativeBrief>) => void;
  resetBrief: () => void;

  savedStyles: SavedStyle[];
  saveCurrentAsStyle: (name: string, opts?: { vibe?: string; suffix?: string; swatch?: string }) => string | null;
  applyStyle: (id: string) => void;
  removeStyle: (id: string) => void;

  targetModel: TargetModelId;
  setTargetModel: (id: TargetModelId) => void;
  /** The prompt reformatted for the currently selected target model. */
  targetPrompt: string;

  applyDirectorMove: (action: DirectorAction) => DirectorResult;
  /** Descriptors added by the most recent director move — the UI shows a diff. */
  lastDirectorResult: DirectorResult | null;
  clearDirectorResult: () => void;

  // ── Pass B.2 additions ──
  /** Studio lighting rig — 6 lights + optional preset badge. */
  lightingSetup: LightingSetup;
  updateLightConfig: (role: LightRole, patch: Partial<Light>) => void;
  applyLightingPreset: (id: LightingPresetId) => void;
  resetLighting: () => void;
};

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY = {
  concepts: "vv-vision-concepts",
  history: "vv-vision-history",
  collections: "vv-vision-collections",
  saved: "vv-vision-saved",
  moodboard: "vv-vision-moodboard",
  // Pass B.1 keys — brief is per-project (with default), styles + target
  // model live workspace-wide so a signature carries across projects.
  briefDefault: "vv-vision-brief-default",
  briefProject: (id: string) => `vv-vision-brief-${id}`,
  styles: "vv-vision-styles",
  targetModel: "vv-vision-target-model",
  // Pass B.2 — lighting rig is per project.
  lightingDefault: "vv-vision-lighting-default",
  lightingProject: (id: string) => `vv-vision-lighting-${id}`,
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
  const [moodboard, setMoodboard] = useState<MoodboardItem[]>([]);
  const [brief, setBrief] = useState<CreativeBrief>(emptyCreativeBrief);
  const [savedStyles, setSavedStyles] = useState<SavedStyle[]>([]);
  const [targetModel, setTargetModelState] = useState<TargetModelId>(
    DEFAULT_TARGET_MODEL,
  );
  const [lastDirectorResult, setLastDirectorResult] =
    useState<DirectorResult | null>(null);
  const [lightingSetup, setLightingSetup] = useState<LightingSetup>(
    emptyLightingSetup(),
  );
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
    setMoodboard(load<MoodboardItem[]>(KEY.moodboard, []));
    setSavedStyles(load<SavedStyle[]>(KEY.styles, []));
    setTargetModelState(
      load<TargetModelId>(KEY.targetModel, DEFAULT_TARGET_MODEL),
    );
    // Command-palette handoff: if the palette routed here with a subject,
    // apply it once and clear the key so subsequent visits stay pristine.
    try {
      const prefill = localStorage.getItem("vv-vision-prefill");
      if (prefill && prefill.trim()) {
        setDirection((d) => ({ ...d, subject: prefill.trim() }));
        localStorage.removeItem("vv-vision-prefill");
      }
    } catch {
      // storage unavailable
    }
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
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.moodboard, JSON.stringify(moodboard));
  }, [moodboard, hydrated]);

  // Persist styles + target model (workspace-wide).
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.styles, JSON.stringify(savedStyles));
  }, [savedStyles, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.targetModel, JSON.stringify(targetModel));
  }, [targetModel, hydrated]);

  const prompt = useMemo(() => assemblePrompt(direction), [direction]);
  const targetPrompt = useMemo(
    () =>
      formatForModel(prompt, targetModel, {
        aspect: direction.aspect,
        quality: direction.quality,
      }),
    [prompt, targetModel, direction.aspect, direction.quality],
  );

  // Active project (from workspace) is stamped on new concepts so the
  // Project Graph and Timeline surface them automatically.
  const { activeProjectId, recordActivity } = useWorkspace();
  const activeProjectRef = useRef<string | null>(activeProjectId);
  useEffect(() => {
    activeProjectRef.current = activeProjectId;
  }, [activeProjectId]);

  // Load the creative brief for the currently active project (or the
  // workspace default when no project is active). Reruns when the project
  // changes so switching projects switches brief cleanly.
  useEffect(() => {
    if (!hydrated) return;
    const key = activeProjectId
      ? KEY.briefProject(activeProjectId)
      : KEY.briefDefault;
    setBrief(load<CreativeBrief>(key, emptyCreativeBrief));
  }, [activeProjectId, hydrated]);

  // Persist the brief to the correct slot.
  useEffect(() => {
    if (!hydrated) return;
    const key = activeProjectId
      ? KEY.briefProject(activeProjectId)
      : KEY.briefDefault;
    try {
      localStorage.setItem(key, JSON.stringify(brief));
    } catch {
      // storage unavailable
    }
  }, [brief, activeProjectId, hydrated]);

  // Lighting rig follows the same per-project pattern as the brief.
  useEffect(() => {
    if (!hydrated) return;
    const key = activeProjectId
      ? KEY.lightingProject(activeProjectId)
      : KEY.lightingDefault;
    setLightingSetup(load<LightingSetup>(key, emptyLightingSetup()));
  }, [activeProjectId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const key = activeProjectId
      ? KEY.lightingProject(activeProjectId)
      : KEY.lightingDefault;
    try {
      localStorage.setItem(key, JSON.stringify(lightingSetup));
    } catch {
      // storage unavailable
    }
  }, [lightingSetup, activeProjectId, hydrated]);

  // ── Generation hook ───────────────────────────────────────────────────────
  const onResult = useCallback(
    (result: ImageResult, finalPrompt: string | null, basePrompt: string) => {
      const snap = directionSnapshotRef.current;
      const projectId = activeProjectRef.current ?? undefined;
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
        direction: snap,
        projectId,
      }));

      setConcepts((c) => [...made, ...c]);
      recordActivity(
        "vision-generated",
        `Image: ${basePrompt.slice(0, 60)}${basePrompt.length > 60 ? "…" : ""}`,
        "vision",
        "/vision",
        projectId,
      );
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
    [recordActivity],
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

  // ── Pass B.1 actions ──
  const updateBrief = useCallback((patch: Partial<CreativeBrief>) => {
    setBrief((b) => mergeBrief(b, patch));
  }, []);
  const resetBrief = useCallback(() => setBrief(emptyCreativeBrief), []);

  const saveCurrentAsStyle = useCallback(
    (
      name: string,
      opts?: { vibe?: string; suffix?: string; swatch?: string },
    ): string | null => {
      let newId: string | null = null;
      setSavedStyles((prev) => {
        const res = saveStyle(prev, {
          name,
          vibe: opts?.vibe,
          suffix: opts?.suffix,
          swatch: opts?.swatch,
          overrides: {
            style: direction.style,
            mood: direction.mood,
            lighting: direction.lighting,
            composition: direction.composition,
            colorGrade: direction.colorGrade,
            camera: direction.camera,
            lens: direction.lens,
            aperture: direction.aperture,
            material: direction.material,
            texture: direction.texture,
            render: direction.render,
            quality: direction.quality,
          },
        });
        newId = res.id;
        return res.list;
      });
      return newId;
    },
    [direction],
  );

  const applyStyleFn = useCallback(
    (id: string) => {
      const all = withPresets(savedStyles);
      const style = all.find((s) => s.id === id);
      if (!style) return;
      setDirection((d) => applyStyleTo(d, style));
    },
    [savedStyles],
  );

  const removeStyleFn = useCallback((id: string) => {
    setSavedStyles((prev) => deleteStyle(prev, id));
  }, []);

  const setTargetModel = useCallback((id: TargetModelId) => {
    setTargetModelState(id);
  }, []);

  const applyDirectorMove = useCallback(
    (action: DirectorAction): DirectorResult => {
      const res = applyDirectorAction(prompt, action);
      // The director works on the assembled prompt. Rather than trying to
      // decompose the added descriptors back into Direction fields (lossy),
      // we surface them as an "appended notes" style suffix by feeding the
      // added descriptors into the current subject's environment field.
      // This keeps the Direction model source-of-truth while making the
      // added descriptors visible in the composed prompt.
      if (res.changed.length > 0) {
        const append = res.changed.join(", ");
        setDirection((d) => ({
          ...d,
          environment: d.environment
            ? `${d.environment}, ${append}`
            : append,
        }));
      }
      setLastDirectorResult(res);
      return res;
    },
    [prompt],
  );

  const clearDirectorResult = useCallback(
    () => setLastDirectorResult(null),
    [],
  );

  const updateLightConfig = useCallback(
    (role: LightRole, patch: Partial<Light>) => {
      setLightingSetup((s) => updateLight(s, role, patch));
    },
    [],
  );

  const applyLightingPreset = useCallback((id: LightingPresetId) => {
    const preset = findLightingPreset(id);
    if (!preset) return;
    setLightingSetup((s) => preset.apply(s));
  }, []);

  const resetLighting = useCallback(
    () => setLightingSetup(emptyLightingSetup()),
    [],
  );

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

  const remixConcept = useCallback(
    (id: string) => {
      const src = concepts.find((x) => x.id === id);
      if (!src?.direction) return;
      setDirection(src.direction);
    },
    [concepts],
  );

  const setConceptNotes = useCallback(
    (id: string, notes: string) =>
      setConcepts((c) =>
        c.map((x) =>
          x.id === id ? { ...x, notes: notes.trim() || undefined } : x,
        ),
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

  // ── Moodboard actions ─────────────────────────────────────────────────────
  const addMoodboardReference = useCallback(
    (title: string, note?: string, hue?: number) =>
      setMoodboard((items) =>
        addManualReference(items, {
          id: uid("mb"),
          title,
          note,
          hue,
        }),
      ),
    [],
  );

  const pinConceptToMoodboard = useCallback(
    (conceptId: string, note?: string) => {
      const concept = concepts.find((c) => c.id === conceptId);
      if (!concept) return;
      setMoodboard((items) =>
        pinConceptReference(items, {
          id: uid("mb"),
          conceptId,
          prompt: concept.enhancedPrompt ?? concept.prompt,
          seed: concept.seed,
          note,
        }),
      );
    },
    [concepts],
  );

  const removeMoodboardReference = useCallback(
    (id: string) => setMoodboard((items) => removeReference(items, id)),
    [],
  );

  const updateMoodboardNote = useCallback(
    (id: string, note: string) =>
      setMoodboard((items) => updateNote(items, id, note)),
    [],
  );

  const reorderMoodboard = useCallback(
    (from: number, to: number) =>
      setMoodboard((items) => reorderReferences(items, from, to)),
    [],
  );

  const isConceptOnMoodboard = useCallback(
    (conceptId: string) => isConceptPinned(moodboard, conceptId),
    [moodboard],
  );

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
      remixConcept,
      setConceptNotes,
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
      moodboard,
      addMoodboardReference,
      pinConceptToMoodboard,
      removeMoodboardReference,
      updateMoodboardNote,
      reorderMoodboard,
      isConceptOnMoodboard,
      // Pass B.1
      brief,
      updateBrief,
      resetBrief,
      savedStyles,
      saveCurrentAsStyle,
      applyStyle: applyStyleFn,
      removeStyle: removeStyleFn,
      targetModel,
      setTargetModel,
      targetPrompt,
      applyDirectorMove,
      lastDirectorResult,
      clearDirectorResult,
      // Pass B.2
      lightingSetup,
      updateLightConfig,
      applyLightingPreset,
      resetLighting,
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
      remixConcept,
      setConceptNotes,
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
      moodboard,
      addMoodboardReference,
      pinConceptToMoodboard,
      removeMoodboardReference,
      updateMoodboardNote,
      reorderMoodboard,
      isConceptOnMoodboard,
      // Pass B.1 deps
      brief,
      updateBrief,
      resetBrief,
      savedStyles,
      saveCurrentAsStyle,
      applyStyleFn,
      removeStyleFn,
      targetModel,
      setTargetModel,
      targetPrompt,
      applyDirectorMove,
      lastDirectorResult,
      clearDirectorResult,
      // Pass B.2 deps
      lightingSetup,
      updateLightConfig,
      applyLightingPreset,
      resetLighting,
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
