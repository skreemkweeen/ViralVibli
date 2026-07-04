"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  assembleBrandContext,
  assembleBrandLine,
  brandCompleteness,
  brandVocabulary,
  emptyBrand,
  type BrandDNA,
} from "./brand-dna";
import {
  addColor as addColorFn,
  addTypography as addTypographyFn,
  defaultVisualLanguage,
  removeColor as removeColorFn,
  removeTypography as removeTypographyFn,
  updateVisual,
  type ColorEntry,
  type TypographyEntry,
  type VisualLanguage,
} from "./visual-language";
import { emptyPersona, updatePersona, type Persona } from "./personas";
import {
  emptyCompetitor,
  updateCompetitor,
  type Competitor,
} from "./competitors";
import {
  addPreference as addPref,
  bumpPreference as bumpPref,
  emptyMemory,
  removePreference as removePref,
  updatePreference as updatePref,
  type CreativeMemory,
  type PreferenceCategory,
  type PreferenceEntry,
} from "@/lib/vision/creative-memory";
import {
  commitBrandSnapshot,
  emptyBrandTree,
  labelBrandSnapshot,
  restoreBrand,
  type BrandTree,
} from "./brand-versions";

// ─── State contract ──────────────────────────────────────────────────────

type BrandState = {
  // Brand list
  brands: BrandDNA[];
  activeBrandId: string | null;
  activeBrand: BrandDNA | null;
  createBrand: (name?: string) => string;
  removeBrand: (id: string) => void;
  setActiveBrand: (id: string | null) => void;
  updateBrandFields: (patch: Partial<BrandDNA>) => void;

  // Visual language per brand
  visual: VisualLanguage;
  updateVisualFields: (patch: Partial<VisualLanguage>) => void;
  addBrandColor: (entry: ColorEntry) => void;
  removeBrandColor: (id: string) => void;
  addBrandType: (entry: TypographyEntry) => void;
  removeBrandType: (id: string) => void;

  // Personas + competitors per brand
  personas: Persona[];
  createPersona: (name?: string) => string;
  updatePersonaFields: (id: string, patch: Partial<Persona>) => void;
  removePersonaById: (id: string) => void;

  competitors: Competitor[];
  createCompetitor: (name?: string) => string;
  updateCompetitorFields: (id: string, patch: Partial<Competitor>) => void;
  removeCompetitorById: (id: string) => void;

  // Creator Memory — shared with Vision Studio; per brand.
  memory: CreativeMemory;
  addMemory: (
    category: PreferenceCategory,
    entry: { label: string; weight?: number; note?: string },
  ) => string;
  bumpMemory: (category: PreferenceCategory, id: string, delta?: number) => void;
  updateMemory: (
    category: PreferenceCategory,
    id: string,
    patch: Partial<PreferenceEntry>,
  ) => void;
  removeMemory: (category: PreferenceCategory, id: string) => void;

  // Version tree per brand
  versionTree: BrandTree;
  commitVersion: (label?: string, message?: string) => string;
  restoreVersion: (id: string) => void;
  labelVersion: (id: string, label: string) => void;

  // Read helpers
  brandLine: string;
  brandContext: string;
  brandCompletenessScore: number;
  brandVocab: string[];
};

// ─── Storage keys ────────────────────────────────────────────────────────

const KEY = {
  brands: "vv-brand-list",
  activeBrand: "vv-brand-active",
  visualByBrand: (id: string) => `vv-brand-visual-${id}`,
  personasByBrand: (id: string) => `vv-brand-personas-${id}`,
  competitorsByBrand: (id: string) => `vv-brand-competitors-${id}`,
  memoryByBrand: (id: string) => `vv-brand-memory-${id}`,
  treeByBrand: (id: string) => `vv-brand-tree-${id}`,
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

const BrandContext = createContext<BrandState | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brands, setBrands] = useState<BrandDNA[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [visual, setVisual] = useState<VisualLanguage>(defaultVisualLanguage());
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [memory, setMemory] = useState<CreativeMemory>(emptyMemory());
  const [versionTree, setVersionTree] = useState<BrandTree>(emptyBrandTree());
  const [hydrated, setHydrated] = useState(false);

  // Hydrate workspace-wide brand list + active id
  useEffect(() => {
    setBrands(load<BrandDNA[]>(KEY.brands, []));
    setActiveBrandId(load<string | null>(KEY.activeBrand, null));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.brands, JSON.stringify(brands));
  }, [brands, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY.activeBrand, JSON.stringify(activeBrandId));
  }, [activeBrandId, hydrated]);

  // Hydrate per-brand slices when the active brand changes
  useEffect(() => {
    if (!hydrated) return;
    if (!activeBrandId) {
      setVisual(defaultVisualLanguage());
      setPersonas([]);
      setCompetitors([]);
      setMemory(emptyMemory());
      setVersionTree(emptyBrandTree());
      return;
    }
    setVisual(load<VisualLanguage>(KEY.visualByBrand(activeBrandId), defaultVisualLanguage()));
    setPersonas(load<Persona[]>(KEY.personasByBrand(activeBrandId), []));
    setCompetitors(load<Competitor[]>(KEY.competitorsByBrand(activeBrandId), []));
    setMemory(load<CreativeMemory>(KEY.memoryByBrand(activeBrandId), emptyMemory()));
    setVersionTree(load<BrandTree>(KEY.treeByBrand(activeBrandId), emptyBrandTree()));
  }, [activeBrandId, hydrated]);

  // Persist per-brand slices
  useEffect(() => {
    if (!hydrated || !activeBrandId) return;
    try {
      localStorage.setItem(KEY.visualByBrand(activeBrandId), JSON.stringify(visual));
    } catch {
      // storage unavailable
    }
  }, [visual, activeBrandId, hydrated]);
  useEffect(() => {
    if (!hydrated || !activeBrandId) return;
    try {
      localStorage.setItem(KEY.personasByBrand(activeBrandId), JSON.stringify(personas));
    } catch {
      // storage unavailable
    }
  }, [personas, activeBrandId, hydrated]);
  useEffect(() => {
    if (!hydrated || !activeBrandId) return;
    try {
      localStorage.setItem(KEY.competitorsByBrand(activeBrandId), JSON.stringify(competitors));
    } catch {
      // storage unavailable
    }
  }, [competitors, activeBrandId, hydrated]);
  useEffect(() => {
    if (!hydrated || !activeBrandId) return;
    try {
      localStorage.setItem(KEY.memoryByBrand(activeBrandId), JSON.stringify(memory));
    } catch {
      // storage unavailable
    }
  }, [memory, activeBrandId, hydrated]);
  useEffect(() => {
    if (!hydrated || !activeBrandId) return;
    try {
      localStorage.setItem(KEY.treeByBrand(activeBrandId), JSON.stringify(versionTree));
    } catch {
      // storage unavailable
    }
  }, [versionTree, activeBrandId, hydrated]);

  // ── Brand-level actions ──
  const createBrand = useCallback((name?: string): string => {
    const id = uid("brand");
    setBrands((prev) => [...prev, { ...emptyBrand(id), name: name ?? "New brand" }]);
    setActiveBrandId(id);
    return id;
  }, []);

  const removeBrand = useCallback((id: string) => {
    setBrands((prev) => prev.filter((b) => b.id !== id));
    if (activeBrandId === id) setActiveBrandId(null);
  }, [activeBrandId]);

  const setActiveBrand = useCallback((id: string | null) => setActiveBrandId(id), []);

  const updateBrandFields = useCallback((patch: Partial<BrandDNA>) => {
    setBrands((prev) =>
      prev.map((b) =>
        b.id === activeBrandId ? { ...b, ...patch, updatedAt: Date.now() } : b,
      ),
    );
  }, [activeBrandId]);

  const activeBrand = useMemo(
    () => brands.find((b) => b.id === activeBrandId) ?? null,
    [brands, activeBrandId],
  );

  // ── Visual language ──
  const updateVisualFields = useCallback((patch: Partial<VisualLanguage>) => {
    setVisual((v) => updateVisual(v, patch));
  }, []);
  const addBrandColor = useCallback((entry: ColorEntry) => {
    setVisual((v) => addColorFn(v, entry));
  }, []);
  const removeBrandColor = useCallback((id: string) => {
    setVisual((v) => removeColorFn(v, id));
  }, []);
  const addBrandType = useCallback((entry: TypographyEntry) => {
    setVisual((v) => addTypographyFn(v, entry));
  }, []);
  const removeBrandType = useCallback((id: string) => {
    setVisual((v) => removeTypographyFn(v, id));
  }, []);

  // ── Personas ──
  const createPersona = useCallback((name?: string): string => {
    const id = uid("persona");
    setPersonas((prev) => [...prev, { ...emptyPersona(id), name: name ?? "" }]);
    return id;
  }, []);
  const updatePersonaFields = useCallback((id: string, patch: Partial<Persona>) => {
    setPersonas((prev) => prev.map((p) => (p.id === id ? updatePersona(p, patch) : p)));
  }, []);
  const removePersonaById = useCallback((id: string) => {
    setPersonas((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── Competitors ──
  const createCompetitor = useCallback((name?: string): string => {
    const id = uid("comp");
    setCompetitors((prev) => [...prev, { ...emptyCompetitor(id), brand: name ?? "" }]);
    return id;
  }, []);
  const updateCompetitorFields = useCallback((id: string, patch: Partial<Competitor>) => {
    setCompetitors((prev) => prev.map((c) => (c.id === id ? updateCompetitor(c, patch) : c)));
  }, []);
  const removeCompetitorById = useCallback((id: string) => {
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ── Memory ──
  const addMemory = useCallback(
    (category: PreferenceCategory, entry: { label: string; weight?: number; note?: string }): string => {
      const id = uid("mem");
      setMemory((m) => addPref(m, category, { id, label: entry.label, weight: entry.weight ?? 60, note: entry.note }));
      return id;
    },
    [],
  );
  const bumpMemory = useCallback((category: PreferenceCategory, id: string, delta = 5) => {
    setMemory((m) => bumpPref(m, category, id, delta));
  }, []);
  const updateMemory = useCallback(
    (category: PreferenceCategory, id: string, patch: Partial<PreferenceEntry>) => {
      setMemory((m) => updatePref(m, category, id, patch));
    },
    [],
  );
  const removeMemory = useCallback((category: PreferenceCategory, id: string) => {
    setMemory((m) => removePref(m, category, id));
  }, []);

  // ── Version tree ──
  const commitVersion = useCallback((label?: string, message?: string): string => {
    const id = uid("ver");
    if (activeBrand) {
      setVersionTree((t) =>
        commitBrandSnapshot(t, {
          id,
          dna: activeBrand,
          visual,
          label,
          message,
        }),
      );
    }
    return id;
  }, [activeBrand, visual]);
  const restoreVersion = useCallback((id: string) => {
    setVersionTree((t) => {
      const next = restoreBrand(t, id);
      const snap = next.snapshots.find((s) => s.id === id);
      if (snap) {
        setBrands((prev) => prev.map((b) => (b.id === snap.dna.id ? snap.dna : b)));
        setVisual(snap.visual);
      }
      return next;
    });
  }, []);
  const labelVersion = useCallback((id: string, label: string) => {
    setVersionTree((t) => labelBrandSnapshot(t, id, label));
  }, []);

  // ── Derived reads ──
  const brandLine = useMemo(() => (activeBrand ? assembleBrandLine(activeBrand) : ""), [activeBrand]);
  const brandContext = useMemo(
    () => (activeBrand ? assembleBrandContext(activeBrand) : ""),
    [activeBrand],
  );
  const brandCompletenessScore = useMemo(
    () => (activeBrand ? brandCompleteness(activeBrand) : 0),
    [activeBrand],
  );
  const brandVocab = useMemo(
    () => (activeBrand ? brandVocabulary(activeBrand) : []),
    [activeBrand],
  );

  const value = useMemo<BrandState>(
    () => ({
      brands,
      activeBrandId,
      activeBrand,
      createBrand,
      removeBrand,
      setActiveBrand,
      updateBrandFields,
      visual,
      updateVisualFields,
      addBrandColor,
      removeBrandColor,
      addBrandType,
      removeBrandType,
      personas,
      createPersona,
      updatePersonaFields,
      removePersonaById,
      competitors,
      createCompetitor,
      updateCompetitorFields,
      removeCompetitorById,
      memory,
      addMemory,
      bumpMemory,
      updateMemory,
      removeMemory,
      versionTree,
      commitVersion,
      restoreVersion,
      labelVersion,
      brandLine,
      brandContext,
      brandCompletenessScore,
      brandVocab,
    }),
    [
      brands,
      activeBrandId,
      activeBrand,
      createBrand,
      removeBrand,
      setActiveBrand,
      updateBrandFields,
      visual,
      updateVisualFields,
      addBrandColor,
      removeBrandColor,
      addBrandType,
      removeBrandType,
      personas,
      createPersona,
      updatePersonaFields,
      removePersonaById,
      competitors,
      createCompetitor,
      updateCompetitorFields,
      removeCompetitorById,
      memory,
      addMemory,
      bumpMemory,
      updateMemory,
      removeMemory,
      versionTree,
      commitVersion,
      restoreVersion,
      labelVersion,
      brandLine,
      brandContext,
      brandCompletenessScore,
      brandVocab,
    ],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandState {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used within <BrandProvider>");
  return ctx;
}

/**
 * useActiveBrand — thin read-only convenience hook that other studios
 * (Vision, Story, AI Dock, Command Palette) consume to auto-adopt the
 * active brand's identity. Returns null when no brand is active.
 */
export function useActiveBrand(): {
  brand: BrandDNA | null;
  visual: VisualLanguage;
  brandLine: string;
  brandContext: string;
  vocabulary: string[];
  completeness: number;
} {
  const s = useBrand();
  return {
    brand: s.activeBrand,
    visual: s.visual,
    brandLine: s.brandLine,
    brandContext: s.brandContext,
    vocabulary: s.brandVocab,
    completeness: s.brandCompletenessScore,
  };
}
