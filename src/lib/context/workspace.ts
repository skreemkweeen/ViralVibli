"use client";

import { useEffect, useState } from "react";

export type WorkspacePrompt = {
  title: string;
  content: string;
};

export type WorkspaceProjectContext = {
  id: string;
  name: string;
  description?: string;
  storiesCount: number;
  imagesCount: number;
  promptsCount: number;
  moodboardCount: number;
  notesCount: number;
  recentActivity?: string[];
};

export type WorkspaceContext = {
  userName?: string;
  brand?: string;
  voice?: string;
  pinnedPrompts?: WorkspacePrompt[];
  recentPrompts?: WorkspacePrompt[];
  vaultCount?: number;
  /** The project the creator is actively working on — informs the AI system
   * message so it can answer with the right scope by default. */
  project?: WorkspaceProjectContext;
};

type StoredPrompt = {
  title: string;
  content: string;
  pinned?: boolean;
  updatedAt?: number;
};

type ActiveProjectInput = {
  id: string;
  name: string;
  description?: string;
  notesCount?: number;
  recentActivity?: string[];
} | null | undefined;

type ProjectScopedItem = {
  id?: string;
  title?: string;
  brief?: string;
  createdAt?: number;
  projectId?: string;
};

function loadProjectItems<T extends ProjectScopedItem>(
  key: string,
  projectId?: string,
): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed: T[] = raw ? (JSON.parse(raw) as T[]) : [];
    if (!projectId) return parsed;
    // Strict filter by projectId when at least one item is tagged; otherwise
    // include untagged items (they predate the projectId field).
    const hasTagged = parsed.some((p) => p.projectId === projectId);
    return parsed.filter((p) =>
      hasTagged ? p.projectId === projectId : true,
    );
  } catch {
    return [];
  }
}

export function useWorkspaceContext(
  userName?: string,
  brand?: string,
  voice?: string,
  project?: ActiveProjectInput,
): WorkspaceContext {
  const [ctx, setCtx] = useState<WorkspaceContext>({ userName, brand, voice });
  const projectSignature = project
    ? `${project.id}:${project.name}:${project.description ?? ""}:${project.notesCount ?? 0}`
    : "";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("vv-vault-prompts");
      const prompts: StoredPrompt[] = raw ? (JSON.parse(raw) as StoredPrompt[]) : [];

      const pinned = prompts
        .filter((p) => p.pinned)
        .slice(0, 5)
        .map((p) => ({ title: p.title, content: p.content.slice(0, 200) }));

      const recent = [...prompts]
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
        .slice(0, 5)
        .map((p) => ({ title: p.title, content: p.content.slice(0, 200) }));

      let projectContext: WorkspaceProjectContext | undefined;
      if (project) {
        const stories = loadProjectItems("vv-story-concepts", project.id);
        const images = loadProjectItems("vv-vision-concepts", project.id);
        const moodboard = loadProjectItems("vv-vision-moodboard", project.id);
        const projectPrompts = loadProjectItems<StoredPrompt & ProjectScopedItem>(
          "vv-vault-prompts",
          project.id,
        );
        projectContext = {
          id: project.id,
          name: project.name,
          description: project.description,
          storiesCount: stories.length,
          imagesCount: images.length,
          promptsCount: projectPrompts.length,
          moodboardCount: moodboard.length,
          notesCount: project.notesCount ?? 0,
          recentActivity: project.recentActivity,
        };
      }

      setCtx({
        userName,
        brand,
        voice,
        pinnedPrompts: pinned.length ? pinned : undefined,
        recentPrompts: recent.length ? recent : undefined,
        vaultCount: prompts.length,
        project: projectContext,
      });
    } catch {
      setCtx({ userName, brand, voice });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName, brand, voice, projectSignature]);

  return ctx;
}
