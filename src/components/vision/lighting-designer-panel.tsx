"use client";

/**
 * Lighting Designer modal — 6 canonical lights around a subject, each
 * tunable (intensity, softness, temperature, angle, modifier), plus a
 * live polar SVG diagram that reflects the rig in real time.
 *
 * Presets seed a well-formed rig in one click; manual edits clear the
 * preset badge so the creator always knows if they are on-preset or off.
 */

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Lightbulb, X } from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import {
  LIGHTING_PRESETS,
  LIGHT_ROLES,
  computeLightingDiagram,
  kelvinToHex,
  type Light,
  type LightModifier,
  type LightRole,
} from "@/lib/vision/lighting";

const ROLE_LABEL: Record<LightRole, string> = {
  key: "Key",
  fill: "Fill",
  rim: "Rim",
  hair: "Hair",
  practical: "Practical",
  ambient: "Ambient",
};

const MODIFIERS: LightModifier[] = [
  "softbox",
  "octabox",
  "umbrella",
  "grid",
  "window",
  "bounce",
  "flag",
  "reflector",
  "none",
];

export function LightingDesignerPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    lightingSetup,
    updateLightConfig,
    applyLightingPreset,
    resetLighting,
  } = useVision();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const nodes = useMemo(
    () => computeLightingDiagram(lightingSetup, 90),
    [lightingSetup],
  );

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
            aria-label="Close Lighting Designer"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Lighting Designer"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[1080px] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            {/* Header */}
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <Lightbulb className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                    Studio rig
                  </p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">
                  Lighting Designer
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Six canonical lights around the subject. Tune each or seed
                  from a preset — the diagram updates live.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Reset all lights to defaults?")) resetLighting();
                  }}
                  className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="cursor-pointer rounded-full p-1.5 text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <X className="size-4" weight="bold" />
                </button>
              </div>
            </header>

            {/* Preset chips */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-bg/40 px-6 py-3">
              <p className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                Presets
              </p>
              {LIGHTING_PRESETS.map((p) => {
                const active = lightingSetup.presetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyLightingPreset(p.id)}
                    aria-pressed={active}
                    aria-label={`Apply ${p.label} preset`}
                    className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                      active
                        ? "border-accent/60 bg-accent/10 text-ink"
                        : "border-line bg-surface text-muted hover:border-faint hover:text-ink"
                    }`}
                    title={p.vibe}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Body — diagram + controls */}
            <div className="grid gap-4 px-6 py-5 lg:grid-cols-[280px_minmax(0,1fr)]">
              <LightingDiagram nodes={nodes} />
              <div className="grid gap-2">
                {LIGHT_ROLES.map((role) => (
                  <LightRow
                    key={role}
                    role={role}
                    light={lightingSetup.lights[role]}
                    onChange={(patch) => updateLightConfig(role, patch)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Diagram ──────────────────────────────────────────────────────

function LightingDiagram({
  nodes,
}: {
  nodes: ReturnType<typeof computeLightingDiagram>;
}) {
  const cx = 130;
  const cy = 130;
  return (
    <div className="rounded-2xl border border-line bg-bg p-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
        Rig diagram
      </p>
      <div className="aspect-square w-full overflow-hidden rounded-xl border border-line/60 bg-surface">
        <svg viewBox="0 0 260 260" className="h-full w-full text-ink">
          {/* Range rings */}
          {[0.4, 0.7, 1].map((r) => (
            <circle
              key={r}
              cx={cx}
              cy={cy}
              r={r * 100}
              className="fill-none stroke-line"
              strokeOpacity="0.25"
              strokeDasharray="3 4"
            />
          ))}
          {/* Camera indicator (below subject in top-down orientation) */}
          <rect
            x={cx - 14}
            y={cy + 110}
            width="28"
            height="12"
            rx="2"
            className="fill-ink"
          />
          <line
            x1={cx}
            y1={cy + 110}
            x2={cx}
            y2={cy}
            className="stroke-line"
            strokeDasharray="4 4"
            strokeOpacity="0.4"
          />
          {/* Subject */}
          <circle cx={cx} cy={cy} r="10" className="fill-accent" />
          <text
            x={cx}
            y={cy + 26}
            textAnchor="middle"
            className="fill-current text-[9px] opacity-60"
          >
            subject
          </text>
          {/* Lights */}
          {nodes.map((n) => {
            const px = cx + n.x;
            const py = cy + n.y;
            const size = 8 + (n.intensity / 100) * 12;
            const opacity = n.active ? 1 : 0.25;
            return (
              <g key={n.role} opacity={opacity}>
                {n.active && (
                  <line
                    x1={cx}
                    y1={cy}
                    x2={px}
                    y2={py}
                    stroke={n.colorHex}
                    strokeOpacity="0.35"
                    strokeWidth="1.2"
                  />
                )}
                <circle
                  cx={px}
                  cy={py}
                  r={size / 2}
                  fill={n.colorHex}
                  stroke="currentColor"
                  strokeOpacity="0.4"
                  strokeWidth="1"
                />
                <text
                  x={px}
                  y={py + size / 2 + 12}
                  textAnchor="middle"
                  className="fill-current text-[9px]"
                >
                  {ROLE_LABEL[n.role]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Per-light control row ─────────────────────────────────────────

function LightRow({
  role,
  light,
  onChange,
}: {
  role: LightRole;
  light: Light;
  onChange: (patch: Partial<Light>) => void;
}) {
  const swatch = kelvinToHex(light.temperature);
  return (
    <div
      className={`rounded-xl border transition-colors ${
        light.enabled
          ? "border-accent/40 bg-accent/[0.03]"
          : "border-line bg-bg"
      }`}
    >
      <header className="flex items-center gap-2 border-b border-line/60 px-3 py-2">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={light.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="size-3.5 cursor-pointer accent-[color:var(--accent)]"
            aria-label={`Enable ${ROLE_LABEL[role]} light`}
          />
          <span className="text-[13px] font-medium text-ink">
            {ROLE_LABEL[role]}
          </span>
        </label>
        <span
          className="ml-1 size-3 rounded-full border border-line/60"
          style={{ background: swatch }}
          aria-hidden="true"
        />
        <span className="ml-auto text-[11px] tabular-nums text-faint">
          {light.intensity}% · {light.temperature}K · {light.angle}°
        </span>
      </header>
      <div className="grid gap-2 px-3 py-2 sm:grid-cols-2">
        <Slider
          label="Intensity"
          min={0}
          max={100}
          value={light.intensity}
          suffix="%"
          onChange={(v) => onChange({ intensity: v })}
        />
        <Slider
          label="Softness"
          min={0}
          max={100}
          value={light.softness}
          suffix="%"
          onChange={(v) => onChange({ softness: v })}
        />
        <Slider
          label="Temp"
          min={2000}
          max={9000}
          step={100}
          value={light.temperature}
          suffix="K"
          onChange={(v) => onChange({ temperature: v })}
        />
        <Slider
          label="Angle"
          min={-180}
          max={180}
          value={light.angle}
          suffix="°"
          onChange={(v) => onChange({ angle: v })}
        />
        <label className="flex items-center gap-2 text-[11px] sm:col-span-2">
          <span className="w-16 text-faint">Modifier</span>
          <select
            value={light.modifier}
            onChange={(e) =>
              onChange({ modifier: e.target.value as LightModifier })
            }
            className="h-7 flex-1 rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {MODIFIERS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  suffix,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[11px]">
      <span className="w-14 text-faint">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[color:var(--accent)]"
        aria-label={label}
      />
      <span className="w-12 shrink-0 text-right tabular-nums text-muted">
        {value}
        {suffix ?? ""}
      </span>
    </label>
  );
}
