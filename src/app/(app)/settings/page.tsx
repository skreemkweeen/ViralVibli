"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useTheme, type Theme } from "@/components/app/theme-provider";
import { Check } from "@phosphor-icons/react";

type Tab = "profile" | "appearance" | "notifications" | "billing";
const tabs: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "notifications", label: "Notifications" },
  { id: "billing", label: "Billing" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[clamp(1.6rem,4vw,2.2rem)] font-semibold tracking-[-0.03em]">
          Settings
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Manage your account, workspace, and preferences.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "true" : undefined}
              className={`shrink-0 rounded-lg px-3 py-2 text-left text-[14px] transition-colors ${
                tab === t.id
                  ? "bg-surface-2 font-medium text-ink"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {tab === "profile" && <ProfileSection />}
          {tab === "appearance" && <AppearanceSection />}
          {tab === "notifications" && <NotificationsSection />}
          {tab === "billing" && <BillingSection />}
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">{children}</div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-muted">{label}</span>
      <input
        defaultValue={value}
        className="h-11 w-full rounded-xl border border-line bg-bg px-3.5 text-[14px] text-ink focus:border-faint focus:outline-none"
      />
    </label>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  return (
    <Card>
      <div className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-2xl bg-accent text-[20px] font-semibold text-accent-ink">
          {user?.initials ?? "VV"}
        </span>
        <div>
          <p className="text-[16px] font-medium text-ink">{user?.name}</p>
          <p className="text-[13px] text-faint">{user?.plan} plan</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Display name" value={user?.name ?? ""} />
        <Field label="Email" value={user?.email ?? ""} />
      </div>
      <div className="mt-6">
        <button className="h-11 rounded-full bg-accent px-6 text-[14px] font-medium text-accent-ink hover:bg-[#d6f56b]">
          Save changes
        </button>
      </div>
    </Card>
  );
}

const themeOptions: { id: Theme; label: string; hint: string }[] = [
  { id: "light", label: "Light", hint: "Bright surfaces" },
  { id: "dark", label: "Dark", hint: "The default" },
  { id: "system", label: "System", hint: "Match your OS" },
];

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  return (
    <Card>
      <h2 className="text-[15px] font-medium text-ink">Theme</h2>
      <p className="mt-1 text-[13px] text-muted">
        Choose how the workspace looks. The marketing site stays dark by design.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {themeOptions.map((o) => {
          const selected = theme === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setTheme(o.id)}
              className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? "border-accent/50 bg-accent/[0.06]"
                  : "border-line hover:border-faint"
              }`}
            >
              <span className="flex w-full items-center justify-between">
                <span className="text-[14px] font-medium text-ink">
                  {o.label}
                </span>
                {selected && <Check weight="bold" className="size-4 text-accent-fg" />}
              </span>
              <span className="mt-1 text-[12.5px] text-faint">{o.hint}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function NotificationsSection() {
  const items = [
    { label: "Trend alerts", detail: "When a format is rising in your niche." },
    { label: "Weekly plan ready", detail: "When new drafts are queued for you." },
    { label: "Revenue events", detail: "Payouts, brand deals, and milestones." },
    { label: "Product updates", detail: "New studios and features." },
  ];
  return (
    <Card>
      <h2 className="text-[15px] font-medium text-ink">Email notifications</h2>
      <ul className="mt-4 divide-y divide-line-soft">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center justify-between py-4">
            <div>
              <p className="text-[14px] text-ink">{it.label}</p>
              <p className="text-[12.5px] text-faint">{it.detail}</p>
            </div>
            <Toggle defaultOn={i < 3} label={it.label} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Toggle({ defaultOn, label }: { defaultOn: boolean; label: string }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn((v) => !v)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        on ? "bg-accent" : "bg-surface-2"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-bg transition-transform ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function BillingSection() {
  const { user } = useAuth();
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-medium text-ink">
            {user?.plan} plan
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            Renews monthly. Cancel anytime, keep what you have made.
          </p>
        </div>
        <span className="font-mono text-[22px] font-medium text-ink">$24</span>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="h-11 rounded-full bg-accent px-6 text-[14px] font-medium text-accent-ink hover:bg-[#d6f56b]">
          Manage subscription
        </button>
        <button className="h-11 rounded-full border border-line px-6 text-[14px] text-ink hover:border-faint">
          View invoices
        </button>
      </div>
    </Card>
  );
}
