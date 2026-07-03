/**
 * Shot List engine — the atomic unit of Vision Studio's campaign workflow.
 *
 * A Shot is a self-contained plan: prompt, direction (camera + composition),
 * lighting rig, references, version history, generation status, and
 * approval status. Every shot type carries sensible defaults that reflect
 * how that shot is typically framed and lit in real production.
 *
 * Pure — no React, no side effects. The Vision store owns persistence.
 */

import { emptyLightingSetup, type LightingSetup } from "./lighting";
import { assemblePrompt, emptyDirection, type Direction } from "./prompt";

// ─── Types ────────────────────────────────────────────────────────────────

export type ShotType =
  | "hero"
  | "lifestyle"
  | "studio"
  | "flat-lay"
  | "macro"
  | "detail"
  | "packaging"
  | "ugc"
  | "thumbnail"
  | "banner"
  | "pinterest"
  | "instagram"
  | "tiktok"
  | "email"
  | "website"
  | "paid-ads";

export type ShotStatus = "idle" | "queued" | "running" | "done" | "failed";
export type ShotApproval = "draft" | "in-review" | "approved" | "rejected";

export type ShotReferenceKind = "image" | "url" | "note";

export type ShotReference = {
  id: string;
  kind: ShotReferenceKind;
  label: string;
  url?: string;
  note?: string;
  createdAt: number;
};

export type ShotVersion = {
  id: string;
  prompt: string;
  direction: Direction;
  lighting: LightingSetup;
  createdAt: number;
  label?: string;
  note?: string;
};

export type Shot = {
  id: string;
  type: ShotType;
  name: string;
  prompt: string;
  direction: Direction;
  lighting: LightingSetup;
  references: ShotReference[];
  history: ShotVersion[];
  status: ShotStatus;
  approval: ShotApproval;
  createdAt: number;
  updatedAt: number;
  /** Campaign this shot belongs to (undefined for stand-alone shots) */
  campaignId?: string;
  /** Free-text notes attached to the shot itself (not a version) */
  notes?: string;
};

// ─── Catalog: what each shot type actually means in production ───────────

export type ShotTypeSpec = {
  id: ShotType;
  label: string;
  group: "editorial" | "product" | "creator" | "platform" | "commerce";
  hint: string;
  aspect: string;
  composition: string;
  lens: string;
  aperture: string;
  style?: string;
  lightingPreset?: "three-point" | "natural-window" | "rembrandt" | "split" | "high-key" | "low-key";
};

export const SHOT_TYPE_SPECS: ShotTypeSpec[] = [
  {
    id: "hero",
    label: "Hero",
    group: "editorial",
    hint: "Signature frame — the campaign's defining image",
    aspect: "4-5",
    composition: "negative",
    lens: "85",
    aperture: "2.8",
    style: "editorial",
    lightingPreset: "three-point",
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    group: "editorial",
    hint: "In-use, environmental, human scale",
    aspect: "4-5",
    composition: "thirds",
    lens: "35",
    aperture: "2.8",
    style: "lifestyle",
    lightingPreset: "natural-window",
  },
  {
    id: "studio",
    label: "Studio",
    group: "product",
    hint: "Clean, controlled backdrop, no distractions",
    aspect: "1-1",
    composition: "centered",
    lens: "85",
    aperture: "5.6",
    style: "minimal",
    lightingPreset: "three-point",
  },
  {
    id: "flat-lay",
    label: "Flat lay",
    group: "product",
    hint: "Overhead arrangement, editorial styling",
    aspect: "1-1",
    composition: "overhead",
    lens: "50",
    aperture: "5.6",
    style: "editorial",
    lightingPreset: "natural-window",
  },
  {
    id: "macro",
    label: "Macro",
    group: "product",
    hint: "Extreme close-up on material and craft",
    aspect: "1-1",
    composition: "closeup",
    lens: "100",
    aperture: "5.6",
    style: "macro",
    lightingPreset: "rembrandt",
  },
  {
    id: "detail",
    label: "Detail",
    group: "product",
    hint: "Isolated material or texture story",
    aspect: "4-5",
    composition: "negative",
    lens: "85",
    aperture: "2.8",
    lightingPreset: "natural-window",
  },
  {
    id: "packaging",
    label: "Packaging",
    group: "commerce",
    hint: "Product-forward e-commerce study",
    aspect: "1-1",
    composition: "centered",
    lens: "50",
    aperture: "8",
    style: "minimal",
    lightingPreset: "high-key",
  },
  {
    id: "ugc",
    label: "UGC",
    group: "creator",
    hint: "Handheld, authentic, creator-perspective",
    aspect: "9-16",
    composition: "handheld",
    lens: "24",
    aperture: "1.8",
    style: "candid",
    lightingPreset: "natural-window",
  },
  {
    id: "thumbnail",
    label: "Thumbnail",
    group: "platform",
    hint: "High-contrast, expression-forward, glanceable",
    aspect: "16-9",
    composition: "centered",
    lens: "50",
    aperture: "2.8",
    style: "editorial",
    lightingPreset: "three-point",
  },
  {
    id: "banner",
    label: "Banner",
    group: "platform",
    hint: "Wide horizontal hero for hero units + email",
    aspect: "16-9",
    composition: "thirds",
    lens: "35",
    aperture: "4",
    style: "editorial",
    lightingPreset: "three-point",
  },
  {
    id: "pinterest",
    label: "Pinterest",
    group: "platform",
    hint: "Tall aesthetic frame optimized for pins",
    aspect: "2-3",
    composition: "vertical",
    lens: "50",
    aperture: "2.8",
    style: "editorial",
    lightingPreset: "natural-window",
  },
  {
    id: "instagram",
    label: "Instagram",
    group: "platform",
    hint: "Feed-first square, moodboard-worthy",
    aspect: "1-1",
    composition: "centered",
    lens: "50",
    aperture: "2.8",
    style: "editorial",
    lightingPreset: "natural-window",
  },
  {
    id: "tiktok",
    label: "TikTok",
    group: "platform",
    hint: "Vertical, energetic, first-frame ready",
    aspect: "9-16",
    composition: "thirds",
    lens: "24",
    aperture: "2.8",
    style: "candid",
    lightingPreset: "high-key",
  },
  {
    id: "email",
    label: "Email",
    group: "platform",
    hint: "Wide banner sized for inbox previews",
    aspect: "16-9",
    composition: "thirds",
    lens: "50",
    aperture: "4",
    style: "editorial",
    lightingPreset: "natural-window",
  },
  {
    id: "website",
    label: "Website",
    group: "platform",
    hint: "Hero unit for above-the-fold web",
    aspect: "16-9",
    composition: "negative",
    lens: "35",
    aperture: "2.8",
    style: "editorial",
    lightingPreset: "three-point",
  },
  {
    id: "paid-ads",
    label: "Paid ads",
    group: "platform",
    hint: "Punchy, product-forward, thumb-stopping",
    aspect: "1-1",
    composition: "centered",
    lens: "85",
    aperture: "2.8",
    style: "commercial",
    lightingPreset: "three-point",
  },
];

const SPEC_INDEX: Record<ShotType, ShotTypeSpec> = SHOT_TYPE_SPECS.reduce(
  (acc, spec) => {
    acc[spec.id] = spec;
    return acc;
  },
  {} as Record<ShotType, ShotTypeSpec>,
);

export function shotSpec(type: ShotType): ShotTypeSpec {
  return SPEC_INDEX[type];
}

// ─── Factories ────────────────────────────────────────────────────────────

/**
 * Direction tuned to how the given shot type is usually framed. Falls back
 * to the caller's baseline direction so an existing subject/mood carries
 * over instead of being reset.
 */
export function shotDirection(type: ShotType, base: Direction = emptyDirection): Direction {
  const spec = SPEC_INDEX[type];
  return {
    ...base,
    aspect: spec.aspect,
    composition: spec.composition,
    lens: spec.lens,
    aperture: spec.aperture,
    style: spec.style ?? base.style,
  };
}

export function newShot(
  id: string,
  type: ShotType,
  baseDirection: Direction = emptyDirection,
  lighting: LightingSetup = emptyLightingSetup(),
  now: number = Date.now(),
): Shot {
  const direction = shotDirection(type, baseDirection);
  const prompt = assemblePrompt(direction);
  return {
    id,
    type,
    name: SPEC_INDEX[type].label,
    prompt,
    direction,
    lighting,
    references: [],
    history: [],
    status: "idle",
    approval: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Version history ──────────────────────────────────────────────────────

export function snapshotVersion(
  id: string,
  shot: Shot,
  label?: string,
  note?: string,
  now: number = Date.now(),
): ShotVersion {
  return {
    id,
    prompt: shot.prompt,
    direction: shot.direction,
    lighting: shot.lighting,
    createdAt: now,
    label,
    note,
  };
}

export function pushVersion(shot: Shot, version: ShotVersion): Shot {
  return {
    ...shot,
    history: [version, ...shot.history].slice(0, 25),
    updatedAt: version.createdAt,
  };
}

export function restoreVersion(shot: Shot, versionId: string): Shot {
  const v = shot.history.find((h) => h.id === versionId);
  if (!v) return shot;
  return {
    ...shot,
    prompt: v.prompt,
    direction: v.direction,
    lighting: v.lighting,
    updatedAt: Date.now(),
  };
}

// ─── Mutation helpers ─────────────────────────────────────────────────────

export function updateShotDirection(shot: Shot, patch: Partial<Direction>): Shot {
  const direction = { ...shot.direction, ...patch };
  return {
    ...shot,
    direction,
    prompt: assemblePrompt(direction),
    updatedAt: Date.now(),
  };
}

export function setShotStatus(shot: Shot, status: ShotStatus): Shot {
  return { ...shot, status, updatedAt: Date.now() };
}

export function setShotApproval(shot: Shot, approval: ShotApproval): Shot {
  return { ...shot, approval, updatedAt: Date.now() };
}

export function addShotReference(shot: Shot, ref: ShotReference): Shot {
  return {
    ...shot,
    references: [ref, ...shot.references],
    updatedAt: Date.now(),
  };
}

export function removeShotReference(shot: Shot, referenceId: string): Shot {
  return {
    ...shot,
    references: shot.references.filter((r) => r.id !== referenceId),
    updatedAt: Date.now(),
  };
}

// ─── Aggregate helpers ────────────────────────────────────────────────────

export function shotsByCampaign(shots: Shot[], campaignId: string): Shot[] {
  return shots.filter((s) => s.campaignId === campaignId);
}

export function shotStatusSummary(shots: Shot[]) {
  const summary: Record<ShotStatus, number> = {
    idle: 0,
    queued: 0,
    running: 0,
    done: 0,
    failed: 0,
  };
  for (const s of shots) summary[s.status] += 1;
  return summary;
}

export function shotApprovalSummary(shots: Shot[]) {
  const summary: Record<ShotApproval, number> = {
    draft: 0,
    "in-review": 0,
    approved: 0,
    rejected: 0,
  };
  for (const s of shots) summary[s.approval] += 1;
  return summary;
}
