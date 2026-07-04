"use client";

/**
 * Campaigns panel — three tabs: Templates (14), Built campaigns (in
 * this project), Frameworks (17 narrative frameworks).
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Books, Sparkle, Trash, X } from "@phosphor-icons/react";
import { useStory } from "@/lib/story/store";
import { CAMPAIGN_TEMPLATES } from "@/lib/story/story-campaigns";
import { frameworks as FRAMEWORKS } from "@/lib/story/frameworks";

type Tab = "templates" | "built" | "frameworks";

export function CampaignsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    campaigns,
    createCampaignFromTemplate,
    removeCampaign,
    setActiveCampaign,
    setActiveStory,
    activeCampaignId,
    stories,
  } = useStory();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("templates");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
            aria-label="Close campaigns"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Campaigns"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[85vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <Sparkle className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                    Campaigns
                  </p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">
                  Campaign Builder
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Templates seed a Campaign → Sequences → Stories → Slides hierarchy.
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

            <div className="flex items-center gap-1 border-b border-line bg-bg/40 px-6 py-2">
              {[
                { id: "templates" as const, label: "Templates" },
                { id: "built" as const, label: `Built (${campaigns.length})` },
                { id: "frameworks" as const, label: "Frameworks" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-pressed={tab === id}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    tab === id
                      ? "border-accent/60 bg-accent/10 text-ink"
                      : "border-transparent text-muted hover:border-line hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "templates" && (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {CAMPAIGN_TEMPLATES.map((t) => (
                    <li key={t.id} className="rounded-xl border border-line bg-bg p-3">
                      <p className="text-[13px] font-semibold text-ink">{t.name}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{t.hint}</p>
                      <p className="mt-1 text-[10.5px] uppercase tracking-widest text-faint">
                        {t.sequences.reduce((n, s) => n + s.stories.length, 0)} story · {t.platforms.join(" · ")}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          createCampaignFromTemplate(t.id);
                          setTab("built");
                        }}
                        className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        Build campaign
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "built" && (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {campaigns.length === 0 ? (
                  <p className="text-[13px] text-muted">
                    None yet — build one from a template.
                  </p>
                ) : (
                  <ul className="grid gap-2">
                    {campaigns.map((c) => (
                      <li
                        key={c.id}
                        className={`rounded-xl border p-3 transition-colors ${
                          c.id === activeCampaignId
                            ? "border-accent/60 bg-accent/[0.06]"
                            : "border-line bg-bg"
                        }`}
                      >
                        <div className="flex items-baseline justify-between">
                          <p className="text-[13px] font-semibold text-ink">{c.name}</p>
                          <span className="text-[10.5px] uppercase tracking-widest text-faint">
                            {c.sequences.reduce((n, s) => n + s.storyIds.length, 0)} story
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted">{c.goal}</p>
                        <ul className="mt-2 grid gap-0.5 text-[11px]">
                          {c.sequences.map((seq) => (
                            <li key={seq.id} className="flex items-center gap-1">
                              <span className="text-faint">▸</span>
                              <span className="text-ink">{seq.label}</span>
                              <span className="text-faint">— {seq.storyIds.length} story</span>
                              {seq.storyIds.map((sid) => {
                                const story = stories.find((s) => s.id === sid);
                                return story ? (
                                  <button
                                    key={sid}
                                    type="button"
                                    onClick={() => {
                                      setActiveCampaign(c.id);
                                      setActiveStory(sid);
                                    }}
                                    className="rounded-full border border-line px-1.5 py-0.5 text-[10.5px] text-muted hover:border-faint hover:text-ink"
                                  >
                                    {story.name}
                                  </button>
                                ) : null;
                              })}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveCampaign(c.id)}
                            className="rounded-full border border-line px-3 py-0.5 text-[11.5px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            Set active
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete ${c.name}?`)) removeCampaign(c.id);
                            }}
                            className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-3 py-0.5 text-[11.5px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            <Trash className="size-3" weight="bold" />
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === "frameworks" && (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <div className="mb-3 inline-flex items-center gap-2">
                  <Books className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[13px] font-semibold text-ink">17 narrative frameworks</p>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {FRAMEWORKS.map((f) => (
                    <li key={f.id} className="rounded-xl border border-line bg-bg p-3">
                      <p className="text-[13px] font-semibold text-ink">{f.name}</p>
                      <p className="text-[11px] uppercase tracking-widest text-faint">{f.tagline}</p>
                      <p className="mt-1 text-[11.5px] text-muted">{f.description}</p>
                      <ul className="mt-2 grid gap-0.5 text-[11px] text-muted">
                        {f.beats.map((b, i) => (
                          <li key={i}>· {b}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
