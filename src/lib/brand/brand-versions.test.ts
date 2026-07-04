import { describe, expect, it } from "vitest";
import { emptyBrand } from "./brand-dna";
import { defaultVisualLanguage } from "./visual-language";
import {
  branchBrand,
  brandHead,
  commentOnBrandSnapshot,
  commitBrandSnapshot,
  duplicateBrand,
  emptyBrandTree,
  findBrandSnapshot,
  labelBrandSnapshot,
  removeBrandComment,
  restoreBrand,
} from "./brand-versions";

const dna = emptyBrand("b1");
const vl = defaultVisualLanguage();

describe("brand version tree", () => {
  it("commits + chains parents", () => {
    let t = emptyBrandTree();
    t = commitBrandSnapshot(t, { id: "v1", dna, visual: vl, label: "First" });
    t = commitBrandSnapshot(t, { id: "v2", dna, visual: vl, label: "Second" });
    expect(t.headId).toBe("v2");
    expect(brandHead(t)?.parentId).toBe("v1");
  });
  it("branch marks a tip", () => {
    let t = emptyBrandTree();
    t = commitBrandSnapshot(t, { id: "v1", dna, visual: vl });
    t = branchBrand(t, "v1", { id: "b1", branchId: "warm-alt", dna, visual: vl });
    expect(findBrandSnapshot(t, "b1")?.branchId).toBe("warm-alt");
  });
  it("restore moves HEAD", () => {
    let t = emptyBrandTree();
    t = commitBrandSnapshot(t, { id: "v1", dna, visual: vl });
    t = commitBrandSnapshot(t, { id: "v2", dna, visual: vl });
    expect(restoreBrand(t, "v1").headId).toBe("v1");
  });
  it("duplicate clones without branch tag", () => {
    let t = emptyBrandTree();
    t = commitBrandSnapshot(t, { id: "v1", dna, visual: vl });
    t = branchBrand(t, "v1", { id: "b1", branchId: "alt", dna, visual: vl });
    t = duplicateBrand(t, "b1", "c1", 5);
    expect(findBrandSnapshot(t, "c1")?.branchId).toBeUndefined();
  });
  it("labels + comments", () => {
    let t = emptyBrandTree();
    t = commitBrandSnapshot(t, { id: "v1", dna, visual: vl });
    t = labelBrandSnapshot(t, "v1", "Golden");
    expect(findBrandSnapshot(t, "v1")?.label).toBe("Golden");
    t = commentOnBrandSnapshot(t, "v1", { id: "c1", body: "love", createdAt: 1 });
    expect(findBrandSnapshot(t, "v1")?.comments).toHaveLength(1);
    t = removeBrandComment(t, "v1", "c1");
    expect(findBrandSnapshot(t, "v1")?.comments).toHaveLength(0);
  });
});
