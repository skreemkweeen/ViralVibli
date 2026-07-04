/**
 * Vision Moodboard — pure state helpers for a list of inspiration references
 * a creator collects alongside the concepts they generate. Kept independent
 * from the concept store so a moodboard survives even after every concept
 * is cleared, and never mixes with the generation pipeline.
 *
 * Two kinds of item:
 *   - "manual"  — title + note + accent hue the creator authored themselves.
 *   - "concept" — a pinned reference back to a generated Concept by id.
 */

export type MoodboardItem =
  | {
      id: string;
      kind: "manual";
      title: string;
      note?: string;
      /** Hue 0..360 used to render a colored swatch on the tile. */
      hue: number;
      createdAt: number;
    }
  | {
      id: string;
      kind: "concept";
      /** The Concept.id this item pins. */
      conceptId: string;
      /** Snapshot of the concept's prompt for offline display. */
      prompt: string;
      /** Snapshot of the concept's seed so the tile renders a matching hue. */
      seed: string;
      /** Optional creator note attached at pin time. */
      note?: string;
      createdAt: number;
    };

/** Add a manual reference to the front of the board. Trims + guards title. */
export function addManualReference(
  items: MoodboardItem[],
  input: { id: string; title: string; note?: string; hue?: number },
  now: number = Date.now(),
): MoodboardItem[] {
  const title = input.title.trim();
  if (!title) return items;
  const item: MoodboardItem = {
    id: input.id,
    kind: "manual",
    title,
    note: input.note?.trim() || undefined,
    hue: typeof input.hue === "number" ? Math.round(((input.hue % 360) + 360) % 360) : 82,
    createdAt: now,
  };
  return [item, ...items];
}

/** Pin a concept reference. Dedupes on conceptId — pinning twice is a no-op. */
export function pinConceptReference(
  items: MoodboardItem[],
  input: {
    id: string;
    conceptId: string;
    prompt: string;
    seed: string;
    note?: string;
  },
  now: number = Date.now(),
): MoodboardItem[] {
  if (items.some((i) => i.kind === "concept" && i.conceptId === input.conceptId)) {
    return items;
  }
  const item: MoodboardItem = {
    id: input.id,
    kind: "concept",
    conceptId: input.conceptId,
    prompt: input.prompt,
    seed: input.seed,
    note: input.note?.trim() || undefined,
    createdAt: now,
  };
  return [item, ...items];
}

export function removeReference(
  items: MoodboardItem[],
  id: string,
): MoodboardItem[] {
  return items.filter((i) => i.id !== id);
}

export function updateNote(
  items: MoodboardItem[],
  id: string,
  note: string,
): MoodboardItem[] {
  const trimmed = note.trim();
  return items.map((i) =>
    i.id === id ? { ...i, note: trimmed || undefined } : i,
  );
}

/**
 * Move the item at `from` to `to`. Both are indexes into the current array;
 * out-of-range and no-op moves are safe (return the same array).
 */
export function reorderReferences(
  items: MoodboardItem[],
  from: number,
  to: number,
): MoodboardItem[] {
  if (from === to) return items;
  if (from < 0 || from >= items.length) return items;
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Detect whether a concept is already pinned — powers the toggle affordance. */
export function isConceptPinned(
  items: MoodboardItem[],
  conceptId: string,
): boolean {
  return items.some((i) => i.kind === "concept" && i.conceptId === conceptId);
}
