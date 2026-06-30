"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, TrendUp, Sparkle, Wallet } from "@phosphor-icons/react";

type Note = {
  id: string;
  icon: typeof Bell;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
};

const notes: Note[] = [
  {
    id: "1",
    icon: TrendUp,
    title: "A format is trending in your niche",
    detail: "Trend Lab spotted a rising hook for slow-living creators.",
    time: "12m",
    unread: true,
  },
  {
    id: "2",
    icon: Sparkle,
    title: "Your weekly plan is ready",
    detail: "Three drafts queued from the AI Assistant.",
    time: "3h",
    unread: true,
  },
  {
    id: "3",
    icon: Wallet,
    title: "Affiliate payout cleared",
    detail: "$2,940 from this month's brand collaborations.",
    time: "1d",
    unread: false,
  },
];

export function Notifications() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const unread = notes.filter((n) => n.unread).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        className="relative grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-12 z-50 w-[340px] origin-top-right overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
              <span className="text-[14px] font-medium text-ink">
                Notifications
              </span>
              <button className="text-[12px] text-accent-fg hover:underline">
                Mark all read
              </button>
            </div>
            <ul className="max-h-[360px] overflow-y-auto">
              {notes.map((n) => {
                const Icon = n.icon;
                return (
                  <li
                    key={n.id}
                    className="flex gap-3 border-b border-line-soft px-4 py-3 last:border-0 hover:bg-surface-2"
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line-soft bg-bg text-accent-fg">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
                        {n.detail}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-faint">
                      {n.time}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
