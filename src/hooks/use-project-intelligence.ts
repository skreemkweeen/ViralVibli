"use client";

/**
 * Shared Project Intelligence hook — the single source of truth for
 * anything the app needs to know about a project's health.
 *
 * `computeProjectHealth` and `buildHeatmap` are pure; the hook layers on
 * top of them: reads project-scoped studio slices from localStorage,
 * mixes in workspace activity, and returns the same struct that the
 * Project Workspace, AI Dock, and Command Palette all render off of.
 *
 * Consumers never call the pure engine directly. That way we never
 * double-count or drift.
 */

import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/lib/workspace/store";
import { readProjectSources } from "@/lib/projects/sources";
import type { ProjectGraphSources } from "@/lib/projects/graph";
import {
  computeProjectHealth,
  type ProjectHealth,
  type ProjectSourcesInput,
} from "@/lib/projects/intelligence";
import { buildHeatmap, type Heatmap } from "@/lib/projects/heatmap";
import type { Project } from "@/lib/workspace/types";

export type ProjectIntelligence = {
  project: Project | null;
  sources: ProjectGraphSources;
  health: ProjectHealth | null;
  heatmap: Heatmap | null;
};

const EMPTY_INTELLIGENCE: ProjectIntelligence = {
  project: null,
  sources: {},
  health: null,
  heatmap: null,
};

/**
 * Return live intelligence for a specific project id. Pass `null` /
 * `undefined` for "use the workspace's active project" — the hook
 * resolves it automatically.
 */
export function useProjectIntelligence(
  projectId?: string | null,
): ProjectIntelligence {
  const {
    projects,
    activeProject: activeFromWorkspace,
    activity,
  } = useWorkspace();

  // Resolve which project we're computing for.
  const project = useMemo(() => {
    if (projectId) return projects.find((p) => p.id === projectId) ?? null;
    return activeFromWorkspace;
  }, [projectId, projects, activeFromWorkspace]);

  // Studio slices live in localStorage; re-read whenever the resolved
  // project changes so cross-page navigations always show current data.
  const [sources, setSources] = useState<ProjectGraphSources>({});
  useEffect(() => {
    if (!project) {
      setSources({});
      return;
    }
    setSources(readProjectSources(project.id));
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const health: ProjectHealth | null = useMemo(() => {
    if (!project) return null;
    const intelSources: ProjectSourcesInput = {
      ...sources,
      activity: activity.map((a) => ({
        id: a.id,
        title: a.title,
        createdAt: a.createdAt,
        projectId: a.projectId,
        type: a.type,
      })),
    };
    return computeProjectHealth(project, intelSources);
  }, [project, sources, activity]);

  const heatmap: Heatmap | null = useMemo(() => {
    if (!project) return null;
    return buildHeatmap(
      activity.map((a) => ({
        createdAt: a.createdAt,
        projectId: a.projectId,
      })),
      project.id,
    );
  }, [project, activity]);

  if (!project) return EMPTY_INTELLIGENCE;
  return { project, sources, health, heatmap };
}

// ─── Compact JSON-safe summary ──────────────────────────────────────

/**
 * A trimmed, JSON-serialisable snapshot the AI system prompt can render
 * without blowing token budget. Callers can pass this through the
 * WorkspaceContext without embedding React or Date objects.
 */
export type ProjectIntelligenceSummary = {
  projectId: string;
  projectName: string;
  completion: number;
  score: number;
  momentum: {
    recent: number;
    prior: number;
    trend: "up" | "steady" | "down";
  };
  nextStep: string;
  missing: Array<{ kind: string; count: number; message: string }>;
  unused: {
    prompts: string[];
    images: string[];
  };
  reuse: Array<{ a: string; b: string; overlap: number }>;
  duplicates: Array<{ a: string; b: string; overlap: number }>;
  dependencies: Array<{ from: string; to: string; reason: string }>;
  recommendations: Array<{
    severity: "info" | "opportunity" | "warning";
    headline: string;
    detail?: string;
  }>;
};

export function summariseIntelligence(
  intel: ProjectIntelligence,
): ProjectIntelligenceSummary | null {
  if (!intel.project || !intel.health) return null;
  const h = intel.health;
  return {
    projectId: intel.project.id,
    projectName: intel.project.name,
    completion: h.completion,
    score: h.score,
    momentum: h.momentum,
    nextStep: h.nextStep,
    missing: h.missing,
    unused: {
      prompts: h.unused.prompts.map((p) => p.title),
      images: h.unused.images.map((i) => i.title),
    },
    reuse: h.reuse.map((r) => ({
      a: r.aTitle,
      b: r.bTitle,
      overlap: Math.round(r.overlap * 100) / 100,
    })),
    duplicates: h.duplicates.map((r) => ({
      a: r.aTitle,
      b: r.bTitle,
      overlap: Math.round(r.overlap * 100) / 100,
    })),
    dependencies: h.dependencies.map((d) => ({
      from: d.from.label,
      to: d.to.label,
      reason: d.reason,
    })),
    recommendations: h.recommendations.map((r) => ({
      severity: r.severity,
      headline: r.headline,
      detail: r.detail,
    })),
  };
}
