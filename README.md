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

## Roadmap

Phase 1 ships the landing page and design system. Subsequent phases build the
13 product modules (AI Assistant, Story/Caption/Carousel/Vision/UGC studios,
Prompt Vault, Trend Lab, Brand Studio, Calendar, Analytics, Monetization Hub,
Community) on top of this foundation, plus auth, data, and billing.
