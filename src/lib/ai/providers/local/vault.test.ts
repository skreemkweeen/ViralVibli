import { describe, expect, it } from "vitest";
import { localVaultProvider } from "./vault";
import type { VaultTransformRequest, TransformOp } from "../../types";

function req(operation: TransformOp, content = "Write a caption for a launch"): VaultTransformRequest {
  return { operation, content, count: 3 };
}

describe("localVaultProvider", () => {
  it("has a stable provider id", () => {
    expect(localVaultProvider.id).toBe("local-vault");
  });

  it("supports every declared operation without throwing", async () => {
    const ops: TransformOp[] = [
      "improve",
      "expand",
      "condense",
      "rewrite",
      "make-casual",
      "make-professional",
      "make-creative",
      "variations",
    ];
    // Provider sleeps 700ms internally; run in parallel so the whole suite
    // fits in one delay window.
    const results = await Promise.all(ops.map((op) => localVaultProvider.transform(req(op))));
    results.forEach((result, i) => {
      const op = ops[i];
      if (op === "variations") {
        expect(result.variations?.length ?? 0).toBeGreaterThan(0);
      } else {
        expect(result.content?.length ?? 0).toBeGreaterThan(0);
      }
      expect(result.provider).toBe("local-vault");
    });
  }, 10_000);

  it("condense operation shortens the input", async () => {
    const long = "One. Two. Three. Four. Five. Six.";
    const result = await localVaultProvider.transform({
      operation: "condense",
      content: long,
      count: 3,
    });
    expect(result.content!.length).toBeLessThanOrEqual(long.length);
  });
});
