# ZOOM X Design System

Tokens live in [`src/app/globals.css`](../src/app/globals.css) (`@theme`), so every token is also a Tailwind utility (`bg-canvas-alt`, `text-headline`, `py-section`, `max-w-page`…).

## ⚠️ Brand colour — client decision needed

The **official logo has no green**. It is red "ZOOM" + "X" lettering with a blue outline on an orange-yellow oval, with "BY WILLS" and soap bubbles (cartoon style).

The green (`#00B42C`) comes from the current zoomx.lk Elementor styling, and the spec asks for the brand green, so it is used for now — but only on primary buttons, focus rings, eyebrows and small accents.

Questions for the client:
1. Is green an official brand colour (packaging, guidelines), or only a website choice?
2. Is there a master vector logo and brand guideline?
3. Is a simplified wordmark or monochrome logo variant available or planned? The detailed cartoon logo is hard to fit into a premium, minimal design at 32px nav height.

Switching the accent colour means changing only `--color-brand*` tokens.

## Colour

| Token | Value | Use |
|---|---|---|
| `canvas` | `#FFFFFF` | Primary background |
| `canvas-alt` | `#F5F5F7` | Alternate sections, footer |
| `ink` | `#1D1D1F` | Primary text |
| `ink-muted` | `#6E6E73` | Secondary text (4.9:1 on white) |
| `line` | `#D2D2D7` | Hairline dividers only |
| `brand` | `#00B42C` | Decorative accent only (fails AA for text) |
| `brand-strong` | `#007A1E` | Buttons, links, focus (AA on white) |
| `brand-tint` | `#E8F7EC` | Selection, subtle highlights |
| `danger` | `#C4141A` | Errors |

## Typography

Inter (self-hosted by `next/font`), tight negative tracking at display sizes.

| Utility | Size | Use |
|---|---|---|
| `text-display` | 44 → 80px | Hero headline (one per page) |
| `text-headline` | 32 → 56px | Section headings |
| `text-title` | 24 → 32px | Card/product titles, mobile menu |
| `text-lead` | 19 → 24px | Intro paragraphs |
| `text-body` | 17px | Body copy |
| `text-caption` | 13px | Eyebrows, meta, footer |

## Spacing & layout

- `max-w-page` 1280px · `max-w-prose` 672px
- `px-gutter` 16 → 40px responsive side padding
- `py-section` 72 → 128px between sections
- `h-nav` / `top-nav` 48px global navigation
- Separate sections by alternating `Section tone="default" | "alt"`, not with borders or cards.

## Components (`src/components/ui`)

| Component | Notes |
|---|---|
| `Button` / `ButtonLink` | Variants `primary` · `secondary` · `ghost` · `link`; sizes `sm` · `md` · `lg`. Pill shape, 44px+ touch targets. `Button` defaults to `type="button"`. |
| `Container` | Page width + gutters |
| `Section` | Full-bleed band with tone |
| `SectionHeading` | Eyebrow + heading + lead |
| `Logo` | Official raster logo; swap for SVG when supplied |

## Layout (`src/components/layout`)

- **SiteHeader** — sticky 48px translucent bar (backdrop blur). Desktop: Home, Shop, Categories (flyout), About, Contact, plus search, account and bag. Mobile: search, bag and menu; full-screen menu with expandable Categories. One panel open at a time (Zustand `useUiStore`). Every panel is a modal dialog: Escape closes it, focus is trapped and then returned to the button that opened it, and page scroll is locked. Panels close on navigation.
- **Search** — plain `GET /shop?search=` form: works before hydration and without JS. Live suggestions are added in Phase 5.
- **AnnouncementBar** — renders only when `site.announcement` is set.
- **SiteFooter** — real address, factory and phone; email and social links appear automatically once added to `src/lib/site.ts`. Newsletter signup is **not** shown yet: it needs a chosen email provider (Phase 4 decision) and must not be a non-functional form.

## Motion

- Framer Motion with `MotionConfig reducedMotion="user"`; CSS transitions are also disabled under `prefers-reduced-motion`.
- Standard easing `cubic-bezier(0.25, 0.1, 0.25, 1)`, ~200–350ms. Panels fade and move 8px; menu items stagger by 40ms. No decorative looping animation.

## Accessibility baseline

- Skip link, `lang="en-LK"`, a single `h1` per page, landmark labels (`Main`, footer groups).
- Visible 2px `brand-strong` focus ring on every interactive element.
- `aria-current="page"` on active links; the bag count is announced as part of the link name.
