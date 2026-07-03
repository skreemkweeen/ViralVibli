"use client";

/**
 * Shot List modal — the working surface for a campaign's shots.
 *
 * Left rail lists every shot in the active project with type / status /
 * approval at a glance. Right pane inspects the selected shot: prompt,
 * direction summary, status + approval controls, version history, and
 * references. The header chip row spawns new shots of any type.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CheckCircle,
  CircleDashed,
  ClockClockwise,
  FilmSlate,
  Link as LinkIcon,
  NotePencil,
  Plus,
  Trash,
  X,
  XCircle,
} from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import {
  SHOT_TYPE_SPECS,
  type ShotApproval,
  type ShotStatus,
  type ShotType,
} from "@/lib/vision/shots";

const APPROVAL_LABEL: Record<ShotApproval, string> = {
  draft: "Draft",
  "in-review": "In review",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_LABEL: Record<ShotStatus, string> = {
  idle: "Idle",
  queued: "Queued",
  running: "Running",
  done: "Done",
  failed: "Failed",
};

export function ShotListPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    shots,
    createShot,
    removeShot,
    renameShot,
    snapshotShotVersion,
    restoreShotVersionById,
    setShotStatus,
    setShotApproval,
    addReferenceToShot,
    removeReferenceFromShot,
    loadShot,
  } = useVision();
  const reduce = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ShotType | "all">("all");
  const [refDraft, setRefDraft] = useState<{ label: string; url: string }>({
    label: "",
    url: "",
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(
    () => (filter === "all" ? shots : shots.filter((s) => s.type === filter)),
    [shots, filter],
  );

  useEffect(() => {
    if (!open) return;
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].id);
    if (selectedId && !filtered.find((s) => s.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [open, filtered, selectedId]);

  const selected = shots.find((s) => s.id === selectedId) ?? null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto px-4 py-[6vh]"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            aria-label="Close Shot List"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Shot List"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[80vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <FilmSlate className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                    Production
                  </p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">Shot List</h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Plan every shot with its own prompt, camera, lighting, refs
                  and approval status.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="cursor-pointer rounded-full p-1.5 text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <X className="size-4" weight="bold" />
              </button>
            </header>

            {/* Add + filter chips */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-bg/40 px-6 py-3">
              <p className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                Add
              </p>
              {SHOT_TYPE_SPECS.map((spec) => (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => {
                    const id = createShot(spec.id);
                    setSelectedId(id);
                    setFilter(spec.id);
                  }}
                  aria-label={`Add ${spec.label} shot`}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-medium text-muted transition-colors hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  title={spec.hint}
                >
                  <Plus className="size-3" weight="bold" />
                  {spec.label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  aria-pressed={filter === "all"}
                  className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    filter === "all"
                      ? "border-accent/60 bg-accent/10 text-ink"
                      : "border-line text-muted hover:border-faint hover:text-ink"
                  }`}
                >
                  All ({shots.length})
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)]">
              {/* List */}
              <aside className="min-h-0 overflow-y-auto border-r border-line">
                {filtered.length === 0 ? (
                  <div className="p-6 text-center">
                    <FilmSlate className="mx-auto mb-2 size-6 text-faint" />
                    <p className="text-[13px] text-muted">No shots yet.</p>
                    <p className="mt-0.5 text-[11.5px] text-faint">
                      Add one from the chip row above.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-line">
                    {filtered.map((shot) => {
                      const active = shot.id === selectedId;
                      return (
                        <li key={shot.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(shot.id)}
                            aria-current={active ? "true" : undefined}
                            className={`w-full cursor-pointer px-4 py-3 text-left transition-colors ${
                              active
                                ? "bg-accent/[0.06]"
                                : "hover:bg-bg/60"
                            }`}
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="truncate text-[13px] font-medium text-ink">
                                {shot.name}
                              </p>
                              <span className="text-[10px] uppercase tracking-wider text-faint">
                                {shot.type.replace("-", " ")}
                              </span>
                            </div>
                            <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                              <StatusDot status={shot.status} />
                              {STATUS_LABEL[shot.status]}
                              <span className="text-faint">·</span>
                              <ApprovalDot approval={shot.approval} />
                              {APPROVAL_LABEL[shot.approval]}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </aside>

              {/* Inspector */}
              <section className="min-h-0 overflow-y-auto">
                {!selected ? (
                  <div className="flex h-full items-center justify-center p-6 text-[13px] text-muted">
                    Select or add a shot to inspect.
                  </div>
                ) : (
                  <div className="grid gap-4 px-6 py-5">
                    {/* Name + type */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                        {selected.type.replace("-", " ")}
                      </p>
                      <input
                        value={selected.name}
                        onChange={(e) => renameShot(selected.id, e.target.value)}
                        className="mt-0.5 w-full border-0 bg-transparent p-0 text-[18px] font-semibold text-ink focus:outline-none focus:ring-0"
                        aria-label="Rename shot"
                      />
                    </div>

                    {/* Prompt preview */}
                    <div className="rounded-xl border border-line bg-bg p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                        Prompt
                      </p>
                      <p className="text-[12.5px] leading-relaxed text-ink">
                        {selected.prompt}
                      </p>
                    </div>

                    {/* Direction quick summary */}
                    <div className="grid grid-cols-4 gap-2 rounded-xl border border-line bg-bg p-3 text-center text-[11px]">
                      {[
                        ["Aspect", selected.direction.aspect],
                        ["Lens", `${selected.direction.lens ?? "—"}mm`],
                        ["Aperture", `f/${selected.direction.aperture ?? "—"}`],
                        ["Comp", selected.direction.composition ?? "—"],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <p className="uppercase tracking-widest text-faint">
                            {k}
                          </p>
                          <p className="text-ink">{v}</p>
                        </div>
                      ))}
                    </div>

                    {/* Status + approval */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                          Status
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(Object.keys(STATUS_LABEL) as ShotStatus[]).map(
                            (s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setShotStatus(selected.id, s)}
                                aria-pressed={selected.status === s}
                                className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                                  selected.status === s
                                    ? "border-accent/60 bg-accent/10 text-ink"
                                    : "border-line text-muted hover:border-faint hover:text-ink"
                                }`}
                              >
                                {STATUS_LABEL[s]}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                          Approval
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(Object.keys(APPROVAL_LABEL) as ShotApproval[]).map(
                            (a) => (
                              <button
                                key={a}
                                type="button"
                                onClick={() => setShotApproval(selected.id, a)}
                                aria-pressed={selected.approval === a}
                                className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                                  selected.approval === a
                                    ? "border-accent/60 bg-accent/10 text-ink"
                                    : "border-line text-muted hover:border-faint hover:text-ink"
                                }`}
                              >
                                {APPROVAL_LABEL[a]}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    </div>

                    {/* References */}
                    <div>
                      <div className="mb-1 flex items-baseline justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                          References
                        </p>
                        <span className="text-[11px] text-faint">
                          {selected.references.length}
                        </span>
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <input
                          placeholder="Label"
                          value={refDraft.label}
                          onChange={(e) =>
                            setRefDraft({ ...refDraft, label: e.target.value })
                          }
                          className="h-8 min-w-[140px] flex-1 rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                          aria-label="Reference label"
                        />
                        <input
                          placeholder="https://…"
                          value={refDraft.url}
                          onChange={(e) =>
                            setRefDraft({ ...refDraft, url: e.target.value })
                          }
                          className="h-8 min-w-[160px] flex-1 rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                          aria-label="Reference URL"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const label = refDraft.label.trim();
                            const url = refDraft.url.trim();
                            if (!label) return;
                            addReferenceToShot(selected.id, {
                              kind: url ? "url" : "note",
                              label,
                              url: url || undefined,
                            });
                            setRefDraft({ label: "", url: "" });
                          }}
                          className="cursor-pointer rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                          Add
                        </button>
                      </div>
                      {selected.references.length > 0 && (
                        <ul className="grid gap-1">
                          {selected.references.map((r) => (
                            <li
                              key={r.id}
                              className="flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-1.5 text-[12px]"
                            >
                              <LinkIcon className="size-3 text-faint" />
                              {r.url ? (
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate text-ink underline-offset-2 hover:underline"
                                >
                                  {r.label}
                                </a>
                              ) : (
                                <span className="truncate text-ink">
                                  {r.label}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  removeReferenceFromShot(selected.id, r.id)
                                }
                                aria-label={`Remove ${r.label}`}
                                className="ml-auto cursor-pointer rounded-full p-0.5 text-faint transition-colors hover:text-ink"
                              >
                                <Trash className="size-3" weight="bold" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Version history */}
                    <div>
                      <div className="mb-1 flex items-baseline justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                          Version history
                        </p>
                        <button
                          type="button"
                          onClick={() => snapshotShotVersion(selected.id)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-medium text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                          <NotePencil className="size-3" weight="bold" />
                          Snapshot
                        </button>
                      </div>
                      {selected.history.length === 0 ? (
                        <p className="text-[11.5px] text-faint">
                          No versions yet — snapshot to save the current state.
                        </p>
                      ) : (
                        <ul className="grid gap-1">
                          {selected.history.map((v, i) => (
                            <li
                              key={v.id}
                              className="flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-1.5 text-[12px]"
                            >
                              <ClockClockwise className="size-3 text-faint" />
                              <span className="text-ink">
                                v{selected.history.length - i}
                              </span>
                              {v.label && (
                                <span className="text-faint">· {v.label}</span>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  restoreShotVersionById(selected.id, v.id)
                                }
                                className="ml-auto cursor-pointer rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                              >
                                Restore
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 border-t border-line pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          loadShot(selected.id);
                          onClose();
                        }}
                        className="cursor-pointer rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        Load into builder
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete "${selected.name}"?`))
                            removeShot(selected.id);
                        }}
                        className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[12px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <Trash className="size-3" weight="bold" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Status + approval dots ───────────────────────────────────────────────

function StatusDot({ status }: { status: ShotStatus }) {
  const cls: Record<ShotStatus, string> = {
    idle: "bg-line",
    queued: "bg-accent/60",
    running: "bg-accent animate-pulse",
    done: "bg-emerald-400/80",
    failed: "bg-rose-400/80",
  };
  return <span aria-hidden className={`inline-block size-2 rounded-full ${cls[status]}`} />;
}

function ApprovalDot({ approval }: { approval: ShotApproval }) {
  if (approval === "approved") return <CheckCircle className="size-3 text-emerald-400/80" weight="fill" />;
  if (approval === "rejected") return <XCircle className="size-3 text-rose-400/80" weight="fill" />;
  if (approval === "in-review") return <CircleDashed className="size-3 text-accent" weight="bold" />;
  return <span aria-hidden className="inline-block size-2 rounded-full bg-line" />;
}
