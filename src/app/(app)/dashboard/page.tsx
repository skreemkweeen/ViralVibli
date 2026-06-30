"use client";

import Link from "next/link";
import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-provider";
import { appModules } from "@/lib/modules/registry";

const stats = [
  { label: "Saves this week", value: "3,418", trend: "+18%" },
  { label: "Reach", value: "214k", trend: "+41%" },
  { label: "New followers", value: "1,902", trend: "+6%" },
  { label: "Revenue", value: "$2,940", trend: "+9%" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "creator";

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-[-0.03em]">
          Good to see you, {firstName}.
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Here is where things stand, and what to make next.
        </p>
      </header>

      {/* stat row */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <p className="text-[13px] text-muted">{s.label}</p>
            <p className="mt-2 font-mono text-[26px] font-medium tabular-nums text-ink">
              {s.value}
            </p>
            <p className="mt-0.5 font-mono text-[12px] text-accent-fg">
              {s.trend}
            </p>
          </div>
        ))}
      </section>

      {/* assistant CTA */}
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
              Draft a post, plan your week, or analyze what is working.
            </p>
          </div>
        </div>
        <ArrowRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-1" />
      </Link>

      {/* studios */}
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
                  <p className="mt-4 text-[15px] font-medium text-ink">
                    {m.name}
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-muted">
                    {m.blurb}
                  </p>
                </Link>
              );
            })}
        </div>
      </section>
    </div>
  );
}
