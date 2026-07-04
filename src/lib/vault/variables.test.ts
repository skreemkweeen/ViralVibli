import { describe, expect, it } from "vitest";
import { extractVariables, fillVariables } from "./variables";

describe("extractVariables", () => {
  it("returns [] for empty and undefined-shaped inputs", () => {
    expect(extractVariables("")).toEqual([]);
    expect(extractVariables("no braces at all")).toEqual([]);
  });

  it("extracts a single variable", () => {
    expect(extractVariables("Hello {name}!")).toEqual(["name"]);
  });

  it("extracts multiple variables in order", () => {
    expect(
      extractVariables("Write a caption for {product} on {platform}."),
    ).toEqual(["product", "platform"]);
  });

  it("dedupes repeated occurrences, keeping first-seen order", () => {
    expect(
      extractVariables("{topic}: {topic} is trending because {topic}."),
    ).toEqual(["topic"]);
    expect(
      extractVariables("{a} then {b} then {a} then {c}"),
    ).toEqual(["a", "b", "c"]);
  });

  it("trims whitespace inside braces", () => {
    expect(extractVariables("Hi {  name  } and {  role  }")).toEqual([
      "name",
      "role",
    ]);
  });

  it("ignores empty braces, multi-word braces, and non-alphanumeric braces", () => {
    expect(
      extractVariables("noise {} {two words} {a b} {123start} {ok_key}"),
    ).toEqual(["ok_key"]);
  });

  it("accepts hyphens and underscores in variable names", () => {
    expect(
      extractVariables("{brand-name} {content_type} {stopHere.}"),
    ).toEqual(["brand-name", "content_type"]);
  });

  it("does not extract from unmatched braces", () => {
    expect(extractVariables("open { but never close")).toEqual([]);
  });
});

describe("fillVariables", () => {
  it("substitutes every provided value", () => {
    expect(
      fillVariables("Caption for {product} on {platform}", {
        product: "Marrow Bowl",
        platform: "Instagram",
      }),
    ).toBe("Caption for Marrow Bowl on Instagram");
  });

  it("leaves unresolved tokens intact so the caller can flag them", () => {
    expect(
      fillVariables("Caption for {product} on {platform}", {
        product: "Marrow Bowl",
      }),
    ).toBe("Caption for Marrow Bowl on {platform}");
  });

  it("keeps repeated tokens consistent", () => {
    expect(
      fillVariables("{topic} intro and {topic} outro", { topic: "ceramics" }),
    ).toBe("ceramics intro and ceramics outro");
  });

  it("is a no-op when no variables are present", () => {
    expect(fillVariables("literal string", {})).toBe("literal string");
  });
});
