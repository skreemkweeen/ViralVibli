"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Plus,
  FolderSimple,
  Trash,
  DotsThree,
  MagnifyingGlass,
  Sparkle,
  ArrowRight,
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useWorkspace } from "@/lib/workspace/store";
import type { ProjectColor } from "@/lib/workspace/types";
import { PROJECT_COLORS, PROJECT_COLORS_LIST } from "@/lib/workspace/types";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}


export function ProjectsView() {
  const {
    projects,
    activity,
    hydrated,
    createProject,
    updateProject,
    deleteProject,
  } = useWorkspace();
  const reduce = useReducedMotion();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState<ProjectColor>("lime");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) nameRef.current?.focus();
  }, [creating]);

  const handleCreate = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    createProject(name, newDesc.trim() || undefined, newColor);
    setNewName("");
    setNewDesc("");
    setNewColor("lime");
    setCreating(false);
  }, [newName, newDesc, newColor, createProject]);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirmDelete === id) {
        deleteProject(id);
        setConfirmDelete(null);
      } else {
        setConfirmDelete(id);
        setTimeout(() => setConfirmDelete((c) => (c === id ? null : c)), 3000);
      }
    },
    [confirmDelete, deleteProject],
  );

  if (!hydrated) return null;

  const recentActivity = activity.slice(0, 5);

  return (
    <div className="mx-auto max-w-[900px] space-y-10">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-[-0.02em]">
            Projects
          </h1>
          <p className="mt-1 text-[15px] text-muted">
            Organize your creative work. Each project connects stories,
            prompts, and assets into one workflow.
          </p>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-ink transition-opacity hover:opacity-90 active:opacity-75 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <Plus className="size-4" weight="bold" />
            New Project
          </button>
        )}
      </header>

      {/* Create form */}
      <AnimatePresence initial={false}>
        {creating && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <p className="mb-4 text-[13px] font-semibold uppercase tracking-widest text-faint">
              New Project
            </p>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[12px] text-faint">Project name</span>
                <input
                  ref={nameRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") setCreating(false);
                  }}
                  placeholder="e.g. Summer Campaign"
                  className="h-11 w-full rounded-xl border border-line bg-bg px-3.5 text-[14px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] text-faint">Description <span className="text-faint/60">(optional)</span></span>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") setCreating(false);
                  }}
                  placeholder="What is this project about?"
                  className="h-11 w-full rounded-xl border border-line bg-bg px-3.5 text-[14px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                />
              </label>
              {/* Color picker */}
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-faint">Color</span>
                <div className="flex gap-1.5">
                  {PROJECT_COLORS_LIST.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      aria-label={`Color: ${c}`}
                      aria-pressed={newColor === c}
                      className={`size-6 cursor-pointer rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${PROJECT_COLORS[c].dot} ${newColor === c ? "scale-125 ring-2 ring-offset-2 ring-offset-surface ring-white/20" : "opacity-60 hover:opacity-90 active:scale-110"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="h-10 cursor-pointer rounded-xl bg-accent px-4 text-[13px] font-semibold text-accent-ink transition-opacity hover:opacity-90 active:opacity-75 disabled:cursor-default disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                  setNewDesc("");
                }}
                className="h-10 cursor-pointer rounded-xl border border-line px-4 text-[13px] text-muted transition-colors hover:text-ink active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects grid */}
      {projects.length === 0 && !creating ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line border-dashed bg-surface/50 py-16 text-center">
          <FolderSimple className="size-10 text-faint" />
          <p className="mt-4 text-[15px] font-medium text-ink">
            No projects yet
          </p>
          <p className="mt-1 text-[14px] text-muted">
            Create a project to organize stories, prompts, and generated assets
            into one workflow.
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-5 flex cursor-pointer items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-ink transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <Plus className="size-4" weight="bold" />
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {projects.map((project) => {
              const colors = PROJECT_COLORS[project.color];
              const isEditing = editingId === project.id;
              return (
                <motion.div
                  key={project.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`group relative overflow-hidden rounded-2xl border border-line border-l-[3px] bg-surface p-5 transition-colors hover:border-line/80 ${colors.border}`}
                >
                  {/* Edit overlay */}
                  {isEditing ? (
                    <ProjectEditForm
                      project={project}
                      onSave={(name, description, color) => {
                        updateProject(project.id, { name, description, color });
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      {/* Action buttons — always visible on touch, hover-revealed on pointer devices */}
                      <div className="absolute right-3 top-3 flex items-center gap-1 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setEditingId(project.id)}
                          aria-label="Edit project"
                          className="grid size-8 cursor-pointer place-items-center rounded-lg border border-line/60 bg-surface/90 text-faint backdrop-blur-sm transition-colors hover:text-muted active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                          <DotsThree className="size-4" weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(project.id)}
                          aria-label={
                            confirmDelete === project.id
                              ? "Confirm delete"
                              : "Delete project"
                          }
                          className={`grid size-8 cursor-pointer place-items-center rounded-lg border border-line/60 bg-surface/90 backdrop-blur-sm transition-colors active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 ${
                            confirmDelete === project.id
                              ? "border-red-500/40 text-red-400"
                              : "text-faint hover:text-red-400"
                          }`}
                        >
                          <Trash className="size-3.5" />
                        </button>
                      </div>

                      <div className={`mb-3 size-8 rounded-lg ${PROJECT_COLORS[project.color].dot} opacity-80`} />

                      <h3 className="text-[15px] font-semibold text-ink">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="mt-1 line-clamp-2 text-[13px] text-muted">
                          {project.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-3 text-[12px] text-faint">
                        <span>
                          {project.items.length}{" "}
                          {project.items.length === 1 ? "item" : "items"}
                        </span>
                        <span>·</span>
                        <span>{timeAgo(project.updatedAt)}</span>
                      </div>

                      {/* Item preview tags */}
                      {project.items.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {project.items.slice(0, 3).map((item) => (
                            <span
                              key={item.id}
                              className="max-w-[120px] truncate rounded-md border border-line/60 bg-bg px-1.5 py-0.5 text-[11px] text-faint"
                            >
                              {item.title}
                            </span>
                          ))}
                          {project.items.length > 3 && (
                            <span className="rounded-md border border-line/60 bg-bg px-1.5 py-0.5 text-[11px] text-faint">
                              +{project.items.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Activity feed */}
      {recentActivity.length > 0 && (
        <section>
          <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-widest text-faint">
            Recent Activity
          </h2>
          <div className="space-y-1">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              >
                <div className="size-1.5 rounded-full bg-faint" />
                <span className="flex-1 text-[13px] text-muted">
                  {item.title}
                </span>
                <span className="shrink-0 text-[12px] text-faint">
                  {timeAgo(item.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vault prompt search → add to project */}
      {projects.length > 0 && (
        <VaultPromptAdder projects={projects} />
      )}

      {/* AI assistant CTA */}
      <Link
        href="/assistant"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/[0.08] to-surface p-5 transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="flex items-center gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink">
            <Sparkle weight="fill" className="size-5" />
          </span>
          <div>
            <p className="text-[14px] font-medium text-ink">
              Let the AI Assistant plan your next campaign
            </p>
            <p className="text-[13px] text-muted">
              Describe the project and the assistant creates stories, prompts,
              and image concepts.
            </p>
          </div>
        </div>
        <ArrowRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

function ProjectEditForm({
  project,
  onSave,
  onCancel,
}: {
  project: { name: string; description?: string; color: ProjectColor };
  onSave: (name: string, description: string, color: ProjectColor) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [desc, setDesc] = useState(project.description ?? "");
  const [color, setColor] = useState<ProjectColor>(project.color);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="space-y-2">
      <input
        ref={ref}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(name, desc, color);
          if (e.key === "Escape") onCancel();
        }}
        className="w-full rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[13px] text-ink focus:border-accent/40 focus:outline-none"
      />
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Description"
        className="w-full rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[13px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none"
      />
      <div className="flex gap-1">
        {PROJECT_COLORS_LIST.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Color: ${c}`}
            aria-pressed={color === c}
            className={`size-5 cursor-pointer rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${PROJECT_COLORS[c].dot} ${color === c ? "scale-125 ring-2 ring-offset-1 ring-offset-surface ring-white/20" : "opacity-50 hover:opacity-80 active:scale-110"}`}
          />
        ))}
      </div>
      <div className="flex gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => onSave(name.trim() || project.name, desc, color)}
          className="cursor-pointer rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-accent-ink transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:text-ink active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

type StoredPrompt = { id: string; title: string; content: string };

function VaultPromptAdder({
  projects,
}: {
  projects: Array<{ id: string; name: string }>;
}) {
  const { addItemToProject } = useWorkspace();
  const [query, setQuery] = useState("");
  const [prompts, setPrompts] = useState<StoredPrompt[]>([]);
  const [targetProject, setTargetProject] = useState(projects[0]?.id ?? "");
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("vv-vault-prompts");
      if (raw) setPrompts(JSON.parse(raw) as StoredPrompt[]);
    } catch {
      // storage unavailable
    }
    if (projects[0]) setTargetProject(projects[0].id);
  }, [projects]);

  const filtered = prompts
    .filter(
      (p) =>
        !query ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.content.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 5);

  const handleAdd = (prompt: StoredPrompt) => {
    addItemToProject(targetProject, {
      type: "prompt",
      id: prompt.id,
      title: prompt.title,
    });
    setAdded(prompt.id);
    setTimeout(() => setAdded((c) => (c === prompt.id ? null : c)), 1500);
  };

  if (prompts.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-widest text-faint">
        Add Vault Prompts to a Project
      </h2>
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="mb-3 flex flex-wrap gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search prompts..."
              className="w-full rounded-xl border border-line bg-bg py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none"
            />
          </div>
          {projects.length > 1 && (
            <select
              value={targetProject}
              onChange={(e) => setTargetProject(e.target.value)}
              className="rounded-xl border border-line bg-bg px-3 py-2 text-[13px] text-ink focus:border-accent/40 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="space-y-1">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-2"
            >
              <span className="flex-1 truncate text-[13px] text-muted">
                {p.title}
              </span>
              <button
                type="button"
                onClick={() => handleAdd(p)}
                className={`min-h-[36px] cursor-pointer shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  added === p.id
                    ? "bg-accent/10 text-accent-fg"
                    : "border border-line text-faint hover:text-ink"
                }`}
              >
                {added === p.id ? "Added" : "Add"}
              </button>
            </div>
          ))}
          {filtered.length === 0 && query && (
            <p className="px-3 py-4 text-center text-[13px] text-faint">
              No prompts match &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
