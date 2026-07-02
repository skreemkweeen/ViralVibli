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
import type { VaultTransformResult } from "@/lib/ai/types";
import type {
  PromptEntry,
  VaultFilter,
  SortMode,
  VaultCollection,
  TransformOp,
} from "./types";
import { SEED_PROMPTS } from "./data";
import { useGeneration } from "@/hooks/studio/use-generation";
import { useWorkspace } from "@/lib/workspace/store";

const KEY = {
  prompts: "vv-vault-prompts",
  collections: "vv-vault-collections",
  seeded: "vv-vault-seeded",
};

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

const emptyFilter: VaultFilter = {
  category: null,
  platform: null,
  search: "",
  scope: "all",
};

type TransformPending = VaultTransformResult & { promptId: string; operation: TransformOp };

type VaultState = {
  prompts: PromptEntry[];
  selectedId: string | null;
  filter: VaultFilter;
  sort: SortMode;
  transforming: boolean;
  transformError: string | null;
  transformResult: TransformPending | null;
  filteredPrompts: PromptEntry[];
  categoryCounts: Record<string, number>;

  selectPrompt: (id: string | null) => void;
  addPrompt: (
    data: Omit<
      PromptEntry,
      "id" | "source" | "favorite" | "pinned" | "usageCount" | "versions" | "createdAt" | "updatedAt"
    >,
  ) => string;
  updatePrompt: (id: string, patch: Partial<PromptEntry>) => void;
  removePrompt: (id: string) => void;
  toggleFavorite: (id: string) => void;
  togglePinned: (id: string) => void;
  incrementUsage: (id: string) => void;
  addVersion: (id: string, content: string, note?: string) => void;

  transformPrompt: (promptId: string, operation: TransformOp) => void;
  cancelTransform: () => void;
  acceptTransform: () => void;
  rejectTransform: () => void;
  clearTransformError: () => void;

  setFilter: (patch: Partial<VaultFilter>) => void;
  setSort: (mode: SortMode) => void;

  collections: VaultCollection[];
  createCollection: (name: string) => string;
  removeCollection: (id: string) => void;
  assignCollection: (promptId: string, collectionId: string | null) => void;
};

const VaultContext = createContext<VaultState | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [collections, setCollections] = useState<VaultCollection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<VaultFilter>(emptyFilter);
  const [sort, setSort] = useState<SortMode>("recent");
  const [transformResult, setTransformResult] = useState<TransformPending | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const transformPromptIdRef = useRef<string | null>(null);
  const transformOpRef = useRef<TransformOp | null>(null);

  // ── Hydrate ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const seeded = localStorage.getItem(KEY.seeded);
    const stored = load<PromptEntry[]>(KEY.prompts, []);
    setPrompts(seeded ? stored : [...SEED_PROMPTS, ...stored]);
    if (!seeded) localStorage.setItem(KEY.seeded, "1");
    setCollections(load<VaultCollection[]>(KEY.collections, []));
    setHydrated(true);
  }, []);

  // ── Persist ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.prompts, JSON.stringify(prompts));
  }, [prompts, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.collections, JSON.stringify(collections));
  }, [collections, hydrated]);

  // ── Transform via useGeneration ───────────────────────────────────────────────
  const onTransformResult = useCallback(
    (result: VaultTransformResult, _enhanced: string | null, _base: string) => {
      const promptId = transformPromptIdRef.current;
      const operation = transformOpRef.current;
      if (!promptId || !operation) return;
      setTransformResult({ ...result, promptId, operation });
      transformPromptIdRef.current = null;
      transformOpRef.current = null;
    },
    [],
  );

  const {
    generating: transforming,
    error: transformError,
    generate: runTransform,
    cancel: cancelTransform,
    clearError: clearTransformError,
  } = useGeneration<VaultTransformResult>(onTransformResult, {
    createEndpoint: "/api/vault/transform",
    jobsBase: "/api/jobs",
  });

  // Active project (from workspace) is stamped on newly saved prompts so
  // they surface on the Project Overview and Graph.
  const { activeProjectId, recordActivity } = useWorkspace();

  // ── CRUD ──────────────────────────────────────────────────────────────────────
  const addPrompt = useCallback(
    (
      data: Omit<
        PromptEntry,
        "id" | "source" | "favorite" | "pinned" | "usageCount" | "versions" | "createdAt" | "updatedAt"
      >,
    ): string => {
      const id = uid("vlt");
      const now = Date.now();
      const projectId = data.projectId ?? activeProjectId ?? undefined;
      const entry: PromptEntry = {
        ...data,
        id,
        source: "user",
        favorite: false,
        pinned: false,
        usageCount: 0,
        versions: [],
        createdAt: now,
        updatedAt: now,
        projectId,
      };
      setPrompts((p) => [entry, ...p]);
      recordActivity(
        "prompt-saved",
        `Prompt: ${data.title}`,
        "vault",
        "/vault",
        projectId,
      );
      return id;
    },
    [activeProjectId, recordActivity],
  );

  const updatePrompt = useCallback(
    (id: string, patch: Partial<PromptEntry>) =>
      setPrompts((p) =>
        p.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
      ),
    [],
  );

  const removePrompt = useCallback((id: string) => {
    setPrompts((p) => p.filter((x) => x.id !== id));
    setSelectedId((s) => (s === id ? null : s));
  }, []);

  const toggleFavorite = useCallback(
    (id: string) =>
      setPrompts((p) =>
        p.map((x) =>
          x.id === id ? { ...x, favorite: !x.favorite, updatedAt: Date.now() } : x,
        ),
      ),
    [],
  );

  const togglePinned = useCallback(
    (id: string) =>
      setPrompts((p) =>
        p.map((x) =>
          x.id === id ? { ...x, pinned: !x.pinned, updatedAt: Date.now() } : x,
        ),
      ),
    [],
  );

  const incrementUsage = useCallback(
    (id: string) =>
      setPrompts((p) =>
        p.map((x) =>
          x.id === id ? { ...x, usageCount: x.usageCount + 1, updatedAt: Date.now() } : x,
        ),
      ),
    [],
  );

  const addVersion = useCallback(
    (id: string, content: string, note?: string) =>
      setPrompts((p) =>
        p.map((x) =>
          x.id === id
            ? {
                ...x,
                versions: [
                  { id: uid("ver"), content: x.content, note, createdAt: Date.now() },
                  ...x.versions,
                ].slice(0, 20),
                content,
                updatedAt: Date.now(),
              }
            : x,
        ),
      ),
    [],
  );

  // ── Transform ────────────────────────────────────────────────────────────────
  const transformPrompt = useCallback(
    (promptId: string, operation: TransformOp) => {
      const prompt = prompts.find((p) => p.id === promptId);
      if (!prompt) return;
      transformPromptIdRef.current = promptId;
      transformOpRef.current = operation;
      runTransform({
        basePrompt: prompt.content,
        enhance: null,
        body: {
          content: prompt.content,
          operation,
          platform: prompt.platform,
          count: 3,
        },
      });
    },
    [prompts, runTransform],
  );

  const acceptTransform = useCallback(() => {
    if (!transformResult) return;
    const { promptId, content } = transformResult;
    addVersion(promptId, content);
    setTransformResult(null);
  }, [transformResult, addVersion]);

  const rejectTransform = useCallback(() => setTransformResult(null), []);

  // ── Filter + sort ─────────────────────────────────────────────────────────────
  const setFilter = useCallback(
    (patch: Partial<VaultFilter>) => setFilterState((f) => ({ ...f, ...patch })),
    [],
  );

  const filteredPrompts = useMemo(() => {
    let result = prompts;

    if (filterState.scope === "favorites") result = result.filter((p) => p.favorite);
    else if (filterState.scope === "pinned") result = result.filter((p) => p.pinned);

    if (filterState.category)
      result = result.filter((p) => p.category === filterState.category);
    if (filterState.platform)
      result = result.filter((p) => p.platform === filterState.platform);

    if (filterState.search.trim()) {
      const q = filterState.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    const sorted =
      sort === "popular"
        ? [...result].sort((a, b) => b.usageCount - a.usageCount)
        : sort === "alphabetical"
          ? [...result].sort((a, b) => a.title.localeCompare(b.title))
          : [...result].sort((a, b) => b.updatedAt - a.updatedAt);

    return [...sorted.filter((p) => p.pinned), ...sorted.filter((p) => !p.pinned)];
  }, [prompts, filterState, sort]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of prompts) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return counts;
  }, [prompts]);

  // ── Collections ───────────────────────────────────────────────────────────────
  const createCollection = useCallback((name: string): string => {
    const id = uid("vcol");
    setCollections((c) => [...c, { id, name, createdAt: Date.now() }]);
    return id;
  }, []);

  const removeCollection = useCallback((id: string) => {
    setCollections((c) => c.filter((x) => x.id !== id));
    setPrompts((p) =>
      p.map((x) => (x.collectionId === id ? { ...x, collectionId: undefined } : x)),
    );
  }, []);

  const assignCollection = useCallback(
    (promptId: string, collectionId: string | null) =>
      setPrompts((p) =>
        p.map((x) =>
          x.id === promptId
            ? { ...x, collectionId: collectionId ?? undefined, updatedAt: Date.now() }
            : x,
        ),
      ),
    [],
  );

  const value = useMemo<VaultState>(
    () => ({
      prompts,
      selectedId,
      filter: filterState,
      sort,
      transforming,
      transformError,
      transformResult,
      filteredPrompts,
      categoryCounts,
      selectPrompt: setSelectedId,
      addPrompt,
      updatePrompt,
      removePrompt,
      toggleFavorite,
      togglePinned,
      incrementUsage,
      addVersion,
      transformPrompt,
      cancelTransform,
      acceptTransform,
      rejectTransform,
      clearTransformError,
      setFilter,
      setSort,
      collections,
      createCollection,
      removeCollection,
      assignCollection,
    }),
    [
      prompts,
      selectedId,
      filterState,
      sort,
      transforming,
      transformError,
      transformResult,
      filteredPrompts,
      categoryCounts,
      addPrompt,
      updatePrompt,
      removePrompt,
      toggleFavorite,
      togglePinned,
      incrementUsage,
      addVersion,
      transformPrompt,
      cancelTransform,
      acceptTransform,
      rejectTransform,
      clearTransformError,
      setFilter,
      collections,
      createCollection,
      removeCollection,
      assignCollection,
    ],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultState {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within <VaultProvider>");
  return ctx;
}
