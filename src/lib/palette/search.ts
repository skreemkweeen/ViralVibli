/**
 * Global palette search across every workspace entity.
 *
 * Pure. Callers pass in the collections they want searched — projects from
 * the workspace context, prompts from vault localStorage, concepts from the
 * studio caches — and get back a scored, grouped result list. Keeping the
 * search itself dependency-free means the same ranker powers unit tests,
 * the palette runtime, and any future ⌘F on entity pages.
 */

import type { SearchHit } from "./types";

type ProjectLike = {
  id: string;
  name: string;
  description?: string | null;
  items?: unknown[];
};

type PromptLike = {
  id: string;
  title: string;
  content: string;
};

type StoryLike = {
  id: string;
  brief?: string;
  direction?: { subject?: string; platform?: string };
  slides?: Array<{ title?: string; caption?: string }>;
};

type ConceptLike = {
  id: string;
  brief?: string;
  title?: string;
  notes?: string;
  provider?: string;
};

type ActivityLike = {
  id: string;
  title: string;
  moduleId?: string;
  href?: string;
};

type MoodboardLike = {
  id: string;
  title?: string;
  note?: string;
  kind: "manual" | "concept";
};

export type SearchSources = {
  projects?: ProjectLike[];
  prompts?: PromptLike[];
  stories?: StoryLike[];
  concepts?: ConceptLike[];
  activity?: ActivityLike[];
  moodboard?: MoodboardLike[];
};

/**
 * Score a candidate against the query. 0 means no match at all. Scoring
 * prefers prefix matches, then whole-word matches, then subsequence matches.
 * The exact numbers are meaningful only relative to each other.
 */
export function score(text: string | undefined, q: string): number {
  if (!text || !q) return 0;
  const t = text.toLowerCase();
  const query = q.toLowerCase().trim();
  if (!query) return 0;
  if (t === query) return 100;
  if (t.startsWith(query)) return 80;

  // Whole-word hit: every query token appears as a whole word.
  const words = t.split(/[^a-z0-9]+/).filter(Boolean);
  const queryTokens = query.split(/\s+/).filter(Boolean);
  const wordHits = queryTokens.filter((qt) => words.includes(qt)).length;
  if (wordHits === queryTokens.length && wordHits > 0) return 60;

  // Substring match anywhere.
  if (t.includes(query)) return 45;

  // Fuzzy subsequence.
  let qi = 0;
  for (let i = 0; i < t.length && qi < query.length; i++) {
    if (t[i] === query[qi]) qi++;
  }
  if (qi === query.length) return 20;

  return 0;
}

function bestFieldScore(fields: Array<string | undefined>, q: string): number {
  let best = 0;
  for (const f of fields) {
    const s = score(f, q);
    if (s > best) best = s;
  }
  return best;
}

/**
 * Search across all sources. Returns hits sorted by descending score,
 * capped at `limit` per kind (so no single source dominates the list).
 */
export function search(
  q: string,
  sources: SearchSources,
  limit = 4,
): SearchHit[] {
  const query = q.trim();
  if (!query || query.length < 2) return [];

  const hits: SearchHit[] = [];

  for (const p of sources.projects ?? []) {
    const s = bestFieldScore([p.name, p.description ?? undefined], query);
    if (s > 0) {
      hits.push({
        kind: "project",
        id: p.id,
        title: p.name,
        subtitle: p.description ?? `${p.items?.length ?? 0} items`,
        href: "/projects",
        score: s + 5, // small preference: projects are top-level entities
        raw: p,
      });
    }
  }

  for (const pr of sources.prompts ?? []) {
    const s = bestFieldScore([pr.title, pr.content], query);
    if (s > 0) {
      hits.push({
        kind: "prompt",
        id: pr.id,
        title: pr.title,
        subtitle:
          pr.content.length > 90
            ? pr.content.slice(0, 90) + "…"
            : pr.content,
        href: "/vault",
        score: s,
        raw: pr,
      });
    }
  }

  for (const st of sources.stories ?? []) {
    const firstSlide = st.slides?.[0];
    const s = bestFieldScore(
      [
        st.brief,
        st.direction?.subject,
        firstSlide?.title,
        firstSlide?.caption,
      ],
      query,
    );
    if (s > 0) {
      hits.push({
        kind: "story",
        id: st.id,
        title: st.direction?.subject || firstSlide?.title || "Untitled story",
        subtitle: st.brief
          ? st.brief.slice(0, 90) + (st.brief.length > 90 ? "…" : "")
          : st.direction?.platform,
        href: "/story",
        score: s,
        raw: st,
      });
    }
  }

  for (const c of sources.concepts ?? []) {
    const s = bestFieldScore([c.title, c.brief, c.notes], query);
    if (s > 0) {
      hits.push({
        kind: "concept",
        id: c.id,
        title: c.title || c.brief?.slice(0, 60) || "Concept",
        subtitle: c.notes
          ? c.notes.slice(0, 90) + (c.notes.length > 90 ? "…" : "")
          : c.provider,
        href: "/vision",
        score: s,
        raw: c,
      });
    }
  }

  for (const m of sources.moodboard ?? []) {
    const s = bestFieldScore([m.title, m.note], query);
    if (s > 0) {
      hits.push({
        kind: "moodboard",
        id: m.id,
        title: m.title || "Reference",
        subtitle: m.note?.slice(0, 90),
        href: "/vision",
        score: s,
        raw: m,
      });
    }
  }

  for (const a of sources.activity ?? []) {
    const s = bestFieldScore([a.title], query);
    if (s > 0) {
      hits.push({
        kind: "activity",
        id: a.id,
        title: a.title,
        subtitle: a.moduleId,
        href: a.href,
        score: s - 5, // small penalty: activity is contextual, less actionable
        raw: a,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);

  // Cap per kind so results stay diverse.
  const perKind = new Map<string, number>();
  const out: SearchHit[] = [];
  for (const h of hits) {
    const seen = perKind.get(h.kind) ?? 0;
    if (seen >= limit) continue;
    perKind.set(h.kind, seen + 1);
    out.push(h);
  }
  return out;
}

/** Group results by their kind, preserving score order within each group. */
export function groupHits(hits: SearchHit[]): Record<string, SearchHit[]> {
  const groups: Record<string, SearchHit[]> = {};
  for (const h of hits) {
    (groups[h.kind] ??= []).push(h);
  }
  return groups;
}
