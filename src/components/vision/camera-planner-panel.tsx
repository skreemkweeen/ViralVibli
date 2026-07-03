"use client";

/**
 * Camera Planner modal — live SVG diagrams reflecting the current
 * Direction (body / lens / aperture / composition height).
 *
 * The diagrams are deterministic; picking a lens or aperture in the
 * control panel updates them without any AI round-trip.
 */

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Camera as CameraIcon, X } from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import {
  computeSideView,
  computeTopView,
  type CameraSideView,
  type CameraTopView,
} from "@/lib/vision/camera-planner";

export function CameraPlannerPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { direction } = useVision();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const top = useMemo(() => computeTopView(direction), [direction]);
  const side = useMemo(() => computeSideView(direction), [direction]);

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
            aria-label="Close Camera Planner"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Camera Planner"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[920px] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <CameraIcon className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                    Optics
                  </p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">
                  Camera Planner
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Live top + side views derived from the Direction. Change lens,
                  aperture, or composition and the geometry follows.
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

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              <DiagramCard title="Top view" caption={topCaption(top)}>
                <TopViewSvg view={top} />
              </DiagramCard>
              <DiagramCard title="Side view" caption={sideCaption(side)}>
                <SideViewSvg view={side} />
              </DiagramCard>
            </div>

            <SpecStrip top={top} side={side} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DiagramCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-bg p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
          {title}
        </p>
        <p className="text-[11px] text-muted tabular-nums">{caption}</p>
      </div>
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-line/60 bg-surface">
        {children}
      </div>
    </section>
  );
}

// ─── Top view ──────────────────────────────────────────────────────

function TopViewSvg({ view }: { view: CameraTopView }) {
  // Scene metres → SVG viewBox units. We frame ~5m of range.
  const SCALE = 20; // 1m = 20 units
  const cx = 200;
  const cy = 240;

  const subjPx = { x: cx, y: cy };
  const camPx = { x: cx + view.camera.x * SCALE, y: cy - view.camera.y * SCALE };
  const leftPx = {
    x: cx + view.frustum.left.x * SCALE,
    y: cy - view.frustum.left.y * SCALE,
  };
  const rightPx = {
    x: cx + view.frustum.right.x * SCALE,
    y: cy - view.frustum.right.y * SCALE,
  };
  const dofNearPx = cy - view.dofNear * SCALE;
  const dofFarPx = cy - Math.min(view.dofFar, 20) * SCALE;

  return (
    <svg viewBox="0 0 400 300" className="h-full w-full text-ink">
      {/* Grid */}
      {[0.5, 1, 2, 3].map((r) => (
        <circle
          key={r}
          cx={cx}
          cy={cy}
          r={r * SCALE}
          className="fill-none stroke-line"
          strokeDasharray="3 4"
          strokeOpacity="0.35"
        />
      ))}
      {/* FOV cone */}
      <polygon
        points={`${camPx.x},${camPx.y} ${leftPx.x},${leftPx.y} ${rightPx.x},${rightPx.y}`}
        className="fill-accent/10 stroke-accent"
        strokeOpacity="0.5"
      />
      {/* DOF band */}
      <rect
        x={leftPx.x - 4}
        y={dofFarPx}
        width={rightPx.x - leftPx.x + 8}
        height={dofNearPx - dofFarPx}
        className="fill-accent/20"
        opacity="0.35"
      />
      {/* Subject */}
      <circle cx={subjPx.x} cy={subjPx.y} r="8" className="fill-accent" />
      <text
        x={subjPx.x}
        y={subjPx.y + 22}
        textAnchor="middle"
        className="fill-current text-[10px] opacity-70"
      >
        subject
      </text>
      {/* Camera */}
      <rect
        x={camPx.x - 12}
        y={camPx.y - 6}
        width="24"
        height="14"
        rx="2"
        className="fill-ink"
      />
      <circle cx={camPx.x} cy={camPx.y} r="4" className="fill-accent" />
      <text
        x={camPx.x}
        y={camPx.y + 22}
        textAnchor="middle"
        className="fill-current text-[10px] opacity-70"
      >
        camera
      </text>
    </svg>
  );
}

function topCaption(v: CameraTopView): string {
  const fov = Math.round((v.halfFov * 2 * 180) / Math.PI);
  return `${v.focalMm}mm · f/${v.fStop} · ${fov}° H-FOV · ${v.distance.toFixed(1)}m`;
}

// ─── Side view ─────────────────────────────────────────────────────

function SideViewSvg({ view }: { view: CameraSideView }) {
  const SCALE_X = 40; // metres to px, horizontal
  const SCALE_Y = 40;
  const groundY = 260;
  const originX = 60;

  const subjX = originX + view.distance * SCALE_X;
  const subjTop = groundY - view.subjectHeight * SCALE_Y;
  const camY = groundY - view.cameraHeight * SCALE_Y;

  return (
    <svg viewBox="0 0 400 300" className="h-full w-full text-ink">
      {/* Ground */}
      <line
        x1="20"
        y1={groundY}
        x2="380"
        y2={groundY}
        className="stroke-line"
        strokeWidth="1.2"
      />
      {/* Height gridlines */}
      {[0.5, 1, 1.5, 2, 2.5, 3].map((h) => (
        <g key={h}>
          <line
            x1="20"
            y1={groundY - h * SCALE_Y}
            x2="380"
            y2={groundY - h * SCALE_Y}
            className="stroke-line"
            strokeOpacity="0.15"
          />
          <text
            x="14"
            y={groundY - h * SCALE_Y + 3}
            className="fill-current text-[9px] opacity-40"
            textAnchor="end"
          >
            {h}m
          </text>
        </g>
      ))}
      {/* Aim line */}
      <line
        x1={originX + 22}
        y1={camY}
        x2={subjX}
        y2={subjTop + view.subjectHeight * SCALE_Y * 0.1}
        className="stroke-accent"
        strokeOpacity="0.7"
        strokeDasharray="4 4"
      />
      {/* Subject silhouette (product-agnostic capsule) */}
      <rect
        x={subjX - 10}
        y={subjTop}
        width="20"
        height={view.subjectHeight * SCALE_Y}
        rx="8"
        className="fill-accent"
        opacity="0.8"
      />
      <text
        x={subjX}
        y={subjTop - 6}
        textAnchor="middle"
        className="fill-current text-[10px] opacity-70"
      >
        subject
      </text>
      {/* Camera + tripod */}
      <rect
        x={originX - 4}
        y={camY - 6}
        width="26"
        height="14"
        rx="2"
        className="fill-ink"
      />
      <line
        x1={originX + 9}
        y1={camY + 8}
        x2={originX + 9}
        y2={groundY}
        className="stroke-ink"
        strokeWidth="1.4"
      />
      <text
        x={originX + 9}
        y={camY - 10}
        textAnchor="middle"
        className="fill-current text-[10px] opacity-70"
      >
        camera
      </text>
    </svg>
  );
}

function sideCaption(v: CameraSideView): string {
  const tiltDeg = Math.round((v.tiltRad * 180) / Math.PI);
  return `H ${v.cameraHeight.toFixed(1)}m · Tilt ${tiltDeg > 0 ? "-" : "+"}${Math.abs(tiltDeg)}°`;
}

function SpecStrip({
  top,
  side,
}: {
  top: CameraTopView;
  side: CameraSideView;
}) {
  const fovDeg = Math.round((top.halfFov * 2 * 180) / Math.PI);
  const tiltDeg = Math.round((side.tiltRad * 180) / Math.PI);
  const rows: Array<[string, string]> = [
    ["Focal", `${top.focalMm}mm`],
    ["Aperture", `f/${top.fStop}`],
    ["H-FOV", `${fovDeg}°`],
    ["Distance", `${top.distance.toFixed(2)}m`],
    ["DOF near", `${top.dofNear.toFixed(2)}m`],
    ["DOF far", top.dofFar > 15 ? "∞" : `${top.dofFar.toFixed(1)}m`],
    ["Height", `${side.cameraHeight.toFixed(1)}m`],
    ["Tilt", `${tiltDeg > 0 ? "-" : "+"}${Math.abs(tiltDeg)}°`],
  ];
  return (
    <div className="grid grid-cols-4 gap-2 border-t border-line px-6 py-3 sm:grid-cols-8">
      {rows.map(([k, v]) => (
        <div key={k} className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-faint">
            {k}
          </p>
          <p className="text-[13px] font-medium tabular-nums text-ink">{v}</p>
        </div>
      ))}
    </div>
  );
}
