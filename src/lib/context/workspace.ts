"use client";

import { useEffect, useState } from "react";

export type WorkspacePrompt = {
  title: string;
  content: string;
};

export type WorkspaceContext = {
  userName?: string;
  brand?: string;
  voice?: string;
  pinnedPrompts?: WorkspacePrompt[];
  recentPrompts?: WorkspacePrompt[];
  vaultCount?: number;
};

type StoredPrompt = {
  title: string;
  content: string;
  pinned?: boolean;
  updatedAt?: number;
};

export function useWorkspaceContext(
  userName?: string,
  brand?: string,
  voice?: string,
): WorkspaceContext {
  const [ctx, setCtx] = useState<WorkspaceContext>({ userName, brand, voice });

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

      setCtx({
        userName,
        brand,
        voice,
        pinnedPrompts: pinned.length ? pinned : undefined,
        recentPrompts: recent.length ? recent : undefined,
        vaultCount: prompts.length,
      });
    } catch {
      setCtx({ userName, brand, voice });
    }
  }, [userName, brand, voice]);

  return ctx;
}
