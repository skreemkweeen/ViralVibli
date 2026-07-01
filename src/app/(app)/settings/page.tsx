"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useTheme, type Theme } from "@/components/app/theme-provider";
import { useWorkspace } from "@/lib/workspace/store";
import { Check, CheckCircle } from "@phosphor-icons/react";
import { Card as UiCard } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Tab = "profile" | "brand" | "appearance" | "notifications" | "billing";
const tabs: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "brand", label: "Brand & AI" },
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
              className={`cursor-pointer shrink-0 rounded-lg px-3 py-2 text-left text-[14px] transition-colors active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
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
          {tab === "brand" && <BrandSection />}
          {tab === "appearance" && <AppearanceSection />}
          {tab === "notifications" && <NotificationsSection />}
          {tab === "billing" && <BillingSection />}
        </div>
      </div>
    </div>
  );
}

const VOICE_PRESETS = [
  "calm, warm",
  "bold, direct",
  "playful, energetic",
  "professional, polished",
  "witty, conversational",
  "aspirational, inspiring",
];

const PLATFORM_OPTIONS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "Twitter / X",
  "Pinterest",
];

function BrandSection() {
  const { profile, updateProfile } = useWorkspace();
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState({ ...profile });

  const handleSave = () => {
    updateProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <UiCard padding="lg">
        <h2 className="text-[15px] font-medium text-ink">Brand Identity</h2>
        <p className="mt-1 text-[13px] text-muted">
          The AI Assistant uses this to match your voice and brand in every
          response.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12px] text-faint">Brand name</span>
            <Input
              value={draft.brand}
              onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
              placeholder="Your Brand"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] text-faint">Tagline</span>
            <Input
              value={draft.tagline ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
              placeholder="What you stand for"
            />
          </label>
        </div>
        <div className="mt-4">
          <span className="mb-2 block text-[12px] text-faint">Primary platform</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Primary platform">
            {PLATFORM_OPTIONS.map((p) => (
              <Chip
                key={p}
                active={draft.primaryPlatform === p}
                onClick={() => setDraft((d) => ({ ...d, primaryPlatform: p }))}
              >
                {p}
              </Chip>
            ))}
          </div>
        </div>
      </UiCard>

      <UiCard padding="lg">
        <h2 className="text-[15px] font-medium text-ink">Brand Voice</h2>
        <p className="mt-1 text-[13px] text-muted">
          How your brand sounds. The assistant writes in this voice.
        </p>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Voice preset">
          {VOICE_PRESETS.map((v) => (
            <Chip
              key={v}
              active={draft.voice === v}
              onClick={() => setDraft((d) => ({ ...d, voice: v }))}
            >
              {v}
            </Chip>
          ))}
        </div>
        <div className="mt-3">
          <label className="sr-only" htmlFor="brand-voice-custom">Custom voice</label>
          <Input
            id="brand-voice-custom"
            value={draft.voice}
            onChange={(e) => setDraft((d) => ({ ...d, voice: e.target.value }))}
            placeholder="Or describe your own voice..."
          />
        </div>
      </UiCard>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} aria-live="polite">
          {saved ? (
            <span className="flex items-center gap-2">
              <CheckCircle weight="fill" className="size-4" /> Saved
            </span>
          ) : (
            "Save brand settings"
          )}
        </Button>
        <p className="text-[12px] text-faint">
          Changes apply immediately to AI responses.
        </p>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] text-faint">{label}</span>
      <Input defaultValue={value} />
    </label>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  return (
    <UiCard padding="lg">
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
        <ReadOnlyField label="Display name" value={user?.name ?? ""} />
        <ReadOnlyField label="Email" value={user?.email ?? ""} />
      </div>
      <div className="mt-6">
        <Button>Save changes</Button>
      </div>
    </UiCard>
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
    <UiCard padding="lg">
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
              aria-pressed={selected}
              className={`flex cursor-pointer flex-col items-start rounded-xl border p-4 text-left transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
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
    </UiCard>
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
    <UiCard padding="lg">
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
    </UiCard>
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
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
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
    <UiCard padding="lg">
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
        <Button>Manage subscription</Button>
        <Button variant="ghost">View invoices</Button>
      </div>
    </UiCard>
  );
}
