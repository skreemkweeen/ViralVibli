# ViralVibli — Design System

## 1. Design principles

1. **Dark-locked default.** The marketing surface is dark. The app respects
   `prefers-color-scheme` but reads the same tokens either way.
2. **One accent, one saturation.** Acid lime `#c8f04e` is the only accent.
   Every interactive affordance uses it.
3. **Off-black, off-white.** Never `#000000` or `#ffffff`. Depth comes from
   surface tiers, not from pure values.
4. **Off the taste-skill AI defaults.** No AI-purple, no gradient text at
   scale, no serif display type by default, no emoji as icons.
5. **Motion has meaning.** If an animation cannot be justified in one
   sentence, it is a bug.

## 2. Semantic tokens

Defined in `src/app/globals.css` under `@theme`. All components consume
these — never raw hex.

| Token                    | Dark (default) | Light         | Purpose                                  |
| ------------------------ | -------------- | ------------- | ---------------------------------------- |
| `--color-bg`             | `#0a0a0b`      | `#fbfbfa`     | Page background                          |
| `--color-surface`        | `#111113`      | `#ffffff`     | Card surface                             |
| `--color-surface-2`      | `#18181b`      | `#f4f4f2`     | Elevated / active surface                |
| `--color-line`           | `#232327`      | `#e6e6e2`     | Standard divider                         |
| `--color-line-soft`      | `#1c1c1f`      | `#efefec`     | Subtle divider                           |
| `--color-ink`            | `#f5f5f3`      | `#18181b`     | Primary text                             |
| `--color-muted`          | `#a6a6ad`      | `#52525b`     | Secondary text                           |
| `--color-faint`          | `#6e6e76`      | `#8a8a90`     | Tertiary text                            |
| `--color-accent`         | `#c8f04e`      | `#c8f04e`     | Brand accent (both themes)               |
| `--color-accent-hover`   | `#d6f56b`      | `#d6f56b`     | Accent hover state                       |
| `--color-accent-dim`     | `#aad13a`      | `#aad13a`     | Deep accent (rare)                       |
| `--color-accent-ink`     | `#0a0a0b`      | `#0a0a0b`     | Foreground on accent surface             |
| `--color-accent-fg`      | `#c8f04e`      | `#4f6f10`     | Accent as text/icon color                |
| `--color-scrollbar-hover`| `#34343a`      | `#c9c9c4`     | Scrollbar thumb hover                    |

## 3. Typography

- Sans: **Geist** via `next/font`.
- Mono: **Geist Mono** for numbers, code hints, keyboard glyphs.
- Body base: `text-[15px]` (main content) or `text-[13-14px]` (dense UI).
- Display: sans-only, `tracking-[-0.03em]`, `leading-tight`.
  We do not reach for serif display type unless a brief explicitly names one.

Size scale in use: `10 / 11 / 11.5 / 12 / 12.5 / 13 / 13.5 / 14 / 15 / 17 / 26`
and a clamp for hero display (`clamp(1.6rem, 4vw, 2.6rem)`). Keep new
components within this scale.

## 4. Spacing rhythm

Tailwind default 4pt scale. In practice we cluster around
`gap-1.5 / 2 / 3 / 4` for component internals and `space-y-6 / 8 / 10` for
section rhythm.

## 5. Radius

- Buttons / chips: `rounded-full`, `rounded-lg`, `rounded-xl` (context-driven).
- Cards / panels: `rounded-2xl`.
- Small utility (badges, kbd): `rounded-md`.

Shape consistency: one radius family per section. Round buttons in a
square layout, square cards on a pill-button page, is a bug.

## 6. Interactive state contract

Every interactive element in the codebase must implement:

1. **Cursor**: `cursor-pointer` on the interactive surface (and
   `disabled:cursor-not-allowed` when applicable).
2. **Hover**: token-based color/border shift. No opacity-only hovers.
3. **Active**: `active:opacity-75` or `active:scale-[0.97|0.98]`.
4. **Focus (keyboard)**: `focus-visible:outline-none focus-visible:ring-2
   focus-visible:ring-accent/40` (or `/50` for CTAs, `red-500/30` for
   destructive).
5. **Disabled**: `disabled:opacity-40 disabled:cursor-not-allowed` plus
   `aria-disabled`/`disabled` attribute.
6. **Aria state**: `aria-pressed` for toggles, `aria-expanded` for
   disclosures, `aria-busy` for loading buttons.
7. **Minimum size**: 44×44px touch target (or expanded hit-slop) for any
   affordance that appears on a touch device.

Whenever you see a bare `<button>` or `<a>` in the codebase without those
props, it is regarded as unfinished work.

## 7. Shared primitives (`src/components/ui/`)

| Primitive  | Purpose                                         |
| ---------- | ----------------------------------------------- |
| `Button`   | Native button OR `next/link`. Variants: primary / ghost / subtle / danger. Sizes: sm / md / lg. Loading state with `aria-busy`. |
| `Card`     | Rounded surface container. Padding: none / sm / md / lg. Semantic `as` prop. |
| `Chip`     | Toggleable filter/preset. Shapes: pill / rect. `aria-pressed`. |
| `Field`    | Labeled form group with `useId` + `aria-describedby` + optional error/hint. |
| `Input`    | 44px height form input consuming the field a11y wiring. |
| `Textarea` | Multi-line variant of `Input`. |
| `Badge`    | Status pill. Tones: neutral / accent / warning / danger / success. |

## 8. Studio primitives (`src/components/studio/`)

`StudioShell` (two-pane layout), `StudioEmptyState`, `StudioLoadingState`,
`StudioErrorState`, `StudioGenerateButton`, `StudioResultGrid`,
`ControlSection` (collapsible group), `ChipGroup` (multi-toggle selector).

Every studio composes from this layer. A new studio should not re-invent
loading/empty/error shells.

## 9. Motion contract

- Every motion component consumes `useReducedMotion()` and degrades to
  static output when true.
- Entry animations use `initial={reduce ? false : {...}}`.
- Ease: `cubic-bezier(0.16, 1, 0.3, 1)` (Apple-standard "expo-out").
- Duration: 150–300ms micro, ≤400ms transitions, ≤500ms hero reveals.
- Exit animations run at ~60–70% of enter duration.
- Global CSS backstop in `globals.css` neutralizes every CSS animation
  under `prefers-reduced-motion: reduce`.

## 10. Accessibility floor

- WCAG 2.2 AA contrast on body text and icons.
- Keyboard: every interactive element must be focus-visible and reachable
  in DOM order.
- Landmarks: `<main id="main-content">` in `AppShell`, `.skip-link` in
  `globals.css` renders a visible skip-to-content link on focus.
- ARIA live: assistant conversation is `role="log" aria-live="polite"`;
  the error tail is `role="alert"`.
- Reduced motion: universal (see §9).
- Touch: 44×44 minimum, spacing ≥ 8px between adjacent targets.

## 11. Anti-tells (never in production)

- `text-black`, raw hex CTAs, `hover:bg-[#...]` — replaced by tokens.
- Em-dash `—` anywhere visible to the user (per taste skill).
- `Fraunces`, `Instrument_Serif` as default display type.
- AI-purple gradients.
- Emoji as UI icons.
- Div-based fake screenshots.
- Ghost text as label (placeholder-as-label).
