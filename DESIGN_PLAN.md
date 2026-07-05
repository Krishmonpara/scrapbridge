# ScrapBridge — Design Upgrade Plan

**North star:** A Bloomberg Terminal for scrap metal. Dense, precise, alive with
data. Lean *harder* into the existing monochrome / Geist-Mono / zero-radius
"industrial terminal" aesthetic rather than fighting it with color. Glow and
color are **accent-only and semantic** (up/down/neutral), never decorative.

**Global rule for every step:** stay monochrome + Geist Mono; color/glow is
accent-only; reuse existing tokens; respect the existing `prefers-reduced-motion`
block in `globals.css`. Sharp corners (≤2px) — commit to it (drop the stray
`rounded-md` on cards).

---

## Step 1 — Foundation layer (`app/globals.css`)  ✳ do first, everything depends on it

Add to the legacy-compat token block:
- Elevation + glow: `--glow-sm/md/accent`, `--elev-1/2`
- Semantic market colors: `--up`, `--up-glow`, `--down`, `--down-glow`, `--neutral`
- Motion scale: `--ease-out-expo`, `--ease-spring`, `--dur-fast/med/slow`
- Keyframes: `value-flash`, `scan-line`, `pulse-ring`, `grid-fade-in`
  (extend existing `shimmer`, `ambient-pulse`, `hero-fade-up`, ticker)

## Step 2 — Primitives (`components/ui/`)
- `Sparkline.tsx` — dependency-free inline SVG trend line, up/down colored
- `StatCard.tsx` — mono value + delta (`▲ +12%`) + optional sparkline
- `MarketTicker.tsx` — horizontal scrolling price strip (reuses `.ticker-track`)

## Step 3 — Wire `MarketTicker` to `/api/public/prices`, mount under navbar
Instant "terminal" feel. Green/red arrows, mono, pause-on-hover.

## Step 4 — High-traffic surfaces
- `StatsStrip`: sparkline + delta under each CountUp
- `ListingCard`: `--elev-2` + `--glow-accent` hover (replace the cheap white glow),
  corner-bracket HUD motif on hover, price `value-flash`, add Fair Price badge here

## Step 5 — `/market` → dashboard
Treemap sized by supply, inline row sparklines, "market heat" intensity bars.
This becomes the screenshot-worthy hero page.

## Step 6 — Home bento grid + navbar scroll glow
Break the uniform grid with varied feature tiles (ticker, material of the week,
mini chart). Navbar: `backdrop-blur` + bottom glow on scroll, `LiveDot` +
"N online", visible `⌘K` hint (CommandPalette already exists).

## Step 7 — Motion system
1. Entrance: staggered `grid-fade-in` (30ms/index) on card grids
2. Micro: hover lift, value-flash, button scan-line sweep (primary only)
3. Continuity: shared-element View Transition — `view-transition-name` on
   ListingCard image morphs into the detail hero. Highest "expensive" payoff.

## Step 8 — Polish pass
tabular-nums audit (kill inline JetBrains Mono), skeleton loaders on every async
surface (messages/matches/market), empty-state personality, focus-ring
consistency, dark-mode-first review.

---

### Execution notes for Fable 5
Drive one step at a time. Each step's output is the next step's dependency, so
do them in order. Keep the "global rule" above in every prompt or it drifts
colorful and breaks the aesthetic.
