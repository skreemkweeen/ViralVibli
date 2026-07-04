import { describe, expect, it } from "vitest";
import { emptyDirection } from "./prompt";
import { emptyLightingSetup } from "./lighting";
import {
  addShotReference,
  newShot,
  pushVersion,
  removeShotReference,
  restoreVersion,
  setShotApproval,
  setShotStatus,
  SHOT_TYPE_SPECS,
  shotApprovalSummary,
  shotDirection,
  shotSpec,
  shotStatusSummary,
  shotsByCampaign,
  snapshotVersion,
  updateShotDirection,
} from "./shots";

describe("SHOT_TYPE_SPECS", () => {
  it("covers all 16 documented shot types", () => {
    expect(SHOT_TYPE_SPECS).toHaveLength(16);
    const ids = new Set(SHOT_TYPE_SPECS.map((s) => s.id));
    expect(ids.has("hero")).toBe(true);
    expect(ids.has("packaging")).toBe(true);
    expect(ids.has("paid-ads")).toBe(true);
    expect(ids.has("tiktok")).toBe(true);
  });

  it("gives every spec an aspect + composition + lens + aperture", () => {
    for (const spec of SHOT_TYPE_SPECS) {
      expect(spec.aspect).toBeTruthy();
      expect(spec.composition).toBeTruthy();
      expect(spec.lens).toBeTruthy();
      expect(spec.aperture).toBeTruthy();
    }
  });

  it("puts UGC and TikTok on vertical 9:16 aspect", () => {
    expect(shotSpec("ugc").aspect).toBe("9-16");
    expect(shotSpec("tiktok").aspect).toBe("9-16");
  });

  it("puts flat-lay on overhead composition", () => {
    expect(shotSpec("flat-lay").composition).toBe("overhead");
  });
});

describe("shotDirection", () => {
  it("carries subject and mood forward from the base", () => {
    const base = { ...emptyDirection, subject: "ceramic mug", mood: "moody" };
    const d = shotDirection("hero", base);
    expect(d.subject).toBe("ceramic mug");
    expect(d.mood).toBe("moody");
  });

  it("overrides aspect + composition + lens per the spec", () => {
    const d = shotDirection("flat-lay");
    expect(d.aspect).toBe("1-1");
    expect(d.composition).toBe("overhead");
    expect(d.lens).toBe("50");
  });
});

describe("newShot", () => {
  it("initializes with the spec's defaults and a computed prompt", () => {
    const shot = newShot("s1", "hero", emptyDirection, emptyLightingSetup(), 1000);
    expect(shot.id).toBe("s1");
    expect(shot.type).toBe("hero");
    expect(shot.name).toBe("Hero");
    expect(shot.status).toBe("idle");
    expect(shot.approval).toBe("draft");
    expect(shot.history).toHaveLength(0);
    expect(shot.references).toHaveLength(0);
    expect(shot.prompt.length).toBeGreaterThan(20);
    expect(shot.createdAt).toBe(1000);
    expect(shot.updatedAt).toBe(1000);
  });
});

describe("updateShotDirection", () => {
  it("recomputes prompt on change", () => {
    const shot = newShot("s1", "hero");
    const before = shot.prompt;
    const next = updateShotDirection(shot, { subject: "brass kettle" });
    expect(next.prompt).not.toBe(before);
    expect(next.direction.subject).toBe("brass kettle");
    expect(next.updatedAt).toBeGreaterThanOrEqual(shot.createdAt);
  });
});

describe("status + approval helpers", () => {
  it("flips status and bumps updatedAt", () => {
    const shot = newShot("s1", "hero", emptyDirection, emptyLightingSetup(), 1);
    const next = setShotStatus(shot, "queued");
    expect(next.status).toBe("queued");
    expect(next.updatedAt).toBeGreaterThan(1);
  });

  it("flips approval and bumps updatedAt", () => {
    const shot = newShot("s1", "hero", emptyDirection, emptyLightingSetup(), 1);
    const next = setShotApproval(shot, "approved");
    expect(next.approval).toBe("approved");
    expect(next.updatedAt).toBeGreaterThan(1);
  });
});

describe("references", () => {
  it("adds and removes references", () => {
    const shot = newShot("s1", "hero");
    const withRef = addShotReference(shot, {
      id: "r1",
      kind: "url",
      label: "Aesop hero",
      url: "https://example.com",
      createdAt: Date.now(),
    });
    expect(withRef.references).toHaveLength(1);
    const without = removeShotReference(withRef, "r1");
    expect(without.references).toHaveLength(0);
  });
});

describe("version history", () => {
  it("snapshots + pushes onto history capped at 25", () => {
    let shot = newShot("s1", "hero");
    for (let i = 0; i < 30; i++) {
      const v = snapshotVersion(`v${i}`, shot, `Take ${i}`, undefined, 1000 + i);
      shot = pushVersion(shot, v);
    }
    expect(shot.history.length).toBe(25);
    expect(shot.history[0]?.label).toBe("Take 29");
  });

  it("restores a version by id", () => {
    let shot = newShot("s1", "hero");
    const v1 = snapshotVersion("v1", shot, "First");
    shot = pushVersion(shot, v1);
    // mutate direction, then restore
    shot = updateShotDirection(shot, { subject: "mutated" });
    expect(shot.direction.subject).toBe("mutated");
    shot = restoreVersion(shot, "v1");
    expect(shot.direction.subject).not.toBe("mutated");
  });

  it("returns the shot unchanged if version id missing", () => {
    const shot = newShot("s1", "hero");
    const same = restoreVersion(shot, "nope");
    expect(same).toBe(shot);
  });
});

describe("shot aggregate helpers", () => {
  it("filters shots by campaign id", () => {
    const shots = [
      { ...newShot("a", "hero"), campaignId: "camp-1" },
      { ...newShot("b", "lifestyle"), campaignId: "camp-1" },
      { ...newShot("c", "detail"), campaignId: "camp-2" },
    ];
    expect(shotsByCampaign(shots, "camp-1")).toHaveLength(2);
    expect(shotsByCampaign(shots, "camp-2")).toHaveLength(1);
  });

  it("summarises status and approval", () => {
    const shots = [
      setShotStatus(newShot("a", "hero"), "done"),
      setShotStatus(newShot("b", "lifestyle"), "running"),
      setShotStatus(newShot("c", "detail"), "done"),
    ];
    const s = shotStatusSummary(shots);
    expect(s.done).toBe(2);
    expect(s.running).toBe(1);
    expect(s.idle).toBe(0);

    const approvals = [
      setShotApproval(newShot("a", "hero"), "approved"),
      newShot("b", "lifestyle"),
    ];
    const a = shotApprovalSummary(approvals);
    expect(a.approved).toBe(1);
    expect(a.draft).toBe(1);
  });
});
