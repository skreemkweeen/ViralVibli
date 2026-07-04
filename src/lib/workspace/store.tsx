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
  activeProject: "vv-workspace-active-project",
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
  /** The project the creator is currently working on (from URL or explicit set). */
  activeProjectId: string | null;
  /** Convenience getter — the Project object matching `activeProjectId`, or null. */
  activeProject: Project | null;
  setActiveProject: (id: string | null) => void;
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
  addNoteToProject: (projectId: string, body: string) => void;
  removeNoteFromProject: (projectId: string, noteId: string) => void;
  recordActivity: (
    type: ActivityType,
    title: string,
    moduleId: string,
    href?: string,
    projectId?: string,
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
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setProfile(load(KEY.profile, DEFAULT_CREATOR_PROFILE));
    setProjects(load(KEY.projects, []));
    setActivity(load(KEY.activity, []));
    setActiveProjectIdState(load<string | null>(KEY.activeProject, null));
    setHydrated(true);
  }, []);

  const setActiveProject = useCallback((id: string | null) => {
    setActiveProjectIdState(id);
    persist(KEY.activeProject, id);
  }, []);

  // Persist only when state actually changes after hydration. Guarding on
  // `hydrated` alone still fires once on first render post-hydrate with the
  // freshly loaded value — enough to race any external localStorage seed the
  // test harness writes between two evaluations. We track a ref of the last
  // persisted value to no-op the "load → persist same value" cycle.
  const lastPersistedRef = useRef<{
    profile: CreatorProfile | null;
    projects: Project[] | null;
    activity: ActivityItem[] | null;
  }>({ profile: null, projects: null, activity: null });

  useEffect(() => {
    if (!hydrated) return;
    if (lastPersistedRef.current.profile === profile) return;
    persist(KEY.profile, profile);
    lastPersistedRef.current.profile = profile;
  }, [profile, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (lastPersistedRef.current.projects === projects) return;
    persist(KEY.projects, projects);
    lastPersistedRef.current.projects = projects;
  }, [projects, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (lastPersistedRef.current.activity === activity) return;
    persist(KEY.activity, activity);
    lastPersistedRef.current.activity = activity;
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
      projectId?: string,
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
            projectId,
          },
          ...a,
        ].slice(0, 80),
      );
    },
    [],
  );

  const addNoteToProject = useCallback((projectId: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const noteId = uid("note");
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              notes: [
                { id: noteId, body: trimmed, createdAt: Date.now() },
                ...(p.notes ?? []),
              ],
              updatedAt: Date.now(),
            }
          : p,
      ),
    );
    setActivity((a) =>
      [
        {
          id: uid("act"),
          type: "note-added" as ActivityType,
          title: `Added note`,
          moduleId: "projects",
          href: `/projects/${projectId}`,
          createdAt: Date.now(),
          projectId,
        },
        ...a,
      ].slice(0, 80),
    );
  }, []);

  const removeNoteFromProject = useCallback(
    (projectId: string, noteId: string) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                notes: (p.notes ?? []).filter((n) => n.id !== noteId),
                updatedAt: Date.now(),
              }
            : p,
        ),
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

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

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
      activeProjectId,
      activeProject,
      setActiveProject,
      addNoteToProject,
      removeNoteFromProject,
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
      activeProjectId,
      activeProject,
      setActiveProject,
      addNoteToProject,
      removeNoteFromProject,
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
