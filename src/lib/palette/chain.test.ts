import { describe, expect, it } from "vitest";
import {
  advanceChain,
  chainProgress,
  currentStep,
  isChainComplete,
  nextStep,
  planChain,
  skipStep,
} from "./chain";

describe("chain planning", () => {
  it("returns null for empty query", () => {
    expect(planChain("")).toBeNull();
    expect(planChain("   ")).toBeNull();
  });

  it("returns null when only one studio would fire", () => {
    expect(planChain("generate a caption")).toBeNull();
  });

  it("builds a two-step plan when Story + Vision both hit", () => {
    const chain = planChain(
      "create a skincare launch campaign with matching product photos",
    );
    expect(chain).not.toBeNull();
    expect(chain!.steps.length).toBeGreaterThanOrEqual(2);
    const studios = chain!.steps.map((s) => s.href);
    expect(studios).toContain("/story");
    expect(studios).toContain("/vision");
  });

  it("orders Story before Vision before Vault", () => {
    const chain = planChain(
      "draft a launch campaign story with hero product shots and save the prompts to the vault",
    );
    expect(chain).not.toBeNull();
    const hrefs = chain!.steps.map((s) => s.href);
    const storyIx = hrefs.indexOf("/story");
    const visionIx = hrefs.indexOf("/vision");
    const vaultIx = hrefs.indexOf("/vault");
    if (storyIx >= 0 && visionIx >= 0) expect(storyIx).toBeLessThan(visionIx);
    if (visionIx >= 0 && vaultIx >= 0) expect(visionIx).toBeLessThan(vaultIx);
  });

  it("attaches a prefill when the intent extracted a subject", () => {
    const chain = planChain(
      "generate a launch caption and matching hero product shot for our ceramic mug",
    );
    expect(chain).not.toBeNull();
    const withPrefill = chain!.steps.find((s) => s.prefill);
    expect(withPrefill).toBeDefined();
    expect(withPrefill!.prefill!.value.length).toBeGreaterThan(0);
  });
});

describe("chain traversal", () => {
  const seed = planChain(
    "create a skincare launch campaign with matching product photos",
  )!;

  it("exposes the current + next step", () => {
    expect(currentStep(seed)!.id).toBe(seed.steps[0].id);
    expect(nextStep(seed)!.id).toBe(seed.steps[1].id);
  });

  it("advances past the head", () => {
    const next = advanceChain(seed)!;
    expect(next.cursor).toBe(1);
    expect(currentStep(next)!.id).toBe(seed.steps[1].id);
  });

  it("returns null when advancing past the tail", () => {
    let c = seed;
    for (let i = 0; i < seed.steps.length; i++) {
      const advanced = c ? advanceChain(c) : null;
      if (!advanced) {
        c = null as unknown as typeof seed;
        break;
      }
      c = advanced;
    }
    expect(c).toBeNull();
  });

  it("skipStep removes the head and returns null when list empties", () => {
    let c: ReturnType<typeof skipStep> = seed;
    while (c) c = skipStep(c);
    expect(c).toBeNull();
  });

  it("isChainComplete reflects cursor past end", () => {
    expect(isChainComplete(null)).toBe(true);
    expect(isChainComplete(seed)).toBe(false);
    const past = { ...seed, cursor: seed.steps.length };
    expect(isChainComplete(past)).toBe(true);
  });

  it("chainProgress reports 1-indexed position and percent", () => {
    const p = chainProgress(seed);
    expect(p.index).toBe(1);
    expect(p.total).toBe(seed.steps.length);
    expect(p.percent).toBeGreaterThan(0);
    expect(p.percent).toBeLessThanOrEqual(100);
  });
});
