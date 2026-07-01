"use client";

import Link from "next/link";
import { ArrowRight, Sparkle, FolderSimple, Clock } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useWorkspace } from "@/lib/workspace/store";
import { appModules } from "@/lib/modules/registry";
import { useEffect, useState } from "react";
import { PROJECT_COLORS } from "@/lib/workspace/types";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects, activity, hydrated } = useWorkspace();
  const [vaultCount, setVaultCount] = useState(0);
  const firstName = user?.name?.split(" ")[0] ?? "creator";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("vv-vault-prompts");
      if (raw) setVaultCount((JSON.parse(raw) as unknown[]).length);
    } catch {
      // storage unavailable
    }
  }, []);

  const recentActivity = activity.slice(0, 4);
  const recentProjects = projects.slice(0, 3);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-[-0.03em]">
          Good to see you, {firstName}.
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          {projects.length > 0
            ? `${projects.length} active ${projects.length === 1 ? "project" : "projects"} · ${vaultCount > 0 ? `${vaultCount} prompts in Vault` : "Your workspace"}`
            : "Your creative workspace. Start a project or jump into a studio."}
        </p>
      </header>

      {/* Stat row — mix of real and contextual */}
      {hydrated && (vaultCount > 0 || projects.length > 0) ? (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Projects" value={String(projects.length)} href="/projects" />
          <StatCard label="Vault Prompts" value={String(vaultCount)} href="/vault" />
          <StatCard label="AI Conversations" value={String(activity.filter((a) => a.type === "chat-sent").length)} href="/assistant" />
          <StatCard label="Recent Activity" value={String(activity.length)} href="/projects" />
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Saves this week", value: "3,418", trend: "+18%" },
            { label: "Reach", value: "214k", trend: "+41%" },
            { label: "New followers", value: "1,902", trend: "+6%" },
            { label: "Revenue", value: "$2,940", trend: "+9%" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-[13px] text-muted">{s.label}</p>
              <p className="mt-2 font-mono text-[26px] font-medium tabular-nums text-ink">
                {s.value}
              </p>
              <p className="mt-0.5 font-mono text-[12px] text-accent-fg">{s.trend}</p>
            </div>
          ))}
        </section>
      )}

      {/* AI assistant CTA */}
      <Link
        href="/assistant"
        className="group flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/[0.12] to-surface p-6 transition-colors hover:border-accent/50"
      >
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink">
            <Sparkle weight="fill" className="size-6" />
          </span>
          <div>
            <p className="text-[17px] font-medium text-ink">
              Start with the AI Assistant
            </p>
            <p className="mt-0.5 text-[14px] text-muted">
              Draft a post, plan your week, build a campaign, or ask anything.
            </p>
          </div>
        </div>
        <ArrowRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-1" />
      </Link>

      {/* Projects section */}
      {hydrated && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-ink">
              {recentProjects.length > 0 ? "Recent projects" : "Projects"}
            </h2>
            <Link
              href="/projects"
              className="text-[13px] text-faint transition-colors hover:text-muted"
            >
              {projects.length > 3 ? `See all ${projects.length}` : "Manage"}
              <ArrowRight className="ml-1 inline size-3.5" />
            </Link>
          </div>

          {recentProjects.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentProjects.map((project) => {
                const colors = PROJECT_COLORS[project.color];
                return (
                  <Link
                    key={project.id}
                    href="/projects"
                    className={`flex flex-col rounded-2xl border border-line border-l-[3px] bg-surface p-5 transition-colors hover:border-line/80 ${colors.border}`}
                  >
                    <div
                      className={`mb-3 size-7 rounded-lg ${colors.dot} opacity-70`}
                    />
                    <p className="text-[14px] font-medium text-ink">
                      {project.name}
                    </p>
                    {project.description && (
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-muted">
                        {project.description}
                      </p>
                    )}
                    <p className="mt-3 text-[11px] text-faint">
                      {project.items.length} items · {timeAgo(project.updatedAt)}
                    </p>
                  </Link>
                );
              })}
              <Link
                href="/projects"
                className="flex flex-col items-center justify-center rounded-2xl border border-line border-dashed bg-surface/50 p-5 text-center transition-colors hover:border-faint"
              >
                <FolderSimple className="size-6 text-faint" />
                <p className="mt-2 text-[13px] text-faint">New project</p>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-2xl border border-line border-dashed bg-surface/50 p-6">
              <FolderSimple className="size-8 shrink-0 text-faint" />
              <div>
                <p className="text-[14px] font-medium text-ink">No projects yet</p>
                <p className="mt-0.5 text-[13px] text-muted">
                  Group your stories, prompts, and assets into campaigns.
                </p>
              </div>
              <Link
                href="/projects"
                className="ml-auto shrink-0 rounded-xl border border-line px-3.5 py-2 text-[13px] text-muted transition-colors hover:text-ink"
              >
                Create one
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Activity feed */}
      {recentActivity.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-ink">Recent activity</h2>
          </div>
          <div className="space-y-0.5">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface"
              >
                <Clock className="size-3.5 shrink-0 text-faint" />
                <span className="flex-1 text-[13px] text-muted">{item.title}</span>
                <span className="shrink-0 text-[12px] text-faint">
                  {timeAgo(item.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Studios */}
      <section>
        <h2 className="mb-4 text-[15px] font-medium text-ink">Your studios</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {appModules
            .filter((m) => m.id !== "assistant")
            .map((m) => {
              const Icon = m.icon;
              const live = m.status === "live";
              return (
                <Link
                  key={m.id}
                  href={m.href}
                  className="group flex flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-faint"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl border border-line-soft bg-bg text-accent-fg">
                      <Icon className="size-5" />
                    </span>
                    {!live && (
                      <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-faint">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-[15px] font-medium text-ink">{m.name}</p>
                  <p className="mt-1 text-[13px] leading-snug text-muted">{m.blurb}</p>
                </Link>
              );
            })}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-faint"
    >
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-2 font-mono text-[26px] font-medium tabular-nums text-ink">
        {value}
      </p>
    </Link>
  );
}
