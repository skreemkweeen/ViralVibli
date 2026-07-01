"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  Sparkle,
  X,
  Compass,
  Rocket,
  CheckCircle,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useWorkspace } from "@/lib/workspace/store";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/field";

const ONBOARDING_KEY = "vv-onboarding-seen";

type Step = "welcome" | "brand" | "goals" | "done";

const PLATFORM_OPTIONS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "Twitter / X",
  "Pinterest",
];

const VOICE_PRESETS = [
  "warm, editorial",
  "bold, direct",
  "playful, energetic",
  "professional, polished",
  "witty, conversational",
];

function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return true;
  }
}

function markOnboardingSeen(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "1");
  } catch {
    // storage unavailable
  }
}

export function WelcomeModal() {
  const { user } = useAuth();
  const { profile, isEmpty, updateProfile, loadDemo } = useWorkspace();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [brand, setBrand] = useState("");
  const [tagline, setTagline] = useState("");
  const [platform, setPlatform] = useState<string | undefined>();
  const [voice, setVoice] = useState<string | undefined>();
  const brandRef = useRef<HTMLInputElement>(null);

  const firstName = user?.name?.split(" ")[0] ?? "creator";

  // Open the modal once, on first-time visit to any authenticated route, when
  // the workspace is genuinely empty. Users who reset can re-open via Settings.
  useEffect(() => {
    if (!isEmpty) return;
    if (hasSeenOnboarding()) return;
    setOpen(true);
  }, [isEmpty]);

  useEffect(() => {
    if (open && step === "brand") {
      requestAnimationFrame(() => brandRef.current?.focus());
    }
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleClose(): void {
    markOnboardingSeen();
    setOpen(false);
  }

  function handleFinish(): void {
    updateProfile({
      brand: brand.trim() || profile.brand,
      tagline: tagline.trim() || undefined,
      primaryPlatform: platform,
      voice: voice ?? profile.voice,
    });
    setStep("done");
  }

  function handleTryDemo(): void {
    loadDemo();
    markOnboardingSeen();
    setStep("done");
  }

  const totalSteps = 3;
  const stepIndex =
    step === "welcome" ? 1 : step === "brand" ? 2 : step === "goals" ? 3 : 3;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
        >
          <button
            type="button"
            aria-label="Skip onboarding"
            onClick={handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.85)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
              <div className="flex items-center gap-2">
                {step !== "done" && (
                  <span className="font-mono text-[11px] tabular-nums text-faint">
                    Step {stepIndex} of {totalSteps}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Skip for now"
                className="grid size-8 cursor-pointer place-items-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="min-h-[340px] px-6 py-8">
              {step === "welcome" && (
                <div className="flex flex-col items-center text-center">
                  <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-ink">
                    <Sparkle weight="fill" className="size-7" />
                  </span>
                  <h2
                    id="welcome-title"
                    className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-ink"
                  >
                    Welcome, {firstName}.
                  </h2>
                  <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
                    ViralVibli is a creative workspace built for social media
                    creators. A few quick answers and every studio speaks in
                    your brand voice from the first prompt.
                  </p>
                  <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button onClick={() => setStep("brand")} size="md">
                      Set up my workspace
                      <ArrowRight weight="bold" className="size-4" />
                    </Button>
                    <Button onClick={handleTryDemo} variant="ghost" size="md">
                      <Compass weight="regular" className="size-4" />
                      Try the demo instead
                    </Button>
                  </div>
                  <p className="mt-4 text-[11.5px] text-faint">
                    You can revisit this from Settings any time.
                  </p>
                </div>
              )}

              {step === "brand" && (
                <div className="space-y-5">
                  <div>
                    <h2
                      id="welcome-title"
                      className="text-[18px] font-semibold text-ink"
                    >
                      Who are you making for?
                    </h2>
                    <p className="mt-1 text-[13.5px] text-muted">
                      Two lines. The AI Assistant carries these into every
                      response it drafts for you.
                    </p>
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] text-faint">
                      Brand name
                    </span>
                    <Input
                      ref={brandRef}
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Marrow Studio"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] text-faint">
                      Tagline{" "}
                      <span className="text-faint/60">(optional)</span>
                    </span>
                    <Input
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Slow content for makers"
                    />
                  </label>
                </div>
              )}

              {step === "goals" && (
                <div className="space-y-5">
                  <div>
                    <h2
                      id="welcome-title"
                      className="text-[18px] font-semibold text-ink"
                    >
                      Where and how do you post?
                    </h2>
                    <p className="mt-1 text-[13.5px] text-muted">
                      Pick your main platform and a voice. The assistant tunes
                      every draft to match.
                    </p>
                  </div>
                  <div>
                    <span className="mb-2 block text-[12px] text-faint">
                      Primary platform
                    </span>
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label="Primary platform"
                    >
                      {PLATFORM_OPTIONS.map((p) => (
                        <Chip
                          key={p}
                          active={platform === p}
                          onClick={() =>
                            setPlatform((cur) => (cur === p ? undefined : p))
                          }
                        >
                          {p}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="mb-2 block text-[12px] text-faint">
                      Brand voice
                    </span>
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label="Brand voice"
                    >
                      {VOICE_PRESETS.map((v) => (
                        <Chip
                          key={v}
                          active={voice === v}
                          onClick={() =>
                            setVoice((cur) => (cur === v ? undefined : v))
                          }
                        >
                          {v}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === "done" && (
                <div className="flex flex-col items-center text-center">
                  <span className="grid size-14 place-items-center rounded-2xl border border-accent/40 bg-accent/[0.08] text-accent-fg">
                    <CheckCircle weight="fill" className="size-7" />
                  </span>
                  <h2
                    id="welcome-title"
                    className="mt-5 text-[20px] font-semibold text-ink"
                  >
                    You&rsquo;re set up.
                  </h2>
                  <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
                    Your workspace is ready. Open the AI Assistant to draft
                    something, or head to Vision to compose your first shot.
                  </p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <Button href="/assistant" onClick={handleClose} size="md">
                      <Sparkle weight="fill" className="size-4" />
                      Open AI Assistant
                    </Button>
                    <Button
                      href="/dashboard"
                      variant="ghost"
                      onClick={handleClose}
                      size="md"
                    >
                      <Rocket weight="regular" className="size-4" />
                      Explore workspace
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer navigation */}
            {(step === "brand" || step === "goals") && (
              <div className="flex items-center justify-between border-t border-line-soft px-5 py-4">
                <button
                  type="button"
                  onClick={() => setStep(step === "brand" ? "welcome" : "brand")}
                  className="flex cursor-pointer items-center gap-1.5 rounded text-[13px] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                >
                  <ArrowLeft className="size-3.5" />
                  Back
                </button>
                {step === "brand" ? (
                  <Button
                    onClick={() => setStep("goals")}
                    disabled={!brand.trim()}
                    size="md"
                  >
                    Next
                    <ArrowRight weight="bold" className="size-4" />
                  </Button>
                ) : (
                  <Button onClick={handleFinish} size="md">
                    Finish
                    <ArrowRight weight="bold" className="size-4" />
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Exported for the Settings page so users can restart onboarding. */
export function resetOnboarding(): void {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch {
    // storage unavailable
  }
}
