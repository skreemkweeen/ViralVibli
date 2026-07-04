/**
 * Read-only accessors for project-scoped entity data.
 *
 * Studios persist their own state under known localStorage keys. Project
 * workspaces need to project (pun intended) that state for their graph +
 * inspector without pulling in those providers. Keep these accessors
 * dependency-free so they can run from anywhere in the tree.
 */

import type { ProjectGraphSources } from "./graph";

const KEY = {
  storyConcepts: "vv-story-concepts",
  visionConcepts: "vv-vision-concepts",
  visionMoodboard: "vv-vision-moodboard",
  vaultPrompts: "vv-vault-prompts",
} as const;

type Loose = Record<string, unknown>;

function loadJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function byProjectId<T extends Loose>(
  items: T[],
  projectId: string,
  strict = false,
): T[] {
  return items.filter((item) => {
    const pid = (item.projectId ?? null) as string | null;
    if (strict) return pid === projectId;
    return pid == null || pid === projectId;
  });
}

/**
 * Pull graph sources for a specific project. Studio entities are filtered
 * inclusively — if the entity has no projectId (legacy data), it's kept so
 * projects created before Pass L still show something.
 */
export function readProjectSources(projectId: string): ProjectGraphSources {
  const stories = loadJson<Loose>(KEY.storyConcepts);
  const images = loadJson<Loose>(KEY.visionConcepts);
  const moodboard = loadJson<Loose>(KEY.visionMoodboard);
  const prompts = loadJson<Loose>(KEY.vaultPrompts);

  const strict = stories.some((s) => s.projectId === projectId)
    || images.some((i) => i.projectId === projectId)
    || moodboard.some((m) => m.projectId === projectId)
    || prompts.some((p) => p.projectId === projectId);

  const mapStory = (s: Loose) => ({
    id: (s.id as string) ?? "",
    title:
      (s.brief as string | undefined) ??
      (s.direction as { subject?: string } | undefined)?.subject,
    brief: (s.brief as string | undefined) ?? undefined,
    createdAt: (s.createdAt as number | undefined) ?? undefined,
    projectId: (s.projectId as string | undefined) ?? undefined,
  });

  const mapImage = (i: Loose) => ({
    id: (i.id as string) ?? "",
    title:
      (i.label as string | undefined) ??
      (i.prompt as string | undefined)?.slice(0, 40),
    brief: (i.prompt as string | undefined) ?? undefined,
    createdAt: (i.createdAt as number | undefined) ?? undefined,
    projectId: (i.projectId as string | undefined) ?? undefined,
  });

  const mapMood = (m: Loose) => ({
    id: (m.id as string) ?? "",
    title: (m.title as string | undefined) ?? "Reference",
    createdAt: (m.createdAt as number | undefined) ?? undefined,
    projectId: (m.projectId as string | undefined) ?? undefined,
  });

  const mapPrompt = (p: Loose) => ({
    id: (p.id as string) ?? "",
    title: (p.title as string | undefined) ?? "Prompt",
    createdAt: (p.createdAt as number | undefined) ?? undefined,
    projectId: (p.projectId as string | undefined) ?? undefined,
  });

  return {
    stories: byProjectId(stories, projectId, strict).map(mapStory),
    images: byProjectId(images, projectId, strict).map(mapImage),
    moodboard: byProjectId(moodboard, projectId, strict).map(mapMood),
    prompts: byProjectId(prompts, projectId, strict).map(mapPrompt),
  };
}
