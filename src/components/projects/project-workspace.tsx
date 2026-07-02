"use client";

/**
 * Project Workspace — the unified surface for a single project.
 *
 * A project holds every asset the creator has made under one lens:
 * stories, images, prompts, moodboards, notes, activity. This component
 * turns that into a Raycast/Linear-tier workspace with tabs (Overview,
 * Timeline, Graph, Notes) and a persistent inspector on the right.
 *
 * State strategy:
 *  - Project itself + notes live in the WorkspaceProvider.
 *  - Studio entities are loaded from localStorage on mount (dependency-
 *    free so this page doesn't need to nest the studio providers).
 *  - Setting the active project id is a side effect of navigating here.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CaretRight,
  Clock,
  FilmSlate,
  Camera,
  Vault,
  PushPin,
  NotePencil,
  Sparkle,
  GraphIcon,
  Plus,
  Trash,
  Path,
} from "@phosphor-icons/react";
import { useWorkspace } from "@/lib/workspace/store";
import { PROJECT_COLORS } from "@/lib/workspace/types";
import { readProjectSources } from "@/lib/projects/sources";
import {
  buildProjectGraph,
  connectedIds,
  projectSummary,
  type ProjectGraph,
  type ProjectNodeKind,
} from "@/lib/projects/graph";
import type { ProjectGraphSources } from "@/lib/projects/graph";
import { openAIDock } from "@/components/app/app-shell";

// ─── Utility ─────────────────────────────────────────────────────────

function timeAgo(ts?: number): string {
  if (!ts) return "";
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

// ─── Tab types ───────────────────────────────────────────────────────

type Tab = "overview" | "timeline" | "graph" | "notes";

// ─── Main ────────────────────────────────────────────────────────────

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const router = useRouter();
  const {
    projects,
    hydrated,
    activity,
    profile,
    activeProjectId,
    setActiveProject,
    addNoteToProject,
    removeNoteFromProject,
    updateProject,
    deleteProject,
  } = useWorkspace();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("overview");
  const [sources, setSources] = useState<ProjectGraphSources>({});
  const [noteDraft, setNoteDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");

  const project = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  );

  useEffect(() => {
    if (!hydrated) return;
    // Register this as the active project so studios pick it up
    if (project && activeProjectId !== project.id) setActiveProject(project.id);
    if (project) setName(project.name);
    setSources(readProjectSources(projectId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, project?.id]);

  // Build graph once project + sources are ready
  const graph: ProjectGraph = useMemo(() => {
    if (!project) return { nodes: [], edges: [] };
    return buildProjectGraph(project, {
      ...sources,
      activity: activity.map((a) => ({
        id: a.id,
        title: a.title,
        createdAt: a.createdAt,
        projectId: a.projectId,
      })),
    });
  }, [project, sources, activity]);

  const summary = useMemo(() => {
    if (!project)
      return { stories: 0, images: 0, prompts: 0, moodboard: 0, notes: 0, activity: 0 };
    return projectSummary(project, {
      ...sources,
      activity: activity.map((a) => ({
        id: a.id,
        title: a.title,
        createdAt: a.createdAt,
        projectId: a.projectId,
      })),
    });
  }, [project, sources, activity]);

  const projectActivity = useMemo(
    () =>
      activity.filter((a) => !a.projectId || a.projectId === project?.id),
    [activity, project?.id],
  );

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-4xl py-24 text-center text-muted">
        Loading project…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <div className="grid size-14 place-items-center rounded-2xl border border-line bg-surface">
          <Path className="size-6 text-faint" weight="regular" />
        </div>
        <div>
          <h1 className="text-[18px] font-semibold">Project not found</h1>
          <p className="mt-1 text-[13px] text-muted">
            The project you followed no longer exists in this workspace.
          </p>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13px] text-ink hover:border-faint"
        >
          <ArrowLeft className="size-3.5" />
          Back to Projects
        </Link>
      </div>
    );
  }

  const color = PROJECT_COLORS[project.color];

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-faint">
        <Link href="/projects" className="hover:text-ink">
          Projects
        </Link>
        <CaretRight className="size-3" />
        <span className="text-muted">{project.name}</span>
      </div>

      {/* Header */}
      <header className={`relative overflow-hidden rounded-2xl border border-line bg-surface`}>
        <div className={`h-1.5 ${color.dot}`} />
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
          <div className="min-w-0 flex-1">
            {editingName ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                  const trimmed = name.trim();
                  if (trimmed && trimmed !== project.name) {
                    updateProject(project.id, { name: trimmed });
                  }
                  setEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") {
                    setName(project.name);
                    setEditingName(false);
                  }
                }}
                className="w-full bg-transparent text-[clamp(1.6rem,4vw,2.2rem)] font-semibold tracking-[-0.03em] text-ink focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="cursor-text text-left text-[clamp(1.6rem,4vw,2.2rem)] font-semibold tracking-[-0.03em]"
                aria-label="Rename project"
              >
                {project.name}
              </button>
            )}
            {project.description && (
              <p className="mt-1.5 line-clamp-2 text-[14px] text-muted">
                {project.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-faint">
              <span className="inline-flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full ${color.dot}`} />
                {project.color}
              </span>
              <span>·</span>
              <span>Created {timeAgo(project.createdAt)}</span>
              <span>·</span>
              <span>{summary.stories + summary.images + summary.prompts + summary.moodboard} assets</span>
              {summary.notes > 0 && (
                <>
                  <span>·</span>
                  <span>{summary.notes} notes</span>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() =>
                openAIDock({
                  prefill: `Summarise the “${project.name}” project so far. What's the shape, what's missing, and what's a strong next asset to make?`,
                  autoSend: true,
                })
              }
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <Sparkle className="size-4 text-accent-fg" weight="fill" />
              Ask AI about this project
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete “${project.name}”? This cannot be undone.`)) {
                  deleteProject(project.id);
                  router.push("/projects");
                }
              }}
              aria-label="Delete project"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:border-faint hover:text-ink active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <Trash className="size-4" />
            </button>
          </div>
        </div>

        {/* Tab strip */}
        <nav
          className="flex gap-1 border-t border-line px-3"
          aria-label="Project workspace views"
        >
          {(
            [
              { id: "overview" as const, label: "Overview", icon: <Path className="size-3.5" /> },
              { id: "timeline" as const, label: "Timeline", icon: <Clock className="size-3.5" /> },
              { id: "graph" as const, label: "Graph", icon: <GraphIcon className="size-3.5" /> },
              { id: "notes" as const, label: "Notes", icon: <NotePencil className="size-3.5" /> },
            ]
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                className={`relative flex cursor-pointer items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  active ? "text-ink" : "text-faint hover:text-muted"
                }`}
              >
                {t.icon}
                {t.label}
                {active && (
                  <motion.span
                    layoutId="project-tab-underline"
                    className="absolute inset-x-1 -bottom-px h-[2px] rounded-full bg-accent"
                    transition={{
                      duration: reduce ? 0 : 0.25,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Body: content + inspector */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="min-w-0">
          {tab === "overview" && (
            <OverviewTab
              project={project}
              summary={summary}
              activity={projectActivity.slice(0, 6)}
              sources={sources}
            />
          )}
          {tab === "timeline" && (
            <TimelineTab activity={projectActivity} />
          )}
          {tab === "graph" && <GraphTab graph={graph} />}
          {tab === "notes" && (
            <NotesTab
              notes={project.notes ?? []}
              draft={noteDraft}
              setDraft={setNoteDraft}
              onAdd={() => {
                if (!noteDraft.trim()) return;
                addNoteToProject(project.id, noteDraft);
                setNoteDraft("");
              }}
              onRemove={(id) => removeNoteFromProject(project.id, id)}
            />
          )}
        </div>

        {/* Inspector */}
        <ProjectInspector
          project={project}
          summary={summary}
          brand={profile.brand}
        />
      </div>
    </div>
  );
}

// ─── Overview ──────────────────────────────────────────────────────

type Summary = ReturnType<typeof projectSummary>;

function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 transition-colors hover:border-faint">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line/60 bg-bg text-accent-fg">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium uppercase tracking-widest text-faint">
          {label}
        </p>
        <p className="mt-0.5 text-[18px] font-semibold tabular-nums text-ink">
          {value}
        </p>
      </div>
      {href && <ArrowRight className="size-4 shrink-0 text-faint" />}
    </div>
  );
  return href ? (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-xl">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function OverviewTab({
  project,
  summary,
  activity,
  sources,
}: {
  project: { id: string; name: string };
  summary: Summary;
  activity: Array<{
    id: string;
    title: string;
    createdAt: number;
    moduleId?: string;
    href?: string;
  }>;
  sources: ProjectGraphSources;
}) {
  const stories = sources.stories?.slice(0, 3) ?? [];
  const images = sources.images?.slice(0, 3) ?? [];
  const prompts = sources.prompts?.slice(0, 3) ?? [];
  const moodboard = sources.moodboard?.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Stories" value={summary.stories} icon={<FilmSlate className="size-4" weight="fill" />} href="/story" />
        <StatCard label="Images" value={summary.images} icon={<Camera className="size-4" weight="fill" />} href="/vision" />
        <StatCard label="Prompts" value={summary.prompts} icon={<Vault className="size-4" weight="fill" />} href="/vault" />
        <StatCard label="Moodboard" value={summary.moodboard} icon={<PushPin className="size-4" weight="fill" />} href="/vision?moodboard=1" />
      </div>

      <RecentSection title="Recent stories" href="/story" items={stories.map((s) => ({ id: s.id, title: s.title ?? "Story", subtitle: s.brief, createdAt: s.createdAt }))} icon={<FilmSlate className="size-3.5" />} />
      <RecentSection title="Recent images" href="/vision" items={images.map((i) => ({ id: i.id, title: i.title ?? "Image", subtitle: i.brief, createdAt: i.createdAt }))} icon={<Camera className="size-3.5" />} />
      <RecentSection title="Prompts" href="/vault" items={prompts.map((p) => ({ id: p.id, title: p.title, createdAt: p.createdAt }))} icon={<Vault className="size-3.5" />} />
      <RecentSection title="Moodboard references" href="/vision?moodboard=1" items={moodboard.map((m) => ({ id: m.id, title: m.title ?? "Reference", createdAt: m.createdAt }))} icon={<PushPin className="size-3.5" />} />

      {activity.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <Clock className="size-3.5 text-faint" />
              <h3 className="text-[13px] font-semibold text-ink">
                Latest activity
              </h3>
            </div>
          </div>
          <ol className="space-y-1.5">
            {activity.map((a) => (
              <li key={a.id} className="flex items-start gap-2 text-[13px]">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                <span className="min-w-0 flex-1 truncate text-ink">
                  {a.title}
                </span>
                <span className="shrink-0 text-[11px] text-faint">
                  {timeAgo(a.createdAt)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {/* Force project id ref so `project.id` isn't dead code when the section
          list is empty; the studio deep links use it. */}
      {project.id && null}
    </div>
  );
}

function RecentSection({
  title,
  href,
  items,
  icon,
}: {
  title: string;
  href: string;
  icon: React.ReactNode;
  items: Array<{ id: string; title: string; subtitle?: string; createdAt?: number }>;
}) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-faint">
          {icon}
          <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink"
        >
          Open studio
          <ArrowRight className="size-3" />
        </Link>
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li
            key={it.id}
            className="flex items-start gap-2 rounded-lg border border-line/60 bg-bg px-3 py-2"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] text-ink">
                {it.title}
              </span>
              {it.subtitle && (
                <span className="block truncate text-[11px] text-faint">
                  {it.subtitle}
                </span>
              )}
            </span>
            {it.createdAt && (
              <span className="shrink-0 text-[11px] text-faint">
                {timeAgo(it.createdAt)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Timeline ──────────────────────────────────────────────────────

function TimelineTab({
  activity,
}: {
  activity: Array<{
    id: string;
    title: string;
    createdAt: number;
    moduleId?: string;
    href?: string;
    type?: string;
  }>;
}) {
  if (activity.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <div className="max-w-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-full border border-line bg-bg text-faint">
            <Clock className="size-5" />
          </div>
          <h3 className="mt-3 text-[15px] font-semibold text-ink">
            No activity yet
          </h3>
          <p className="mt-1 text-[13px] text-muted">
            Every studio action inside this project will land here in order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-line bg-surface p-5">
      <div className="absolute inset-y-6 left-6 w-px bg-line" aria-hidden="true" />
      <ol className="space-y-4">
        {activity.map((a) => (
          <li key={a.id} className="relative pl-7">
            <span className="absolute left-[15px] top-1.5 size-2 -translate-x-1/2 rounded-full border border-accent bg-bg" />
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-[13px] text-ink">{a.title}</p>
              <span className="text-[11px] text-faint">{timeAgo(a.createdAt)}</span>
            </div>
            {a.moduleId && (
              <p className="mt-0.5 text-[11px] uppercase tracking-widest text-faint">
                {a.moduleId}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Graph ─────────────────────────────────────────────────────────

function GraphTab({ graph }: { graph: ProjectGraph }) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const highlighted = new Set(hoverId ? [hoverId, ...connectedIds(graph, hoverId)] : []);

  const kindColor: Record<ProjectNodeKind, string> = {
    project: "fill-accent",
    story: "fill-blue-400",
    image: "fill-orange-400",
    prompt: "fill-purple-400",
    moodboard: "fill-pink-400",
    note: "fill-teal-400",
    activity: "fill-white/60",
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <svg
        viewBox="0 0 720 480"
        className="mx-auto block w-full text-ink"
        role="img"
        aria-label="Project relationship graph"
      >
        {graph.edges.map((e, i) => {
          const from = graph.nodes.find((n) => n.id === e.from);
          const to = graph.nodes.find((n) => n.id === e.to);
          if (!from || !to) return null;
          const active =
            highlighted.has(from.id) || highlighted.has(to.id);
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="currentColor"
              strokeOpacity={active ? 0.5 : hoverId ? 0.1 : 0.2}
              strokeWidth={active ? 1.5 : 1}
            />
          );
        })}
        {graph.nodes.map((n) => {
          const active = hoverId ? highlighted.has(n.id) : true;
          const r = n.kind === "project" ? 28 : 14;
          return (
            <g
              key={n.id}
              onMouseEnter={() => setHoverId(n.id)}
              onMouseLeave={() => setHoverId(null)}
              className="cursor-pointer"
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                className={kindColor[n.kind]}
                opacity={active ? 0.95 : 0.25}
              />
              <text
                x={n.x}
                y={n.y + r + 12}
                textAnchor="middle"
                className={`fill-current text-[10px] ${
                  active ? "opacity-100" : "opacity-40"
                }`}
                style={{ pointerEvents: "none" }}
              >
                {n.label.length > 22 ? n.label.slice(0, 20) + "…" : n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-[11px] text-faint">
        {(
          [
            ["project", "bg-accent"],
            ["story", "bg-blue-400"],
            ["image", "bg-orange-400"],
            ["prompt", "bg-purple-400"],
            ["moodboard", "bg-pink-400"],
            ["note", "bg-teal-400"],
            ["activity", "bg-white/60"],
          ] as const
        ).map(([k, cls]) => (
          <span key={k} className="inline-flex items-center gap-1.5 capitalize">
            <span className={`size-2 rounded-full ${cls}`} />
            {k}
          </span>
        ))}
        <span className="ml-auto">Hover a node to see its neighborhood</span>
      </div>
    </div>
  );
}

// ─── Notes ─────────────────────────────────────────────────────────

function NotesTab({
  notes,
  draft,
  setDraft,
  onAdd,
  onRemove,
}: {
  notes: Array<{ id: string; body: string; createdAt: number }>;
  draft: string;
  setDraft: (v: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <label
          htmlFor="new-note"
          className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-faint"
        >
          New note
        </label>
        <textarea
          id="new-note"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Direction, references, decisions — anything future you will thank you for."
          className="mb-3 block w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-ink placeholder:text-faint focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onAdd}
            disabled={!draft.trim()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-medium text-accent-ink transition-transform hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <Plus className="size-3.5" weight="bold" />
            Add note
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-4 py-10 text-center text-[13px] text-muted">
          No notes yet — capture the first decision above.
        </div>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="group rounded-2xl border border-line bg-surface p-4"
            >
              <div className="mb-1 flex items-center justify-between text-[11px] text-faint">
                <span>{timeAgo(n.createdAt)}</span>
                <button
                  type="button"
                  onClick={() => onRemove(n.id)}
                  aria-label="Delete note"
                  className="cursor-pointer rounded p-1 text-faint opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash className="size-3.5" />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
                {n.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Inspector ─────────────────────────────────────────────────────

function ProjectInspector({
  project,
  summary,
  brand,
}: {
  project: { id: string; name: string; color: keyof typeof PROJECT_COLORS };
  summary: Summary;
  brand: string;
}) {
  const totalAssets =
    summary.stories + summary.images + summary.prompts + summary.moodboard;

  return (
    <aside className="flex h-fit flex-col gap-3 lg:sticky lg:top-24">
      <section className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
          Summary
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <InspectorStat label="Stories" value={summary.stories} />
          <InspectorStat label="Images" value={summary.images} />
          <InspectorStat label="Prompts" value={summary.prompts} />
          <InspectorStat label="Moodboard" value={summary.moodboard} />
          <InspectorStat label="Notes" value={summary.notes} />
          <InspectorStat label="Activity" value={summary.activity} />
        </div>
        <p className="mt-3 border-t border-line pt-3 text-[11px] text-faint">
          {totalAssets} total assets ·{" "}
          <span className="text-muted">Brand: {brand}</span>
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
          Quick actions
        </p>
        <div className="mt-3 flex flex-col gap-1.5 text-[13px]">
          <InspectorAction
            href={`/story?projectPrefill=${encodeURIComponent(project.name)}`}
            icon={<FilmSlate className="size-4" weight="fill" />}
          >
            Draft a story here
          </InspectorAction>
          <InspectorAction
            href={`/vision?projectPrefill=${encodeURIComponent(project.name)}`}
            icon={<Camera className="size-4" weight="fill" />}
          >
            Compose an image here
          </InspectorAction>
          <InspectorAction
            href={`/vault?projectPrefill=${encodeURIComponent(project.name)}`}
            icon={<Vault className="size-4" weight="fill" />}
          >
            Save a prompt here
          </InspectorAction>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
          AI suggestions
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          <SuggestionButton
            prompt={`Given the project “${project.name}”, propose the single most valuable next asset to create. Be specific.`}
            label="Suggest the next asset"
          />
          <SuggestionButton
            prompt={`Summarise everything in project “${project.name}” — what's been made, gaps, and creative direction.`}
            label="Summarise this project"
          />
          <SuggestionButton
            prompt={`Look at project “${project.name}” and identify any unused prompts or images that could be repurposed.`}
            label="Find reuse opportunities"
          />
        </div>
      </section>
    </aside>
  );
}

function InspectorStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line/60 bg-bg px-2.5 py-1.5">
      <p className="text-[10px] uppercase tracking-widest text-faint">{label}</p>
      <p className="text-[15px] font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function InspectorAction({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-lg border border-line/60 bg-bg px-2.5 py-2 text-[13px] text-ink transition-colors hover:border-faint"
    >
      <span className="text-accent-fg">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ArrowRight className="size-3 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function SuggestionButton({ prompt, label }: { prompt: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => openAIDock({ prefill: prompt, autoSend: true })}
      className="group flex items-center gap-2.5 rounded-lg border border-line/60 bg-bg px-2.5 py-2 text-left text-[13px] text-ink transition-colors hover:border-accent/40 hover:bg-accent/[0.03]"
    >
      <Sparkle className="size-4 text-accent-fg" weight="fill" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ArrowRight className="size-3 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
