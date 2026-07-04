/**
 * Creative Memory — an explicit, editable record of the creator's own
 * preferences. Nothing is inferred silently: every entry is created by a
 * deliberate user action (starring / saving / bumping a preference) and
 * every entry can be edited or removed.
 *
 * Categories (per the Pass B.8 spec):
 *   preferredCameras / preferredLenses / preferredLightingStyles /
 *   preferredColorPalettes / preferredCompositions / preferredAesthetics
 *   / brandInspirations / preferredExportFormats
 *
 * A category is just a bag of PreferenceEntry items ordered by their
 * relative weight (0-100). Higher weight = stronger preference. The
 * engine returns the top-K for a category, and helpers for the UI to
 * bump / demote / rename / remove.
 */

export type PreferenceCategory =
  | "cameras"
  | "lenses"
  | "lightingStyles"
  | "colorPalettes"
  | "compositions"
  | "aesthetics"
  | "brandInspirations"
  | "exportFormats";

export type PreferenceEntry = {
  id: string;
  label: string;
  /** 0-100. Higher = stronger preference. */
  weight: number;
  note?: string;
  createdAt: number;
  updatedAt: number;
};

export type CreativeMemory = Record<PreferenceCategory, PreferenceEntry[]>;

export const emptyMemory = (): CreativeMemory => ({
  cameras: [],
  lenses: [],
  lightingStyles: [],
  colorPalettes: [],
  compositions: [],
  aesthetics: [],
  brandInspirations: [],
  exportFormats: [],
});

// ─── Mutations ────────────────────────────────────────────────────────────

export function addPreference(
  memory: CreativeMemory,
  category: PreferenceCategory,
  entry: Omit<PreferenceEntry, "createdAt" | "updatedAt"> & {
    createdAt?: number;
  },
): CreativeMemory {
  const now = entry.createdAt ?? Date.now();
  const existing = memory[category].find((e) => e.id === entry.id);
  if (existing) {
    // Bumping an existing entry: raise its weight, refresh updatedAt.
    return updatePreference(memory, category, entry.id, {
      weight: Math.min(100, existing.weight + 5),
      updatedAt: now,
    });
  }
  const next: PreferenceEntry = {
    id: entry.id,
    label: entry.label,
    weight: entry.weight,
    note: entry.note,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...memory,
    [category]: [...memory[category], next].sort((a, b) => b.weight - a.weight),
  };
}

export function removePreference(
  memory: CreativeMemory,
  category: PreferenceCategory,
  id: string,
): CreativeMemory {
  return {
    ...memory,
    [category]: memory[category].filter((e) => e.id !== id),
  };
}

export function updatePreference(
  memory: CreativeMemory,
  category: PreferenceCategory,
  id: string,
  patch: Partial<Omit<PreferenceEntry, "id" | "createdAt">>,
): CreativeMemory {
  const now = Date.now();
  return {
    ...memory,
    [category]: memory[category]
      .map((e) =>
        e.id === id
          ? {
              ...e,
              ...patch,
              weight:
                patch.weight !== undefined
                  ? Math.max(0, Math.min(100, patch.weight))
                  : e.weight,
              updatedAt: patch.updatedAt ?? now,
            }
          : e,
      )
      .sort((a, b) => b.weight - a.weight),
  };
}

export function bumpPreference(
  memory: CreativeMemory,
  category: PreferenceCategory,
  id: string,
  delta: number = 5,
): CreativeMemory {
  const entry = memory[category].find((e) => e.id === id);
  if (!entry) return memory;
  return updatePreference(memory, category, id, {
    weight: entry.weight + delta,
  });
}

// ─── Read ─────────────────────────────────────────────────────────────────

export function topPreferences(
  memory: CreativeMemory,
  category: PreferenceCategory,
  k: number = 5,
): PreferenceEntry[] {
  return memory[category].slice(0, Math.max(0, k));
}

export function findPreference(
  memory: CreativeMemory,
  category: PreferenceCategory,
  id: string,
): PreferenceEntry | undefined {
  return memory[category].find((e) => e.id === id);
}

export function categorySize(
  memory: CreativeMemory,
  category: PreferenceCategory,
): number {
  return memory[category].length;
}

export function totalPreferences(memory: CreativeMemory): number {
  return (Object.keys(memory) as PreferenceCategory[]).reduce(
    (n, c) => n + memory[c].length,
    0,
  );
}

// ─── Category catalogue for the UI ────────────────────────────────────────

export const CATEGORY_META: Record<
  PreferenceCategory,
  { label: string; hint: string; placeholder: string }
> = {
  cameras: {
    label: "Cameras",
    hint: "Bodies you reach for first",
    placeholder: "Hasselblad X2D",
  },
  lenses: {
    label: "Lenses",
    hint: "Focal lengths you shoot on",
    placeholder: "50mm f/1.4",
  },
  lightingStyles: {
    label: "Lighting",
    hint: "Rigs you keep coming back to",
    placeholder: "Rembrandt with a bounce card",
  },
  colorPalettes: {
    label: "Palettes",
    hint: "Colour worlds you gravitate to",
    placeholder: "Warm neutrals · #a08066 #eee",
  },
  compositions: {
    label: "Compositions",
    hint: "Framings you trust",
    placeholder: "Overhead flat lay on stone",
  },
  aesthetics: {
    label: "Aesthetics",
    hint: "Vibes / genres / worlds",
    placeholder: "Quiet luxury, editorial minimalism",
  },
  brandInspirations: {
    label: "Brand inspirations",
    hint: "Brands whose visual language you steal from",
    placeholder: "Aesop, Le Labo, Byredo",
  },
  exportFormats: {
    label: "Export formats",
    hint: "Formats you prefer for handoff",
    placeholder: "Markdown campaign package",
  },
};
