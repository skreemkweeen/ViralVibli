/**
 * Project Intelligence — deterministic heuristics that make a Project feel
 * alive without any AI round-trip.
 *
 * Given a Project + its persisted studio slices (stories, images, prompts,
 * moodboard, activity), this module computes:
 *
 *   - completion:  0..100 progress toward a baseline "shippable" project
 *   - score:       0..100 creative-quality composite
 *   - momentum:    trend of activity over the last two weeks
 *   - missing:     asset gaps the creator hasn't filled yet
 *   - unused:      assets that were made but never referenced
 *   - reuse:       pairs of prompts (or images) with high overlap
 *   - duplicates:  prompt pairs that appear near-identical
 *   - dependencies: which assets appear to reference which (moodboard→image, image→story)
 *   - nextStep:    one concrete "do this next" sentence, rule-picked
 *   - recommendations: 0..N short contextual observations
 *
 * All outputs are pure functions of the inputs so this can drive the
 * Project Workspace, the AI Dock system prompt, and future palette
 * commands without desync.
 *
 * The heuristics are intentionally simple + local — no ML — so a creator
 * can predict why the app is saying what it's saying.
 */

import type { Project } from "@/lib/workspace/types";

// ─── Types ───────────────────────────────────────────────────────────

export type ProjectSourcesInput = {
  stories?: Array<{
    id: string;
    title?: string;
    brief?: string;
    createdAt?: number;
    projectId?: string;
    slides?: Array<{ title?: string; caption?: string }>;
  }>;
  images?: Array<{
    id: string;
    title?: string;
    brief?: string;
    createdAt?: number;
    projectId?: string;
    imageUrl?: string;
  }>;
  prompts?: Array<{
    id: string;
    title: string;
    content?: string;
    createdAt?: number;
    projectId?: string;
    usageCount?: number;
    tags?: string[];
  }>;
  moodboard?: Array<{
    id: string;
    title?: string;
    note?: string;
    createdAt?: number;
    projectId?: string;
  }>;
  activity?: Array<{
    id: string;
    title: string;
    createdAt?: number;
    projectId?: string;
    type?: string;
  }>;
};

export type MissingKind = "story" | "image" | "prompt" | "moodboard" | "note";

export type Missing = {
  kind: MissingKind;
  count: number;
  message: string;
};

export type ReusePair = {
  aId: string;
  bId: string;
  aTitle: string;
  bTitle: string;
  overlap: number; // 0..1
};

export type Dependency = {
  from: { kind: "moodboard" | "prompt" | "image"; id: string; label: string };
  to: { kind: "image" | "story"; id: string; label: string };
  reason: string;
};

export type Recommendation = {
  id: string;
  severity: "info" | "opportunity" | "warning";
  headline: string;
  detail?: string;
  /** Optional AI Dock prefill the UI can offer as a one-click follow-up. */
  aiPrompt?: string;
};

export type Momentum = {
  /** Activity events in the last 7 days scoped to this project. */
  recent: number;
  /** Activity events in the 7 days before that. */
  prior: number;
  /** "up" when recent > prior, "steady" when within 20%, "down" when lower. */
  trend: "up" | "steady" | "down";
};

export type ProjectHealth = {
  completion: number; // 0..100
  score: number; // 0..100
  momentum: Momentum;
  missing: Missing[];
  unused: {
    prompts: Array<{ id: string; title: string }>;
    images: Array<{ id: string; title: string }>;
  };
  reuse: ReusePair[];
  duplicates: ReusePair[];
  dependencies: Dependency[];
  nextStep: string;
  recommendations: Recommendation[];
};

// ─── Baseline: what makes a project "shippable" ─────────────────────

const BASELINE = {
  story: 1,
  image: 3,
  prompt: 3,
  moodboard: 2,
  note: 1,
} as const;

// Weights for the completion composite; sum to 1.
const WEIGHTS = {
  story: 0.25,
  image: 0.3,
  prompt: 0.2,
  moodboard: 0.15,
  note: 0.1,
} as const;

const DAY = 24 * 60 * 60 * 1000;

// ─── Helpers ─────────────────────────────────────────────────────────

function scopeToProject<T extends { projectId?: string }>(
  items: T[] | undefined,
  projectId: string,
): T[] {
  if (!items || items.length === 0) return [];
  // If any items are tagged for this project, filter strictly; otherwise the
  // whole list belongs (legacy data path).
  const strict = items.some((i) => i.projectId === projectId);
  return items.filter((i) =>
    strict ? i.projectId === projectId : true,
  );
}

function normalizeTokens(text: string): Set<string> {
  const raw = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = raw
    .split(/\s+/)
    .filter((t) => t.length >= 3);
  // Common noise words we don't want to drive similarity.
  const stop = new Set([
    "the", "and", "for", "with", "your", "our", "this", "that", "into",
    "from", "then", "when", "into", "will", "make", "made", "just",
  ]);
  return new Set(tokens.filter((t) => !stop.has(t)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

// ─── Public entry ────────────────────────────────────────────────────

export function computeProjectHealth(
  project: Project,
  sources: ProjectSourcesInput,
  now: number = Date.now(),
): ProjectHealth {
  const stories = scopeToProject(sources.stories, project.id);
  const images = scopeToProject(sources.images, project.id);
  const prompts = scopeToProject(sources.prompts, project.id);
  const moodboard = scopeToProject(sources.moodboard, project.id);
  const notes = project.notes ?? [];
  const activity = (sources.activity ?? []).filter(
    (a) => !a.projectId || a.projectId === project.id,
  );

  // ── Completion ──
  const partials = {
    story: Math.min(1, stories.length / BASELINE.story),
    image: Math.min(1, images.length / BASELINE.image),
    prompt: Math.min(1, prompts.length / BASELINE.prompt),
    moodboard: Math.min(1, moodboard.length / BASELINE.moodboard),
    note: Math.min(1, notes.length / BASELINE.note),
  };
  const completion = Math.round(
    (partials.story * WEIGHTS.story +
      partials.image * WEIGHTS.image +
      partials.prompt * WEIGHTS.prompt +
      partials.moodboard * WEIGHTS.moodboard +
      partials.note * WEIGHTS.note) *
      100,
  );

  // ── Score ── composite of completion + variety + momentum + freshness
  const varietyCount =
    [stories, images, prompts, moodboard, notes].filter(
      (arr) => arr.length > 0,
    ).length;
  const varietyScore = (varietyCount / 5) * 100; // 0..100

  const recentWindow = 7 * DAY;
  const priorWindow = 14 * DAY;
  const recentActs = activity.filter(
    (a) => a.createdAt && a.createdAt >= now - recentWindow,
  ).length;
  const priorActs = activity.filter(
    (a) =>
      a.createdAt &&
      a.createdAt >= now - priorWindow &&
      a.createdAt < now - recentWindow,
  ).length;
  const momentum: Momentum = {
    recent: recentActs,
    prior: priorActs,
    trend:
      recentActs > priorActs * 1.2
        ? "up"
        : recentActs < priorActs * 0.8
          ? "down"
          : "steady",
  };
  // Cap momentum contribution so it never overwhelms the score.
  const momentumScore = Math.min(100, recentActs * 15);

  // Freshness: was there any activity this week?
  const freshness = recentActs > 0 ? 100 : Math.max(0, 60 - Math.floor((now - project.updatedAt) / DAY) * 5);

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        completion * 0.4 +
          varietyScore * 0.25 +
          momentumScore * 0.2 +
          freshness * 0.15,
      ),
    ),
  );

  // ── Missing ──
  const missing: Missing[] = [];
  const missingSpec: Array<[MissingKind, number, number, string]> = [
    ["story", stories.length, BASELINE.story, "story"],
    ["image", images.length, BASELINE.image, "image"],
    ["prompt", prompts.length, BASELINE.prompt, "prompt"],
    ["moodboard", moodboard.length, BASELINE.moodboard, "moodboard reference"],
    ["note", notes.length, BASELINE.note, "note"],
  ];
  for (const [kind, actual, target, singular] of missingSpec) {
    const gap = target - actual;
    if (gap > 0) {
      missing.push({
        kind,
        count: gap,
        message:
          gap === 1
            ? `Add ${gap} ${singular}`
            : `Add ${gap} ${singular}s`,
      });
    }
  }

  // ── Unused assets ── prompts never used, images without a linked story
  const usedInBriefs = new Set<string>();
  for (const s of stories) {
    if (s.brief) {
      const toks = normalizeTokens(s.brief);
      toks.forEach((t) => usedInBriefs.add(t));
    }
  }
  for (const i of images) {
    if (i.brief) {
      const toks = normalizeTokens(i.brief);
      toks.forEach((t) => usedInBriefs.add(t));
    }
  }
  const unusedPrompts = prompts
    .filter((p) => {
      if ((p.usageCount ?? 0) > 0) return false;
      // Also skip if the prompt title tokens appear in any story/image brief
      const t = normalizeTokens(p.title);
      for (const tok of t) if (usedInBriefs.has(tok)) return false;
      return true;
    })
    .map((p) => ({ id: p.id, title: p.title }));
  const unusedImages = images
    .filter((i) => {
      const brief = (i.brief ?? "").toLowerCase();
      if (!brief) return false;
      // Image is "unused" if no story mentions any of its brief tokens
      const briefTokens = normalizeTokens(brief);
      for (const s of stories) {
        const sTokens = normalizeTokens(s.brief ?? "");
        for (const tok of briefTokens) if (sTokens.has(tok)) return false;
      }
      return true;
    })
    .map((i) => ({ id: i.id, title: i.title ?? "Image" }));

  // ── Reuse opportunities: prompts with high content similarity ──
  const reuse: ReusePair[] = [];
  const duplicates: ReusePair[] = [];
  const promptTokenCache = new Map<string, Set<string>>();
  for (const p of prompts) {
    promptTokenCache.set(
      p.id,
      normalizeTokens(`${p.title} ${p.content ?? ""}`),
    );
  }
  for (let i = 0; i < prompts.length; i++) {
    for (let j = i + 1; j < prompts.length; j++) {
      const a = prompts[i];
      const b = prompts[j];
      const overlap = jaccard(
        promptTokenCache.get(a.id) ?? new Set(),
        promptTokenCache.get(b.id) ?? new Set(),
      );
      if (overlap >= 0.65) {
        duplicates.push({
          aId: a.id,
          bId: b.id,
          aTitle: a.title,
          bTitle: b.title,
          overlap,
        });
      } else if (overlap >= 0.35) {
        reuse.push({
          aId: a.id,
          bId: b.id,
          aTitle: a.title,
          bTitle: b.title,
          overlap,
        });
      }
    }
  }
  reuse.sort((a, b) => b.overlap - a.overlap);
  duplicates.sort((a, b) => b.overlap - a.overlap);

  // ── Dependencies: moodboard → image (image brief mentions moodboard title
  //    tokens), image → story (story brief mentions image brief tokens)
  const dependencies: Dependency[] = [];
  for (const m of moodboard) {
    const mTokens = normalizeTokens(`${m.title ?? ""} ${m.note ?? ""}`);
    for (const im of images) {
      const iTokens = normalizeTokens(`${im.brief ?? ""} ${im.title ?? ""}`);
      let hits = 0;
      for (const t of mTokens) if (iTokens.has(t)) hits++;
      if (hits >= 2) {
        dependencies.push({
          from: { kind: "moodboard", id: m.id, label: m.title ?? "Reference" },
          to: { kind: "image", id: im.id, label: im.title ?? "Image" },
          reason: `Shared visual language`,
        });
        break; // one link per moodboard is enough for the summary
      }
    }
  }
  for (const im of images) {
    const iTokens = normalizeTokens(`${im.brief ?? ""} ${im.title ?? ""}`);
    for (const s of stories) {
      const sTokens = normalizeTokens(`${s.brief ?? ""}`);
      let hits = 0;
      for (const t of iTokens) if (sTokens.has(t)) hits++;
      if (hits >= 2) {
        dependencies.push({
          from: { kind: "image", id: im.id, label: im.title ?? "Image" },
          to: { kind: "story", id: s.id, label: s.brief?.slice(0, 40) ?? "Story" },
          reason: `Story references this shot`,
        });
        break;
      }
    }
  }

  // ── Next suggested step ── rule-picked; earliest matching rule wins
  const nextStep = pickNextStep({
    stories,
    images,
    prompts,
    moodboard,
    notes,
    momentum,
    unusedPrompts,
    unusedImages,
    duplicates,
    completion,
    projectName: project.name,
  });

  // ── Recommendations ── surface up to 5 contextual observations
  const recommendations: Recommendation[] = [];
  if (completion >= 100) {
    recommendations.push({
      id: "shippable",
      severity: "info",
      headline: `${project.name} is shippable`,
      detail: "All baseline deliverables are covered. Ready to ship — or push variants.",
      aiPrompt: `The project “${project.name}” has hit its baseline. Suggest 3 concrete ways to push it further before shipping.`,
    });
  }
  if (momentum.trend === "down" && momentum.prior > 0) {
    recommendations.push({
      id: "momentum-drop",
      severity: "warning",
      headline: "Momentum has cooled",
      detail: `You made ${momentum.prior} assets last week and ${momentum.recent} this week. Restart with the smallest possible next asset.`,
      aiPrompt: `Momentum in “${project.name}” dropped from ${momentum.prior} to ${momentum.recent} assets week over week. Suggest the fastest low-friction next thing to make.`,
    });
  } else if (momentum.trend === "up") {
    recommendations.push({
      id: "momentum-up",
      severity: "info",
      headline: "You're on a roll",
      detail: `Activity is up week over week (${momentum.prior} → ${momentum.recent}). Ride it — batch the next 2 similar assets.`,
    });
  }
  if (duplicates.length > 0) {
    const first = duplicates[0];
    recommendations.push({
      id: "duplicates",
      severity: "warning",
      headline: `${duplicates.length === 1 ? "1 duplicate prompt" : `${duplicates.length} duplicate prompt pairs`} in the Vault`,
      detail: `“${first.aTitle}” and “${first.bTitle}” overlap ${Math.round(first.overlap * 100)}%. Merge them so the AI answers with one intent.`,
      aiPrompt: `Compare these two prompts and merge them into one canonical prompt:\n1) ${first.aTitle}\n2) ${first.bTitle}`,
    });
  }
  if (reuse.length > 0 && duplicates.length === 0) {
    const first = reuse[0];
    recommendations.push({
      id: "reuse",
      severity: "opportunity",
      headline: "Prompt reuse opportunity",
      detail: `“${first.aTitle}” and “${first.bTitle}” share ${Math.round(first.overlap * 100)}% of tokens. Consider a shared block.`,
    });
  }
  if (unusedPrompts.length >= 2) {
    recommendations.push({
      id: "unused-prompts",
      severity: "opportunity",
      headline: `${unusedPrompts.length} unused prompts`,
      detail: `These prompts haven't been referenced yet: ${unusedPrompts.slice(0, 3).map((p) => `“${p.title}”`).join(", ")}. Try one in the next asset.`,
    });
  }
  if (unusedImages.length >= 1) {
    recommendations.push({
      id: "unused-images",
      severity: "opportunity",
      headline: `${unusedImages.length} images without a story`,
      detail: `Wrap a caption around them — “${unusedImages[0].title}” is a strong start.`,
      aiPrompt: `Draft a hook + caption sequence for the image “${unusedImages[0].title}”. Keep it under 5 lines.`,
    });
  }
  for (const m of missing) {
    if (recommendations.length >= 5) break;
    recommendations.push({
      id: `missing-${m.kind}`,
      severity: "opportunity",
      headline: m.message,
      detail:
        m.kind === "note"
          ? "Notes capture the why — future you will thank you."
          : `Round out the baseline so the project reads as complete.`,
    });
  }
  const capped = recommendations.slice(0, 5);

  return {
    completion,
    score,
    momentum,
    missing,
    unused: { prompts: unusedPrompts, images: unusedImages },
    reuse,
    duplicates,
    dependencies,
    nextStep,
    recommendations: capped,
  };
}

// ─── Rule-picked "next step" ─────────────────────────────────────────

type PickNextStepInput = {
  stories: unknown[];
  images: unknown[];
  prompts: unknown[];
  moodboard: unknown[];
  notes: unknown[];
  momentum: Momentum;
  unusedPrompts: Array<{ id: string; title: string }>;
  unusedImages: Array<{ id: string; title: string }>;
  duplicates: ReusePair[];
  completion: number;
  projectName: string;
};

function pickNextStep(x: PickNextStepInput): string {
  const {
    stories,
    images,
    prompts,
    moodboard,
    notes,
    unusedPrompts,
    unusedImages,
    duplicates,
    completion,
    projectName,
  } = x;

  if (completion >= 100 && duplicates.length === 0) {
    return `Ship “${projectName}” — the baseline is covered. Consider one variant asset for retargeting.`;
  }
  if (moodboard.length === 0 && images.length === 0) {
    return "Pin one reference to the moodboard so the visual direction has a north star.";
  }
  if (moodboard.length > 0 && images.length === 0) {
    return "Compose your first image — the moodboard is ready to guide it.";
  }
  if (images.length > 0 && prompts.length === 0) {
    return "Save the prompt for that image to the Vault — it becomes reusable across the project.";
  }
  if (prompts.length > 0 && stories.length === 0) {
    return "Draft a caption sequence around your strongest prompt — turn the visual direction into copy.";
  }
  if (unusedImages.length > 0) {
    return `Wrap a story around “${unusedImages[0].title}” — an image without copy has nowhere to land.`;
  }
  if (unusedPrompts.length > 0) {
    return `Try “${unusedPrompts[0].title}” in your next asset — it's saved but hasn't shipped anything yet.`;
  }
  if (duplicates.length > 0) {
    return `Merge “${duplicates[0].aTitle}” and “${duplicates[0].bTitle}” — they cover the same intent.`;
  }
  if (notes.length === 0) {
    return "Add a note with the creative direction — decisions harden when you write them down.";
  }
  return "Push a variant of your strongest asset — one small change (voice, angle, or CTA) reveals what's working.";
}
