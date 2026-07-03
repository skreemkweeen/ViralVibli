/**
 * Camera Planner — deterministic 2D geometry for the interactive camera
 * diagram.
 *
 * Given the current Direction (camera body, focal length, aperture, and a
 * few derived choices), this module produces:
 *
 *   - Top-view geometry: subject at origin, camera position + FOV cone,
 *     depth-of-field near/far markers
 *   - Side-view geometry: subject silhouette, camera height, tilt angle,
 *     lens height
 *
 * The math is intentionally photographic-plausible rather than pixel-exact:
 * horizontal FOV comes from the focal length via the standard formula
 * 2 · atan(sensor / 2f); DOF near/far are computed from a linearised
 * approximation good enough to draw the cone. Nothing here calls into
 * real render engines.
 *
 * Pure. Same input → same output. No React.
 */

import type { Direction } from "./prompt";

/** Horizontal sensor width in mm (approx 35mm full-frame). */
const SENSOR_WIDTH_MM = 36;

export type CameraTopView = {
  /** Distance from camera lens to subject in scene units (metres). */
  distance: number;
  /** Half-angle of the horizontal FOV in radians. */
  halfFov: number;
  /** DOF near distance in metres. */
  dofNear: number;
  /** DOF far distance in metres. */
  dofFar: number;
  /** Aperture used to compute DOF. */
  fStop: number;
  /** Focal length in mm. */
  focalMm: number;
  /** Camera position in scene metres (0,0 = subject). */
  camera: { x: number; y: number };
  /** Subject position. */
  subject: { x: number; y: number };
  /** FOV cone corner points (left / centre-far / right of the frustum). */
  frustum: { left: { x: number; y: number }; right: { x: number; y: number } };
};

export type CameraSideView = {
  /** Distance from camera to subject horizontally. */
  distance: number;
  /** Camera height in metres. */
  cameraHeight: number;
  /** Subject height in metres — used to size the silhouette. */
  subjectHeight: number;
  /** Tilt angle in radians, positive = downward tilt. */
  tiltRad: number;
  /** Focal length echoed for the label. */
  focalMm: number;
};

// ─── Helpers ───────────────────────────────────────────────────────

/** Parse a focal length string ("50", "35mm") to millimetres. */
export function parseFocalMm(v: string | null | undefined): number {
  if (!v) return 50;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 50;
}

/** Parse an aperture string ("2.8", "f/1.8") to f-stop number. */
export function parseFStop(v: string | null | undefined): number {
  if (!v) return 2.8;
  const cleaned = v.replace(/^f\//i, "").replace(/^f/i, "").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : 2.8;
}

/**
 * Derive a natural framing distance for the given focal length so the
 * subject reads as a portrait/product framing without extra config.
 * Wider lenses want the camera closer; longer lenses want it further away.
 */
export function framingDistance(focalMm: number): number {
  // 24mm → 0.8m, 50mm → 1.6m, 85mm → 2.4m, 135mm → 3.4m
  if (focalMm <= 24) return 0.8;
  if (focalMm <= 35) return 1.1;
  if (focalMm <= 50) return 1.6;
  if (focalMm <= 85) return 2.4;
  if (focalMm <= 135) return 3.4;
  return 4.5;
}

/** Horizontal half-FOV in radians for a given focal length. */
export function halfFov(focalMm: number): number {
  return Math.atan(SENSOR_WIDTH_MM / (2 * focalMm));
}

/**
 * Approximate DOF near/far distances for a subject at `subject` metres
 * from the camera. Uses the standard hyperfocal linearisation with a
 * circle-of-confusion baked in for a "printed" viewing distance.
 * Deterministic — no lens table lookups.
 */
export function computeDof(
  focalMm: number,
  fStop: number,
  subjectMetres: number,
): { near: number; far: number } {
  const f = focalMm / 1000; // in metres
  const c = 0.03e-3; // circle of confusion, metres (36mm frame print)
  const H = (f * f) / (fStop * c) + f; // hyperfocal distance
  const s = subjectMetres;
  const near = (H * s) / (H + (s - f));
  const denom = H - (s - f);
  const far = denom > 0 ? (H * s) / denom : Infinity;
  return {
    near: Math.max(0.1, near),
    far: Number.isFinite(far) ? far : subjectMetres * 20,
  };
}

// ─── Public assemblers ─────────────────────────────────────────────

export function computeTopView(direction: Direction): CameraTopView {
  const focalMm = parseFocalMm(direction.lens);
  const fStop = parseFStop(direction.aperture);
  const distance = framingDistance(focalMm);
  const hf = halfFov(focalMm);
  const { near, far } = computeDof(focalMm, fStop, distance);
  const cameraY = -distance;
  const frustumRadius = distance + far; // draw cone out to the far DOF
  return {
    distance,
    halfFov: hf,
    dofNear: near,
    dofFar: far,
    fStop,
    focalMm,
    subject: { x: 0, y: 0 },
    camera: { x: 0, y: cameraY },
    frustum: {
      left: {
        x: -Math.sin(hf) * frustumRadius,
        y: cameraY + Math.cos(hf) * frustumRadius,
      },
      right: {
        x: Math.sin(hf) * frustumRadius,
        y: cameraY + Math.cos(hf) * frustumRadius,
      },
    },
  };
}

/**
 * Guess the camera height from the composition tag: eye-level (1.6m),
 * low-angle (0.4m), high-angle (2.4m), overhead (3.0m), waist (1.1m).
 * Falls back to eye level. Deterministic mapping.
 */
export function inferCameraHeight(composition: string | null | undefined): number {
  if (!composition) return 1.6;
  const c = composition.toLowerCase();
  if (c.includes("overhead") || c.includes("top")) return 3.0;
  if (c.includes("high")) return 2.4;
  if (c.includes("waist") || c.includes("hip")) return 1.1;
  if (c.includes("low")) return 0.4;
  return 1.6;
}

export function computeSideView(direction: Direction): CameraSideView {
  const focalMm = parseFocalMm(direction.lens);
  const distance = framingDistance(focalMm);
  const cameraHeight = inferCameraHeight(direction.composition);
  const subjectHeight = 1.7; // a stand-in metric human/product proxy
  const dy = cameraHeight - subjectHeight * 0.9; // aim at upper subject
  // Positive = tilt down when camera above subject; negative when below.
  const tiltRad = Math.atan2(dy, distance);
  return {
    distance,
    cameraHeight,
    subjectHeight,
    tiltRad,
    focalMm,
  };
}
