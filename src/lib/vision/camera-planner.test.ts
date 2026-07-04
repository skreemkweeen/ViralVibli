import { describe, expect, it } from "vitest";
import {
  computeDof,
  computeSideView,
  computeTopView,
  framingDistance,
  halfFov,
  inferCameraHeight,
  parseFStop,
  parseFocalMm,
} from "./camera-planner";
import { emptyDirection } from "./prompt";

describe("Camera planner parsing", () => {
  it("parseFocalMm reads numeric strings", () => {
    expect(parseFocalMm("50")).toBe(50);
    expect(parseFocalMm("35mm")).toBe(35);
  });

  it("parseFocalMm falls back to 50mm on garbage", () => {
    expect(parseFocalMm(null)).toBe(50);
    expect(parseFocalMm("wide")).toBe(50);
    expect(parseFocalMm("-10")).toBe(50);
  });

  it("parseFStop strips the f/ prefix", () => {
    expect(parseFStop("2.8")).toBe(2.8);
    expect(parseFStop("f/1.8")).toBe(1.8);
    expect(parseFStop("F4")).toBe(4);
  });

  it("parseFStop falls back to 2.8 on garbage", () => {
    expect(parseFStop("open")).toBe(2.8);
    expect(parseFStop(null)).toBe(2.8);
  });
});

describe("Photographic geometry", () => {
  it("wider lens → wider FOV half-angle", () => {
    expect(halfFov(24)).toBeGreaterThan(halfFov(50));
    expect(halfFov(50)).toBeGreaterThan(halfFov(85));
  });

  it("framingDistance grows with focal length", () => {
    expect(framingDistance(24)).toBeLessThan(framingDistance(50));
    expect(framingDistance(50)).toBeLessThan(framingDistance(85));
    expect(framingDistance(200)).toBeGreaterThanOrEqual(framingDistance(135));
  });

  it("smaller f-stop (wider aperture) → shallower DOF", () => {
    const wide = computeDof(50, 1.4, 1.6);
    const closed = computeDof(50, 8, 1.6);
    expect(wide.far - wide.near).toBeLessThan(closed.far - closed.near);
  });

  it("DOF returns finite near always positive", () => {
    const d = computeDof(50, 2.8, 1.6);
    expect(d.near).toBeGreaterThan(0);
    expect(Number.isFinite(d.near)).toBe(true);
  });
});

describe("computeTopView", () => {
  it("subject sits at the origin", () => {
    const v = computeTopView({ ...emptyDirection, lens: "50", aperture: "2.8" });
    expect(v.subject).toEqual({ x: 0, y: 0 });
  });

  it("camera is set back from the subject on the -y axis", () => {
    const v = computeTopView({ ...emptyDirection, lens: "50" });
    expect(v.camera.x).toBe(0);
    expect(v.camera.y).toBeLessThan(0);
  });

  it("frustum edges spread symmetrically around the y axis", () => {
    const v = computeTopView(emptyDirection);
    expect(v.frustum.left.x).toBeLessThan(0);
    expect(v.frustum.right.x).toBeGreaterThan(0);
    expect(v.frustum.left.x).toBeCloseTo(-v.frustum.right.x, 3);
  });

  it("wider lens yields a wider frustum span", () => {
    const wide = computeTopView({ ...emptyDirection, lens: "24" });
    const tele = computeTopView({ ...emptyDirection, lens: "135" });
    expect(Math.abs(wide.frustum.right.x)).toBeGreaterThan(
      Math.abs(tele.frustum.right.x),
    );
  });
});

describe("computeSideView", () => {
  it("infers eye-level camera height by default", () => {
    const s = computeSideView(emptyDirection);
    expect(s.cameraHeight).toBeCloseTo(1.6, 5);
  });

  it("recognises 'overhead' compositions with a raised camera", () => {
    const s = computeSideView({ ...emptyDirection, composition: "overhead flat lay" });
    expect(s.cameraHeight).toBeGreaterThanOrEqual(2.4);
  });

  it("recognises 'low' compositions with a lowered camera", () => {
    const s = computeSideView({ ...emptyDirection, composition: "low angle hero" });
    expect(s.cameraHeight).toBeLessThan(1);
  });

  it("tilts downward when the camera sits above the subject", () => {
    const s = computeSideView({ ...emptyDirection, composition: "overhead flat lay" });
    expect(s.tiltRad).toBeGreaterThan(0);
  });

  it("inferCameraHeight covers every canonical composition", () => {
    expect(inferCameraHeight("waist")).toBeGreaterThan(0);
    expect(inferCameraHeight(null)).toBe(1.6);
  });
});
