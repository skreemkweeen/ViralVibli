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
import {
  addSlideComment as addSlideCommentFn,
  emptySlide,
  fromLegacySlide,
  moveSlide as moveSlideFn,
  removeSlide as removeSlideFn,
  duplicateSlide as duplicateSlideFn,
  splitSlide as splitSlideFn,
  mergeSlides as mergeSlidesFn,
  snapshotSlideVersion,
  restoreSlideVersion,
  removeSlideComment as removeSlideCommentFn,
  updateSlideFields,
  type RichSlide,
  type SlideComment,
} from "./story-slides";
import {
  buildCampaign,
  type BuildCampaignOptions,
  type StoryCampaign,
  type StoryEntry,
} from "./story-campaigns";
import {
  applyDirectorAction,
  type DirectorActionId,
  type DirectorResult,
} from "./story-director";
import {
  inspectStory,
  type StoryInspection,
} from "./story-inspector";
import {
  predictStory,
  type StoryPrediction,
} from "./story-analytics";
import {
  addPublishItem,
  removePublishItem,
  setPublishStatus,
  updatePublishItem,
  type PublishItem,
  type PublishQueue,
  type PublishStatus,
} from "./story-publishing";
import {
  branchStoryFrom,
  commentOnStorySnapshot,
  commitStorySnapshot,
  duplicateStorySnapshot,
  emptyStoryTree,
  labelStorySnapshot,
  mergeStorySnapshots,
  removeStoryComment,
  restoreStorySnapshot,
  setStoryApproval,
  type StoryComment as SnapshotComment,
  type StorySnapshotId,
  type StoryTree,
} from "./story-versions";
import { buildNarrativeGraph, type NarrativeGraph } from "./narrative-graph";
import type { StoryPlatformId } from "./story-platforms";
import type { StoryResult } from "@/lib/ai/types";
import type { StudioCollection } from "@/hooks/studio";
import { useGeneration } from "@/hooks/studio/use-generation";
import { useWorkspace } from "@/lib/workspace/store";

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY = {
  concepts: "vv-story-concepts",
  history: "vv-story-history",
  collections: "vv-story-collections",
  saved: "vv-story-saved",
  // Story Studio 2.0 — per-project slices mirror Vision Studio's pattern.
  slidesDefault: "vv-story-slides-default",
  slidesProject: (id: string) => `vv-story-slides-${id}`,
  storiesDefault: "vv-story-stories-default",
  storiesProject: (id: string) => `vv-story-stories-${id}`,
  campaignsDefault: "vv-story-campaigns-default",
  campaignsProject: (id: string) => `vv-story-campaigns-${id}`,
  publishDefault: "vv-story-publish-default",
  publishProject: (id: string) => `vv-story-publish-${id}`,
  versionsDefault: "vv-story-versions-default",
  versionsProject: (id: string) => `vv-story-versions-${id}`,
  activeCampaign: "vv-story-active-campaign",
  activeStory: "vv-story-active-story",
  targetPlatform: "vv-story-target-platform",
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

  // ── Story Studio 2.0 additions ──

  /** Rich slide-deck the workspace is currently editing */
  workingSlides: RichSlide[];
  /** Import an existing generated concept's slides as a rich deck */
  loadConceptIntoSlides: (conceptId: string) => void;
  /** Clear the working deck */
  clearSlides: () => void;
  addSlide: (atIndex?: number) => string;
  updateSlide: (id: string, patch: Partial<RichSlide>) => void;
  removeSlideById: (id: string) => void;
  moveSlideById: (id: string, toIndex: number) => void;
  duplicateSlideById: (id: string) => string | null;
  splitSlideById: (id: string, at?: number) => string | null;
  mergeSlideById: (firstId: string, secondId: string) => void;
  snapshotSlide: (id: string, label?: string, note?: string) => void;
  restoreSlideVersionById: (id: string, versionId: string) => void;
  addCommentToSlide: (id: string, body: string) => void;
  removeCommentFromSlide: (id: string, commentId: string) => void;
  /** Apply an AI Director action to a slide's body */
  applyDirectorToSlide: (id: string, action: DirectorActionId) => DirectorResult | null;

  /** Target platform for previews + inspector + analytics */
  targetPlatform: StoryPlatformId;
  setTargetPlatform: (id: StoryPlatformId) => void;

  /** Inspector + analytics over the working deck */
  inspection: StoryInspection;
  predictions: StoryPrediction[];

  /** Campaign + stories hierarchy for the active project */
  campaigns: StoryCampaign[];
  stories: StoryEntry[];
  activeCampaignId: string | null;
  activeStoryId: string | null;
  setActiveCampaign: (id: string | null) => void;
  setActiveStory: (id: string | null) => void;
  createCampaignFromTemplate: (
    templateId: string,
    opts?: { name?: string; makeIds?: BuildCampaignOptions["makeStoryId"] },
  ) => string;
  removeCampaign: (id: string) => void;

  /** Publishing queue (per project) */
  publishQueue: PublishQueue;
  publishStory: (
    storyId: string,
    platform: StoryPlatformId,
    scheduledAt?: number,
  ) => string;
  updatePublish: (id: string, patch: Partial<PublishItem>) => void;
  removePublish: (id: string) => void;
  markPublishStatus: (id: string, status: PublishStatus, url?: string) => void;

  /** Story-level version tree */
  storyTree: StoryTree;
  commitStoryTake: (label?: string, message?: string) => string;
  branchStory: (branchName: string) => string | null;
  restoreStoryTake: (id: StorySnapshotId) => void;
  duplicateStoryTake: (id: StorySnapshotId) => string;
  mergeStoryTakes: (
    intoId: StorySnapshotId,
    takeId: StorySnapshotId,
  ) => string;
  labelStoryTake: (id: StorySnapshotId, label: string) => void;
  addStoryTakeComment: (id: StorySnapshotId, body: string) => void;
  removeStoryTakeComment: (id: StorySnapshotId, commentId: string) => void;
  setStoryTakeApproval: (
    id: StorySnapshotId,
    approval: "draft" | "in-review" | "approved" | "rejected",
  ) => void;

  /** Narrative graph over campaigns + stories */
  narrativeGraph: NarrativeGraph;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const [direction, setDirection] = useState<StoryDirection>(emptyStoryDirection);
  const [concepts, setConcepts] = useState<StoryConcept[]>([]);
  const [history, setHistory] = useState<StoryHistoryEntry[]>([]);
  const [collections, setCollections] = useState<StudioCollection[]>([]);
  const [saved, setSaved] = useState<StorySaved[]>([]);
  const [workingSlides, setWorkingSlides] = useState<RichSlide[]>([]);
  const [stories, setStories] = useState<StoryEntry[]>([]);
  const [campaigns, setCampaigns] = useState<StoryCampaign[]>([]);
  const [publishQueue, setPublishQueue] = useState<PublishQueue>([]);
  const [storyTree, setStoryTree] = useState<StoryTree>(emptyStoryTree());
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [targetPlatform, setTargetPlatformState] = useState<StoryPlatformId>("instagram");
  const [hydrated, setHydrated] = useState(false);

  // Active project (from workspace) is stamped on new concepts so the
  // Project Graph and Timeline surface them automatically.
  const { activeProjectId, recordActivity } = useWorkspace();

  const directionSnapshotRef = useRef<StoryDirection>(direction);
  const activeProjectRef = useRef<string | null>(activeProjectId);
  const workingSlidesRef = useRef<RichSlide[]>(workingSlides);
  useEffect(() => {
    activeProjectRef.current = activeProjectId;
  }, [activeProjectId]);
  useEffect(() => {
    workingSlidesRef.current = workingSlides;
  }, [workingSlides]);

  // ── Hydrate ──
  useEffect(() => {
    setConcepts(load<StoryConcept[]>(KEY.concepts, []));
    setHistory(load<StoryHistoryEntry[]>(KEY.history, []));
    setCollections(load<StudioCollection[]>(KEY.collections, []));
    setSaved(load<StorySaved[]>(KEY.saved, []));
    // Command-palette handoff: if the palette routed here with a subject,
    // apply it once and clear the key so subsequent visits stay pristine.
    try {
      const prefill = localStorage.getItem("vv-story-prefill");
      if (prefill && prefill.trim()) {
        setDirection((d) => ({ ...d, subject: prefill.trim() }));
        localStorage.removeItem("vv-story-prefill");
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

  // Story Studio 2.0 · workspace-wide preferences
  useEffect(() => {
    if (!hydrated) return;
    setActiveCampaignId(load<string | null>(KEY.activeCampaign, null));
    setActiveStoryId(load<string | null>(KEY.activeStory, null));
    setTargetPlatformState(load<StoryPlatformId>(KEY.targetPlatform, "instagram"));
  }, [hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.activeCampaign, JSON.stringify(activeCampaignId));
  }, [activeCampaignId, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.activeStory, JSON.stringify(activeStoryId));
  }, [activeStoryId, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.targetPlatform, JSON.stringify(targetPlatform));
  }, [targetPlatform, hydrated]);

  // Per-project slices
  useEffect(() => {
    if (!hydrated) return;
    const slidesKey = activeProjectRef.current
      ? KEY.slidesProject(activeProjectRef.current)
      : KEY.slidesDefault;
    const storiesKey = activeProjectRef.current
      ? KEY.storiesProject(activeProjectRef.current)
      : KEY.storiesDefault;
    const campaignsKey = activeProjectRef.current
      ? KEY.campaignsProject(activeProjectRef.current)
      : KEY.campaignsDefault;
    const publishKey = activeProjectRef.current
      ? KEY.publishProject(activeProjectRef.current)
      : KEY.publishDefault;
    const versionsKey = activeProjectRef.current
      ? KEY.versionsProject(activeProjectRef.current)
      : KEY.versionsDefault;
    setWorkingSlides(load<RichSlide[]>(slidesKey, []));
    setStories(load<StoryEntry[]>(storiesKey, []));
    setCampaigns(load<StoryCampaign[]>(campaignsKey, []));
    setPublishQueue(load<PublishQueue>(publishKey, []));
    setStoryTree(load<StoryTree>(versionsKey, emptyStoryTree()));
  }, [hydrated, activeProjectId]);

  useEffect(() => {
    if (!hydrated) return;
    const key = activeProjectRef.current
      ? KEY.slidesProject(activeProjectRef.current)
      : KEY.slidesDefault;
    try {
      localStorage.setItem(key, JSON.stringify(workingSlides));
    } catch {
      // storage unavailable
    }
  }, [workingSlides, hydrated, activeProjectId]);
  useEffect(() => {
    if (!hydrated) return;
    const key = activeProjectRef.current
      ? KEY.storiesProject(activeProjectRef.current)
      : KEY.storiesDefault;
    try {
      localStorage.setItem(key, JSON.stringify(stories));
    } catch {
      // storage unavailable
    }
  }, [stories, hydrated, activeProjectId]);
  useEffect(() => {
    if (!hydrated) return;
    const key = activeProjectRef.current
      ? KEY.campaignsProject(activeProjectRef.current)
      : KEY.campaignsDefault;
    try {
      localStorage.setItem(key, JSON.stringify(campaigns));
    } catch {
      // storage unavailable
    }
  }, [campaigns, hydrated, activeProjectId]);
  useEffect(() => {
    if (!hydrated) return;
    const key = activeProjectRef.current
      ? KEY.publishProject(activeProjectRef.current)
      : KEY.publishDefault;
    try {
      localStorage.setItem(key, JSON.stringify(publishQueue));
    } catch {
      // storage unavailable
    }
  }, [publishQueue, hydrated, activeProjectId]);
  useEffect(() => {
    if (!hydrated) return;
    const key = activeProjectRef.current
      ? KEY.versionsProject(activeProjectRef.current)
      : KEY.versionsDefault;
    try {
      localStorage.setItem(key, JSON.stringify(storyTree));
    } catch {
      // storage unavailable
    }
  }, [storyTree, hydrated, activeProjectId]);

  const brief = useMemo(() => assembleStoryBrief(direction), [direction]);

  // ── Result handler ────────────────────────────────────────────────────────
  const onResult = useCallback(
    (result: StoryResult, _enhancedPrompt: string | null, baseBrief: string) => {
      const snap = directionSnapshotRef.current;
      const projectId = activeProjectRef.current ?? undefined;
      const concept: StoryConcept = {
        id: uid("story"),
        direction: snap,
        brief: baseBrief,
        slides: result.slides,
        provider: result.provider,
        createdAt: Date.now(),
        favorite: false,
        collectionId: null,
        projectId,
      };
      setConcepts((c) => [concept, ...c]);
      // Publish an activity ping so the Project timeline updates in place.
      recordActivity(
        "story-generated",
        `Story: ${baseBrief.slice(0, 60)}${baseBrief.length > 60 ? "…" : ""}`,
        "story",
        "/story",
        projectId,
      );
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
    [recordActivity],
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

  // ── Story Studio 2.0 · slide / campaign / publish / versions actions ──

  const setTargetPlatform = useCallback((id: StoryPlatformId) => setTargetPlatformState(id), []);

  const loadConceptIntoSlides = useCallback(
    (conceptId: string) => {
      const c = concepts.find((x) => x.id === conceptId);
      if (!c) return;
      const now = Date.now();
      const slides = c.slides.map((s, i) =>
        fromLegacySlide(s, `${conceptId}-${i}`, i, now),
      );
      setWorkingSlides(slides);
    },
    [concepts],
  );
  const clearSlides = useCallback(() => setWorkingSlides([]), []);

  const addSlide = useCallback((atIndex?: number): string => {
    const id = uid("slide");
    setWorkingSlides((prev) => {
      const clamped = atIndex ?? prev.length;
      const next = emptySlide(id, clamped);
      const inserted = [...prev.slice(0, clamped), next, ...prev.slice(clamped)];
      return inserted.map((s, i) => ({ ...s, index: i }));
    });
    return id;
  }, []);

  const updateSlide = useCallback((id: string, patch: Partial<RichSlide>) => {
    setWorkingSlides((prev) => prev.map((s) => (s.id === id ? updateSlideFields(s, patch) : s)));
  }, []);

  const removeSlideById = useCallback((id: string) => {
    setWorkingSlides((prev) => removeSlideFn(prev, id));
  }, []);

  const moveSlideById = useCallback((id: string, toIndex: number) => {
    setWorkingSlides((prev) => {
      const fromIndex = prev.findIndex((s) => s.id === id);
      if (fromIndex === -1) return prev;
      return moveSlideFn(prev, fromIndex, toIndex);
    });
  }, []);

  const duplicateSlideById = useCallback((id: string): string | null => {
    const newId = uid("slide");
    let created = false;
    setWorkingSlides((prev) => {
      const src = prev.find((s) => s.id === id);
      if (!src) return prev;
      created = true;
      return duplicateSlideFn(prev, id, newId);
    });
    return created ? newId : null;
  }, []);

  const splitSlideById = useCallback((id: string, at?: number): string | null => {
    const newId = uid("slide");
    let created = false;
    setWorkingSlides((prev) => {
      const src = prev.find((s) => s.id === id);
      if (!src) return prev;
      created = true;
      return splitSlideFn(prev, id, newId, at);
    });
    return created ? newId : null;
  }, []);

  const mergeSlideById = useCallback((firstId: string, secondId: string) => {
    setWorkingSlides((prev) => mergeSlidesFn(prev, firstId, secondId));
  }, []);

  const snapshotSlide = useCallback((id: string, label?: string, note?: string) => {
    setWorkingSlides((prev) =>
      prev.map((s) =>
        s.id === id ? snapshotSlideVersion(s, uid("sv"), label, note) : s,
      ),
    );
  }, []);

  const restoreSlideVersionById = useCallback((id: string, versionId: string) => {
    setWorkingSlides((prev) =>
      prev.map((s) => (s.id === id ? restoreSlideVersion(s, versionId) : s)),
    );
  }, []);

  const addCommentToSlide = useCallback((id: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const comment: SlideComment = { id: uid("cm"), body: trimmed, createdAt: Date.now() };
    setWorkingSlides((prev) =>
      prev.map((s) => (s.id === id ? addSlideCommentFn(s, comment) : s)),
    );
  }, []);

  const removeCommentFromSlide = useCallback((id: string, commentId: string) => {
    setWorkingSlides((prev) =>
      prev.map((s) => (s.id === id ? removeSlideCommentFn(s, commentId) : s)),
    );
  }, []);

  const applyDirectorToSlide = useCallback(
    (id: string, action: DirectorActionId): DirectorResult | null => {
      const target = workingSlidesRef.current.find((s) => s.id === id);
      if (!target) return null;
      const result = applyDirectorAction(target.body, action);
      setWorkingSlides((prev) =>
        prev.map((s) => (s.id === id ? updateSlideFields(s, { body: result.after }) : s)),
      );
      return result;
    },
    [],
  );

  const setActiveCampaign = useCallback((id: string | null) => setActiveCampaignId(id), []);
  const setActiveStory = useCallback((id: string | null) => setActiveStoryId(id), []);

  const createCampaignFromTemplate = useCallback(
    (
      templateId: string,
      opts?: { name?: string; makeIds?: BuildCampaignOptions["makeStoryId"] },
    ): string => {
      const campaignId = uid("camp");
      const { campaign, stories: newStories } = buildCampaign({
        campaignId,
        templateId,
        name: opts?.name,
        projectId: activeProjectRef.current ?? undefined,
        makeStoryId: opts?.makeIds,
      });
      setCampaigns((prev) => [campaign, ...prev]);
      setStories((prev) => [...newStories, ...prev]);
      setActiveCampaignId(campaignId);
      setActiveStoryId(newStories[0]?.id ?? null);
      return campaignId;
    },
    [],
  );

  const removeCampaign = useCallback((id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    setStories((prev) => prev.filter((s) => !prev.find((x) => x.id === s.id)?.slides));
    if (activeCampaignId === id) setActiveCampaignId(null);
  }, [activeCampaignId]);

  const publishStory = useCallback(
    (storyId: string, platform: StoryPlatformId, scheduledAt?: number): string => {
      const id = uid("pub");
      setPublishQueue((prev) => addPublishItem(prev, { id, storyId, platform, scheduledAt }));
      return id;
    },
    [],
  );
  const updatePublish = useCallback((id: string, patch: Partial<PublishItem>) => {
    setPublishQueue((prev) => updatePublishItem(prev, id, patch));
  }, []);
  const removePublish = useCallback((id: string) => {
    setPublishQueue((prev) => removePublishItem(prev, id));
  }, []);
  const markPublishStatus = useCallback((id: string, status: PublishStatus, url?: string) => {
    setPublishQueue((prev) => setPublishStatus(prev, id, status, url ? { publishedUrl: url } : undefined));
  }, []);

  const commitStoryTake = useCallback((label?: string, message?: string): string => {
    const id = uid("st");
    setStoryTree((prev) =>
      commitStorySnapshot(prev, {
        id,
        slides: workingSlidesRef.current,
        label,
        message,
      }),
    );
    return id;
  }, []);

  const branchStory = useCallback((branchName: string): string | null => {
    const id = uid("br");
    let created = false;
    setStoryTree((prev) => {
      if (!prev.headId) return prev;
      created = true;
      return branchStoryFrom(prev, prev.headId, {
        id,
        branchId: branchName,
        slides: workingSlidesRef.current,
      });
    });
    return created ? id : null;
  }, []);

  const restoreStoryTake = useCallback((id: StorySnapshotId) => {
    setStoryTree((prev) => {
      const next = restoreStorySnapshot(prev, id);
      const snap = next.snapshots.find((s) => s.id === id);
      if (snap) setWorkingSlides(snap.slides);
      return next;
    });
  }, []);

  const duplicateStoryTake = useCallback((id: StorySnapshotId): string => {
    const newId = uid("dup");
    setStoryTree((prev) => duplicateStorySnapshot(prev, id, newId));
    return newId;
  }, []);

  const mergeStoryTakes = useCallback((intoId: StorySnapshotId, takeId: StorySnapshotId): string => {
    const newId = uid("mrg");
    setStoryTree((prev) => mergeStorySnapshots(prev, intoId, takeId, newId));
    return newId;
  }, []);

  const labelStoryTake = useCallback((id: StorySnapshotId, label: string) => {
    setStoryTree((prev) => labelStorySnapshot(prev, id, label));
  }, []);

  const addStoryTakeComment = useCallback((id: StorySnapshotId, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const comment: SnapshotComment = { id: uid("stc"), body: trimmed, createdAt: Date.now() };
    setStoryTree((prev) => commentOnStorySnapshot(prev, id, comment));
  }, []);

  const removeStoryTakeComment = useCallback((id: StorySnapshotId, commentId: string) => {
    setStoryTree((prev) => removeStoryComment(prev, id, commentId));
  }, []);

  const setStoryTakeApproval = useCallback(
    (id: StorySnapshotId, approval: "draft" | "in-review" | "approved" | "rejected") => {
      setStoryTree((prev) => setStoryApproval(prev, id, approval));
    },
    [],
  );

  // ── Memoised computations ──
  const inspection = useMemo(
    () =>
      inspectStory(workingSlides, {
        platform: targetPlatform,
      }),
    [workingSlides, targetPlatform],
  );

  const predictions = useMemo(
    () => predictStory(workingSlides, { platform: targetPlatform }),
    [workingSlides, targetPlatform],
  );

  const narrativeGraph = useMemo(
    () =>
      buildNarrativeGraph({
        projectId: activeProjectId ?? undefined,
        projectLabel: activeProjectId ?? undefined,
        campaigns,
        stories,
      }),
    [campaigns, stories, activeProjectId],
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
      // Story Studio 2.0
      workingSlides,
      loadConceptIntoSlides,
      clearSlides,
      addSlide,
      updateSlide,
      removeSlideById,
      moveSlideById,
      duplicateSlideById,
      splitSlideById,
      mergeSlideById,
      snapshotSlide,
      restoreSlideVersionById,
      addCommentToSlide,
      removeCommentFromSlide,
      applyDirectorToSlide,
      targetPlatform,
      setTargetPlatform,
      inspection,
      predictions,
      campaigns,
      stories,
      activeCampaignId,
      activeStoryId,
      setActiveCampaign,
      setActiveStory,
      createCampaignFromTemplate,
      removeCampaign,
      publishQueue,
      publishStory,
      updatePublish,
      removePublish,
      markPublishStatus,
      storyTree,
      commitStoryTake,
      branchStory,
      restoreStoryTake,
      duplicateStoryTake,
      mergeStoryTakes,
      labelStoryTake,
      addStoryTakeComment,
      removeStoryTakeComment,
      setStoryTakeApproval,
      narrativeGraph,
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
      // Story Studio 2.0
      workingSlides,
      loadConceptIntoSlides,
      clearSlides,
      addSlide,
      updateSlide,
      removeSlideById,
      moveSlideById,
      duplicateSlideById,
      splitSlideById,
      mergeSlideById,
      snapshotSlide,
      restoreSlideVersionById,
      addCommentToSlide,
      removeCommentFromSlide,
      applyDirectorToSlide,
      targetPlatform,
      setTargetPlatform,
      inspection,
      predictions,
      campaigns,
      stories,
      activeCampaignId,
      activeStoryId,
      setActiveCampaign,
      setActiveStory,
      createCampaignFromTemplate,
      removeCampaign,
      publishQueue,
      publishStory,
      updatePublish,
      removePublish,
      markPublishStatus,
      storyTree,
      commitStoryTake,
      branchStory,
      restoreStoryTake,
      duplicateStoryTake,
      mergeStoryTakes,
      labelStoryTake,
      addStoryTakeComment,
      removeStoryTakeComment,
      setStoryTakeApproval,
      narrativeGraph,
    ],
  );

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

export function useStory(): StoryState {
  const ctx = useContext(StoryContext);
  if (!ctx) throw new Error("useStory must be used within <StoryProvider>");
  return ctx;
}
