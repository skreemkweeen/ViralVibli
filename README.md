# ViralVibli

**Create. Grow. Monetize.** The creator operating system: everything creators
need to plan, make, and monetize across every platform, in one workspace.

This repository currently contains **Phase 1**: the foundation and the marketing
landing page, built to ship quality.

## Stack

- **Next.js 16** (App Router, RSC) + **TypeScript**
- **Tailwind CSS v4** (token-driven, dark-locked theme)
- **Motion** (`motion/react`) for UI motion, **GSAP** + ScrollTrigger for the
  pinned horizontal studios pan, **Lenis** for smooth scroll
- **Geist** (sans + mono) via `next/font`
- **Phosphor** icons; **simple-icons** for real, locally-bundled platform marks

All visuals are self-contained (no external image hosts), so the page renders
identically offline and in restricted networks.

## Design system

- **One theme:** dark, warm off-black (`#0a0a0b`), never pure black.
- **One accent:** acid lime (`#c8f04e`), used sparingly. No AI-purple, no
  creator-pink cliche.
- **Type:** oversized grotesque display, editorial hierarchy via weight + scale.
- Tokens live in `src/app/globals.css` under Tailwind v4 `@theme`.

Motion respects `prefers-reduced-motion` throughout; layouts are mobile-first
and collapse to a single column below `md`.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the build
```

## Structure

```
src/
  app/                layout, page, global tokens
  components/
    site/             landing sections (hero, modules, studios, pricing, ...)
    ui/               reveal, magnetic, button primitives
    providers/        Lenis smooth scroll
  lib/content.ts      modules, studios, tiers, testimonials, faqs
```

## Application shell

The authenticated workspace lives under the `(app)` route group:

- `/dashboard` overview, `/assistant` (the AI Assistant, first live module),
  `/settings` (tabbed), `/sign-in`, and registry-driven `/m/[id]` module routes.
- **Auth** is a swappable abstraction (`src/lib/auth`); a demo provider runs with
  no keys, and Clerk drops in without consumer changes (see `docs/auth.md`).
- **Module registry** (`src/lib/modules/registry.tsx`) is the single source of
  truth: sidebar nav, command palette, dashboard grid, and routing all read from
  it, so a new studio registers in one place.
- **Theme system** (light / dark / system) themes the app via semantic tokens;
  the marketing site stays dark-locked.
- **Command palette** (⌘K) for global search, navigation, and actions;
  notifications and a user menu round out the shell.
- **AI client seam** (`src/lib/ai/client.ts`) streams brand-aware replies via a
  mock today; swap in the Claude API behind the same async-iterator contract.

## Roadmap

The remaining studios (Story, Caption, Carousel, Vision, UGC, Prompt Vault,
Brand, Trend Lab, Calendar, Analytics, Monetization Hub, Community) are
registered and routed; each plugs into the shell and shares the AI Assistant's
brand memory as it is built out, plus real data and billing.
