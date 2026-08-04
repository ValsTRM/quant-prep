# Quant Prep — design system

A calm, focused study tool. Numbers are the hero; color is spent deliberately.

## Color

One primary, one accent, neutrals for everything else. All values oklch.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--primary` | `oklch(0.47 0.17 275)` indigo | `oklch(0.72 0.14 275)` | CTAs, links' hover ink, proficiency bars, focus ring hue |
| `--highlight` (accent) | `oklch(0.78 0.14 80)` amber | `oklch(0.80 0.13 80)` | streak flame, challenge markers — never for surfaces or series |
| neutrals | zinc ramp (preset) | zinc ramp (preset) | text, borders, surfaces |
| `--destructive` | preset red | preset red | wrong answers, destructive actions only |

Rules: text always wears text tokens (`foreground`/`muted-foreground`), never the
brand hue. `--accent` (shadcn's neutral hover-surface role) stays neutral; the brand
accent is `--highlight`. Status red is reserved for wrong/destructive and always
ships with a symbol or word, never color alone.

## Typography

Geist Sans; Geist Mono for numerals where alignment matters (`tabular-nums`).

| Level | Spec | Use |
|---|---|---|
| Stat | 24px / 600 / tabular | stat-tile numbers |
| Page title | 20px / 600 / tracking-tight | one `<h1>` per page |
| Card title | 16px / 500 | card headers |
| Body | 14px / 400 | default |
| Caption | 12px / 400 / muted | hints, table meta |

## Spacing

4px base scale. Page gutter 16 (24 ≥sm) · section gap 24 (`space-y-6`) ·
card padding 16 · control gap 8 · inline icon gap 6.
Radius: `--radius: 0.625rem` (preset) — `rounded-lg` controls, `rounded-xl` cards.

## States

- **Hover**: interactive surfaces shift one neutral step (`hover:bg-muted`);
  primary buttons drop to `/80`; 150ms ease transitions on color.
- **Focus**: `focus-visible` 3px ring at `--ring`/50 (primary hue) — buttons, links,
  inputs, selects, checkboxes. Never removed.
- **Active/pressed**: buttons nudge down 1px (`active:translate-y-px`).
- **Current nav item**: foreground ink on `bg-muted`; inactive items are muted ink.
- **Empty states**: inline-SVG glyph + one-line explanation + the next action.
- **Loading**: skeleton blocks (`animate-pulse`, `bg-muted`, real layout shape) —
  never spinner-only, never bare "Loading…" text.
- **Over-target timer**: ink turns destructive and pulses gently.

## Motion

Micro only, never decorative: color/hover 150ms ease · proficiency-bar widths
500ms ease-out from 0 · feedback panel 150ms fade/slide-in · skeleton pulse.
Everything respects `prefers-reduced-motion` (Tailwind's `motion-reduce` guards
the bar and feedback animations; pulse degrades gracefully).

## Components

- `Button` — native `<button>` (default `type="button"`), cva variants
  default/outline/secondary/ghost/destructive/link, sizes xs…lg + icon.
- `LinkButton` — Next.js `<Link>` wearing the same variants; used for every
  navigation CTA. Downloads use a real `<a download>` with `buttonVariants`.
  No `<a><button>` or `<button><a>` nesting anywhere.
- `Skeleton` — pulsing muted block; compose into page-shaped placeholders.
- `StatTile` — label caption, 24px tabular stat, optional hint & glyph.
- `MiniBar` — 6px track/fill, animated width, single hue (primary).
