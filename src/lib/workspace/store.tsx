"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Project,
  ProjectColor,
  ProjectItemRef,
  CreatorProfile,
  ActivityItem,
  ActivityType,
} from "./types";
import { PROJECT_COLORS_LIST, DEFAULT_CREATOR_PROFILE } from "./types";
import { buildDemoWorkspace } from "./seed";

const KEY = {
  profile: "vv-workspace-profile",
  projects: "vv-workspace-projects",
  activity: "vv-workspace-activity",
  vaultPrompts: "vv-vault-prompts",
};

let n = 0;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${++n}`;

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback; // storage unavailable or corrupt
  }
}

function persist<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

type WorkspaceState = {
  profile: CreatorProfile;
  projects: Project[];
  activity: ActivityItem[];
  hydrated: boolean;
  isEmpty: boolean;
  updateProfile: (patch: Partial<CreatorProfile>) => void;
  createProject: (
    name: string,
    description?: string,
    color?: ProjectColor,
  ) => string;
  updateProject: (
    id: string,
    patch: Partial<Pick<Project, "name" | "description" | "color">>,
  ) => void;
  deleteProject: (id: string) => void;
  addItemToProject: (projectId: string, item: ProjectItemRef) => void;
  removeItemFromProject: (projectId: string, itemId: string) => void;
  recordActivity: (
    type: ActivityType,
    title: string,
    moduleId: string,
    href?: string,
  ) => void;
  /** Populate the workspace with a curated demo dataset. Overwrites existing data. */
  loadDemo: () => void;
  /** Wipe every workspace slice back to blank. */
  clearWorkspace: () => void;
  /** Clear the activity feed only, leaving projects and profile intact. */
  clearActivity: () => void;
  /** Duplicate the given project (or the most-recent one when id is absent). */
  duplicateProject: (id?: string) => string | null;
};

const WorkspaceCtx = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<CreatorProfile>(DEFAULT_CREATOR_PROFILE);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    setProfile(load(KEY.profile, DEFAULT_CREATOR_PROFILE));
    setProjects(load(KEY.projects, []));
    setActivity(load(KEY.activity, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persist(KEY.profile, profile);
  }, [profile, hydrated]);

  useEffect(() => {
    if (hydrated) persist(KEY.projects, projects);
  }, [projects, hydrated]);

  useEffect(() => {
    if (hydrated) persist(KEY.activity, activity);
  }, [activity, hydrated]);

  const updateProfile = useCallback((patch: Partial<CreatorProfile>) => {
    setProfile((p) => ({ ...p, ...patch }));
  }, []);

  const createProject = useCallback(
    (name: string, description?: string, color?: ProjectColor): string => {
      const id = uid("proj");
      setProjects((prev) => {
        const assigned =
          color ?? PROJECT_COLORS_LIST[prev.length % PROJECT_COLORS_LIST.length] ?? "lime";
        const project: Project = {
          id,
          name,
          description,
          color: assigned,
          items: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        return [project, ...prev];
      });
      setActivity((a) =>
        [
          {
            id: uid("act"),
            type: "project-created" as ActivityType,
            title: `Created "${name}"`,
            moduleId: "workspace",
            href: "/projects",
            createdAt: Date.now(),
          },
          ...a,
        ].slice(0, 50),
      );
      return id;
    },
    [],
  );

  const updateProject = useCallback(
    (
      id: string,
      patch: Partial<Pick<Project, "name" | "description" | "color">>,
    ) => {
      setProjects((ps) =>
        ps.map((p) =>
          p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
        ),
      );
    },
    [],
  );

  const deleteProject = useCallback((id: string) => {
    setProjects((ps) => ps.filter((p) => p.id !== id));
  }, []);

  const addItemToProject = useCallback(
    (projectId: string, item: ProjectItemRef) => {
      setProjects((ps) =>
        ps.map((p) => {
          if (p.id !== projectId) return p;
          const exists = p.items.some(
            (i) => i.type === item.type && i.id === item.id,
          );
          if (exists) return p;
          return {
            ...p,
            items: [...p.items, item],
            updatedAt: Date.now(),
          };
        }),
      );
    },
    [],
  );

  const removeItemFromProject = useCallback(
    (projectId: string, itemId: string) => {
      setProjects((ps) =>
        ps.map((p) =>
          p.id === projectId
            ? {
                ...p,
                items: p.items.filter((i) => i.id !== itemId),
                updatedAt: Date.now(),
              }
            : p,
        ),
      );
    },
    [],
  );

  const recordActivity = useCallback(
    (
      type: ActivityType,
      title: string,
      moduleId: string,
      href?: string,
    ) => {
      setActivity((a) =>
        [
          {
            id: uid("act"),
            type,
            title,
            moduleId,
            href,
            createdAt: Date.now(),
          },
          ...a,
        ].slice(0, 50),
      );
    },
    [],
  );

  const loadDemo = useCallback(() => {
    const demo = buildDemoWorkspace();
    setProfile(demo.profile);
    setProjects(demo.projects);
    setActivity(demo.activity);
    // Vault prompts live in a separate localStorage key that the vault store
    // reads on hydrate; seed it directly so the vault route sees the sample
    // library too.
    persist(KEY.vaultPrompts, demo.vaultPrompts);
  }, []);

  const clearWorkspace = useCallback(() => {
    setProfile(DEFAULT_CREATOR_PROFILE);
    setProjects([]);
    setActivity([]);
    persist(KEY.vaultPrompts, []);
  }, []);

  const clearActivity = useCallback(() => setActivity([]), []);

  const duplicateProject = useCallback(
    (id?: string): string | null => {
      let newId: string | null = null;
      setProjects((prev) => {
        const source = id ? prev.find((p) => p.id === id) : prev[0];
        if (!source) return prev;
        newId = uid("proj");
        const clone: Project = {
          ...source,
          id: newId,
          name: `${source.name} (copy)`,
          items: source.items.map((it) => ({ ...it })),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        return [clone, ...prev];
      });
      if (newId) {
        setActivity((a) =>
          [
            {
              id: uid("act"),
              type: "project-created" as ActivityType,
              title: `Duplicated project`,
              moduleId: "projects",
              href: "/projects",
              createdAt: Date.now(),
            },
            ...a,
          ].slice(0, 50),
        );
      }
      return newId;
    },
    [],
  );

  const isEmpty =
    hydrated &&
    projects.length === 0 &&
    activity.length === 0 &&
    profile.brand === DEFAULT_CREATOR_PROFILE.brand;

  const value = useMemo<WorkspaceState>(
    () => ({
      profile,
      projects,
      activity,
      hydrated,
      isEmpty,
      updateProfile,
      createProject,
      updateProject,
      deleteProject,
      addItemToProject,
      removeItemFromProject,
      recordActivity,
      loadDemo,
      clearWorkspace,
      clearActivity,
      duplicateProject,
    }),
    [
      profile,
      projects,
      activity,
      hydrated,
      isEmpty,
      updateProfile,
      createProject,
      updateProject,
      deleteProject,
      addItemToProject,
      removeItemFromProject,
      recordActivity,
      loadDemo,
      clearWorkspace,
      clearActivity,
      duplicateProject,
    ],
  );

  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>;
}

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx)
    throw new Error("useWorkspace must be used within <WorkspaceProvider>");
  return ctx;
}
