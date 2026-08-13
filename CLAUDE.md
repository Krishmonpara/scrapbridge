@AGENTS.md

<!-- The line above preserves the Next.js agent rules that Claude Code loads.
     Everything below is the full project export (for transfer to another LLM
     or Obsidian). -->

# ScrapBridge — Complete Project Export (`CLAUDE.md`)

> **Purpose of this file.** A single, self-contained snapshot of the entire ScrapBridge
> project — architecture, stack, data model, every route, every agent, environment,
> deployment state, known gaps, and operational history. Written so it can be pasted
> into another LLM or dropped into Obsidian and give someone (or something) the full
> picture with zero access to the original machine. Nothing important is omitted.
>
> - **Generated:** 2026-07-14
> - **Local path:** `/Users/krishmonpara/Desktop/ScrapWithMe/scrapbridge`
> - **GitHub (only safe copy — see §14):** https://github.com/Krishmonpara/scrapbridge
> - **Vercel production URL:** https://scrapbridge-kappa.vercel.app
>   - ⚠️ `scrapbridge.vercel.app` (without `-kappa`) is a **different, unrelated app** — not this project.

---

## Table of Contents

1. [What ScrapBridge Is](#1-what-scrapbridge-is)
2. [Tech Stack](#2-tech-stack)
3. [Repository Layout](#3-repository-layout)
4. [Data Model (Prisma Schema)](#4-data-model-prisma-schema)
5. [Routes — Pages](#5-routes--pages)
6. [Routes — API](#6-routes--api)
7. [The Agent Layer](#7-the-agent-layer)
8. [Auth & Middleware](#8-auth--middleware)
9. [Design System](#9-design-system)
10. [Key Library Code](#10-key-library-code)
11. [Environment Variables](#11-environment-variables)
12. [Local Setup & Scripts](#12-local-setup--scripts)
13. [Deployment (Vercel)](#13-deployment-vercel)
14. [Operational History & Critical Warnings](#14-operational-history--critical-warnings)
15. [Open Flags / Gaps Requiring Human Input](#15-open-flags--gaps-requiring-human-input)
16. [Git History](#16-git-history)

---

## 1. What ScrapBridge Is

**ScrapBridge** is a full-stack **B2B industrial scrap marketplace** for North America.
It connects scrap yards, demolition firms, ship breakers, manufacturers, recyclers,
traders, and brokers so they can list, discover, and transact scrap metals, surplus
machinery, and salvage materials — no middlemen, no hidden fees.

**Design north star:** *"A Bloomberg Terminal for scrap metal."* Dense, precise,
data-alive. Monochrome / mono-font "industrial terminal" aesthetic; color and glow are
**accent-only and semantic** (up/down/neutral), never decorative. Sharp corners (≤2px).

**Who it's for:**

| Role | What they do |
|------|-------------|
| Scrap Yards | List tonnes of HMS steel, non-ferrous metals, mixed scrap by grade |
| Demolition Companies | Post surplus structural steel, pipe, tanks, equipment after teardowns |
| Ship Breakers | Offer marine-grade steel plate, engines, pumps, electrical equipment |
| Manufacturers | Find raw material feedstock; post production offcuts and defective stock |
| Traders / Brokers | Browse across categories, send inquiries, post RFQs for custom lots |

**Headline features:**
- Browse & filter (category, condition, location, verified sellers, freshness, sort)
- Live market ticker (commodity price strip: HMS, copper, aluminium, stainless)
- 14 material categories
- Photo galleries (up to 12 photos/listing, full-screen lightbox)
- Related-listings carousel (snap-scroll)
- RFQ (Request for Quote) system with buyer↔seller match alerts
- Multi-step (6-step) listing wizard with per-step validation
- Seller dashboard, my-listings table, inquiries inbox, in-app messaging
- Verified badge system (UNVERIFIED → PENDING → VERIFIED, ~3× inquiry uplift)
- Company profiles + directory + reviews
- Credentials + Google OAuth auth, JWT sessions, route middleware
- 240-frame splash animation (24 FPS canvas, skip button, session-storage gate)
- Command palette (`⌘K`), scroll-to-top, view transitions, monochrome dark theme
- **Agent layer:** quality scoring, fraud detection, price intelligence, RFQ matching
- Embeddable price widget, public prices API, in-app notifications, admin fraud queue

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | **Next.js 16.2.6** (App Router) | Server components, streaming, edge middleware; **webpack mode** (`--webpack`) |
| Language | **TypeScript 5** | `strict: true`, `noEmit`, path alias `@/* → ./*` |
| Runtime | **Node.js 22 LTS** | **Node 25 breaks this project** — see §14 |
| Styling | **Tailwind CSS v4** + CSS variables | `@tailwindcss/postcss`; semantic design tokens |
| Database | **PostgreSQL** (Docker, port **5433**) | Prod expects hosted PG (Neon/Supabase) |
| ORM | **Prisma 7** + `@prisma/adapter-pg` | Native `pg.Pool` driver adapter (Prisma 7 pattern) |
| Auth | **NextAuth.js v5** (beta) | JWT strategy; Credentials + Google providers; Prisma adapter |
| Forms | **React Hook Form 7 + Zod 4** | Schema-driven validation |
| Animation | **Framer Motion 12** | List stagger, gallery, step transitions |
| Icons | **Lucide React** | |
| Passwords | **bcryptjs** | min 8 chars |
| JWT/crypto | **jose**, **@panva/hkdf** | |
| Utilities | clsx, tailwind-merge, date-fns | `cn()` helper etc. |
| Fonts | **Geist Mono** (data/display), **Inter** (UI), **Bebas Neue** | loaded from Google Fonts in `layout.tsx` |

Key `next.config.ts` choices:
- `images.remotePatterns`: allows all `https` hosts.
- `typescript.ignoreBuildErrors: true` (type-check manually via `tsc --noEmit`).
- `experimental.webpackBuildWorker: false` + `workerThreads: true` — a **Node 25-era
  workaround** for jest-worker IPC hangs. Safe to remove on Node 22 (not yet done).

`package.json` scripts of note (pre/post hooks matter):
- `fix-perms`: `chmod -R a+rX node_modules` (works around Node-25 permission resets)
- `predev` / `prebuild`: run `fix-perms` first
- `postinstall`: `prisma generate` (required for Vercel builds)
- `dev`: `next dev --webpack` · `build`: `next build --webpack` · `start`: `next start`
- `db:seed`, `db:push`, `db:studio` (Prisma helpers)

---

## 3. Repository Layout

> **Important:** The repo root the user opens is `/Users/krishmonpara/Desktop/ScrapWithMe`,
> but the **actual Next.js project lives in the `scrapbridge/` subdirectory**. All paths
> below are relative to `scrapbridge/`. The parent folder also contains a stray
> `next-env.d.ts`, `index.html`, and a `.claude/` dir — the real app is `scrapbridge/`.

```
scrapbridge/
├── app/
│   ├── (auth)/                 # login, register
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/            # authenticated area
│   │   ├── admin/flagged/page.tsx      # fraud review queue
│   │   ├── dashboard/page.tsx (+ loading.tsx)
│   │   ├── inquiries/page.tsx
│   │   ├── matches/page.tsx + MatchesClient.tsx (+ loading.tsx)
│   │   ├── messages/page.tsx + MessagesClient.tsx (+ loading.tsx)
│   │   ├── my-listings/page.tsx
│   │   ├── post-listing/page.tsx       # 6-step listing wizard
│   │   ├── saved-searches/page.tsx
│   │   └── settings/page.tsx
│   ├── (marketplace)/
│   │   ├── browse/page.tsx + BrowseClient.tsx (+ loading.tsx)
│   │   ├── companies/page.tsx
│   │   ├── company/[id]/page.tsx
│   │   ├── listing/[id]/page.tsx (+ loading.tsx)
│   │   ├── market/page.tsx (+ loading.tsx)     # market dashboard
│   │   └── rfq/page.tsx
│   ├── api/                    # route handlers — see §6
│   ├── widget/price/[category]/route.ts        # embeddable price widget
│   ├── home/page.tsx           # main homepage (post-splash)
│   ├── page.tsx                # entry / splash gate
│   ├── layout.tsx              # root layout (dark, fonts, providers)
│   ├── globals.css             # design tokens + animations
│   ├── error.tsx, not-found.tsx, favicon.ico
│
├── components/
│   ├── company/    CompanyCard, CompanyProfile, ReviewSection
│   ├── forms/      InquiryForm, RFQForm, VerificationCard
│   ├── hero/       HeroSection, FrameAnimationHero, HeroOverlay
│   ├── home/       MarketPulse, StatsStrip
│   ├── listings/   ListingCard, ListingGrid, ListingFilters, ListingDetail,
│   │               ListingActions, ListingPhotoGallery, RelatedListingsCarousel
│   ├── navigation/ Navbar, Footer, NotificationBell
│   ├── providers/  SessionProvider, ViewTransitions, CommandPaletteProvider
│   ├── shared/     FairPriceBadge, FreshnessTag, LocationPin, MaterialIcon, VerifiedBadge
│   └── ui/         Button, Input, Badge, Modal, Toast, Select, Tooltip, EmptyState,
│                   CommandPalette, DataTable, HorizontalScroll, ImageWithShimmer,
│                   CountUp, LiveDot, MarketTicker, PriceTag, Reveal, ScrollToTop,
│                   Skeletons, Sparkline, StatCard
│
├── lib/
│   ├── agents/     fraud-agent.ts, match-agent.ts, price-intelligence.ts, quality-agent.ts
│   ├── auth.ts     # NextAuth config (providers, JWT/session callbacks)
│   ├── prisma.ts   # Prisma client singleton over pg.Pool + PrismaPg adapter
│   ├── rate-limit.ts   # in-memory sliding-window limiter
│   ├── materialImages.ts   # deterministic image URLs per category
│   └── utils.ts    # cn(), formatPrice/Number/Date/TimeAgo(), slugify(), truncate()
│
├── prisma/
│   ├── schema.prisma   # 15 models/enums — see §4
│   └── seed.ts         # seeds 20 companies + ~100 listings (32 hand-authored templates)
│
├── types/index.ts      # shared TS types + *_LABELS maps (CATEGORY/UNIT/CONDITION/BUSINESS_TYPE)
├── public/frames/       # 240 JPG frames (ezgif-frame-001..240) for splash animation
├── public/*.svg         # file, globe, next, vercel, window
├── proxy.ts             # Next.js middleware (auth guard)
├── docker-compose.yml   # PostgreSQL 15-alpine on port 5433
├── next.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs
├── prisma.config.ts     # Prisma 7 config (schema + migrations path + datasource)
├── package.json, package-lock.json
├── run-dev.sh           # dev launcher script
├── plan.html            # interactive architecture graph (open in browser)
├── index.html           # standalone landing/plan page
├── README.md, DESIGN_PLAN.md, RESUME_TOMORROW.md, AGENTS.md, CLAUDE.md
├── Flag - Input Required or Suggestion.txt   # gap tracker (see §15)
├── .env                 # gitignored — reconstructed 2026-06-12 (see §11/§14)
├── .vercel/             # project link (projectId/orgId below)
├── frames/              # source frame copies (240) at repo root too
└── .git-dead/           # 3.3 MB corrupted-git safety net (deletable — see §14)
```

**Notes on `AGENTS.md` / `CLAUDE.md`:** `CLAUDE.md` is just `@AGENTS.md`. `AGENTS.md`
carries a hard rule:

> **This is NOT the Next.js you know.** This version has breaking changes — APIs,
> conventions, file structure may differ from training data. Read the relevant guide in
> `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.

This is why the middleware file is `proxy.ts` (not `middleware.ts`) and dev runs with
`--webpack`.

---

## 4. Data Model (Prisma Schema)

**Provider:** `postgresql`. **Generator:** `prisma-client-js`.

### Enums
- `BusinessType`: SCRAP_YARD, DEMOLITION, SHIP_BREAKER, MANUFACTURER, RECYCLER, TRADER, BROKER
- `VerificationStatus`: UNVERIFIED, PENDING, VERIFIED
- `ListingType`: SELL, BUY, WANTED, AUCTION
- `MaterialCategory` (14): FERROUS_METALS, NON_FERROUS_METALS, ENGINES_DRIVETRAIN,
  ELECTRIC_MOTORS, PIPING_FITTINGS, TANKS_VESSELS, HEAVY_MACHINERY, MARINE_OFFSHORE,
  RAIL_TRANSPORT, AEROSPACE, CONSTRUCTION_DEMOLITION, ELECTRONIC_ELECTRICAL,
  PRECIOUS_SPECIALTY, INDUSTRIAL_EQUIPMENT
- `Condition`: COMPLETE, PARTIAL, DAMAGED, AS_IS, SCRAP_ONLY
- `Unit`: TONS, LBS, KG, PIECES, LOT
- `ListingStatus`: ACTIVE, EXPIRED, SOLD, DRAFT
- `InquiryStatus`: PENDING, RESPONDED, CLOSED
- `RFQStatus`: OPEN, CLOSED, AWARDED
- `MatchStatus`: NEW, SEEN, DISMISSED, CONTACTED

### Models (relationships)

**Company** — central entity. Fields: id (cuid), name, slug (unique), businessType,
verificationStatus (default UNVERIFIED), ein?, licenseNumber?, address?, city, state,
country (default "US"), zipCode?, phone?, email, website?, description?, logoUrl?,
memberSince, rating (default 0), reviewCount (default 0), timestamps.
Relations: listings[], sentInquiries[] (InquiryFrom), receivedInquiries[] (InquiryTo),
rfqs[], reviewsGiven[] (ReviewFrom), reviewsReceived[] (ReviewTo), users[].

**Listing** — companyId→Company, listingType, title, materialCategory,
materialSubcategory?, grade?, condition, quantity, unit, pricePerUnit?, currency
(USD), negotiable, minOrder?, description?, specs?, location?, city, state, country,
pickupAvailable (true), deliveryAvailable (false), expiresAt?, status (ACTIVE),
viewCount, inquiryCount, **qualityScore** (default 0 — set by quality agent),
photos String[], timestamps. Relation: inquiries[].

**Inquiry** — listingId→Listing, fromCompanyId→Company, toCompanyId→Company, message,
contactName, contactPhone?, contactEmail, status (PENDING), createdAt. Relation: messages[].

**Message** — inquiryId→Inquiry (onDelete Cascade), senderCompanyId, body, readAt?,
createdAt. Index: `[inquiryId, createdAt]`.

**MatchAlert** — rfqId, listingId, score (Float), reasons String[], status (NEW),
createdAt. Unique: `[rfqId, listingId]`. (Populated by the match agent.)

**RFQ** — companyId→Company, title, materialCategory, materialSubcategory?,
quantityNeeded, unit, targetPrice?, deliveryLocation?, neededBy?, description?,
status (OPEN), timestamps.

**Review** — fromCompanyId→Company (ReviewFrom), toCompanyId→Company (ReviewTo),
rating (Int), comment?, transactionType?, createdAt.

**SavedSearch** — userId→User, filters (Json), alertEnabled (false), lastAlerted?, createdAt.

**User** (NextAuth) — id, name?, email (unique), emailVerified?, image?, password?
(bcrypt), companyId?→Company, accounts[], sessions[], savedSearches[], timestamps.

**Account / Session / VerificationToken** — standard NextAuth Prisma-adapter models
(OAuth accounts, JWT-strategy sessions table, email verification tokens).

Relationship sketch:
```
User ─┐(NextAuth: Account, Session, VerificationToken)
      └─ companyId ─▶ Company ──▶ Listing ──▶ Inquiry ──▶ Message
                        ├──▶ RFQ           (MatchAlert links RFQ⇄Listing)
                        ├──▶ Review (given/received)
                        └──▶ SavedSearch (via User)
```

---

## 5. Routes — Pages

Route groups don't affect URLs (they're organizational). Effective URLs:

| URL | Auth | Purpose |
|-----|------|---------|
| `/` | public | Entry — 240-frame splash gate → `/home` |
| `/home` | public | Homepage: hero, stats strip, market pulse bento, category tiles |
| `/browse` | public | Marketplace grid + filters (client: `BrowseClient.tsx`) |
| `/listing/[id]` | public | Listing detail, photo gallery, inquiry form, related carousel, Fair Price badge |
| `/companies` | public | Company directory (search by name/type/state/verified) |
| `/company/[id]` | public | Company profile + listings + reviews |
| `/market` | public | Market dashboard (supply bars, sparklines, "market heat") |
| `/rfq` | public | Post/browse RFQs |
| `/login`, `/register` | public | Auth |
| `/dashboard` | **auth** | Seller dashboard (views, inquiries, active listings, open RFQs) |
| `/my-listings` | **auth** | Sortable listings table |
| `/post-listing` | **auth** | 6-step listing wizard |
| `/inquiries` | **auth** | Inquiries inbox (received + sent) |
| `/messages` | **auth** | In-app threaded messaging (`MessagesClient.tsx`) |
| `/matches` | auth | RFQ↔listing match alerts (`MatchesClient.tsx`) |
| `/saved-searches` | auth | Saved search management |
| `/settings` | **auth** | Account + company + verification request |
| `/admin/flagged` | auth | Fraud review queue (admin) |

Each heavy route has a `loading.tsx` skeleton for instant navigation feedback.

---

## 6. Routes — API

All under `/api/` (auth-gated routes need a valid JWT session cookie). Exported methods:

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/listings` | GET, POST | List (paginated, filtered) / create listing. Create runs quality agent → `qualityScore` |
| `/api/listings/[id]` | GET, PATCH, DELETE | Fetch / edit / remove a listing |
| `/api/listings/inquiry` | POST | Send an inquiry on a listing |
| `/api/companies` | GET | Company directory (search, type, verified, state) |
| `/api/inquiries` | GET, PATCH | List / update inquiry status |
| `/api/messages` | GET, POST, PATCH | Thread messages / send / mark read |
| `/api/rfq` | GET, POST | Open RFQs (optional `?category=`) / post RFQ (public) |
| `/api/reviews` | GET, POST | Company reviews |
| `/api/search` | GET | Global autocomplete for command palette (`?q=`, min 2 chars) |
| `/api/notifications` | GET | In-app notification feed |
| `/api/verification` | GET, POST | Verification request flow (→ PENDING) |
| `/api/register` | POST | Create user + company account |
| `/api/auth/[...nextauth]` | (NextAuth) | Auth handlers (Credentials + Google) |
| `/api/public/prices` | GET | Public spot-price feed (drives market ticker) |
| `/api/agents/quality` | POST | Run/backfill listing quality scores |
| `/api/agents/match` | GET, POST, PATCH | Run matcher / list matches / update match status |
| `/api/agents/fraud` | GET | Run fraud scan → flags for admin queue |
| `/api/widget/price/[category]` | GET | Embeddable price widget (`app/widget/price/[category]/route.ts`) |

**`GET /api/listings` query params:** `search`, `category` (MaterialCategory),
`type` (ListingType), `state` (2-letter), `verified=1`, `within=24h|7d|30d`,
`sort=newest|price_asc|price_desc|most_inquiries|expiring_soon`,
`condition=COMPLETE,DAMAGED,...` (comma list), `page` (default 1),
`limit` (default 24, max 100). Response: `{ listings, total, page, limit }`.

Write endpoints are throttled per-IP via `lib/rate-limit.ts` (in-memory sliding window).

---

## 7. The Agent Layer

Four heuristic, explainable "agents" in `lib/agents/`. No LLM calls — deterministic
rules so they're testable and cheap. Each is exposed via an API route.

### `quality-agent.ts` — Listing Quality
Scores completeness **0–100** with a rules array; grade EXCELLENT/GOOD/FAIR/POOR and a
list of concrete suggestions. Runs synchronously on create/update, persisted to
`Listing.qualityScore`, boosts search ranking. Example rules (points):
- 15 — title ≥ 20 chars
- 20 — description ≥ 80 chars ("3× more inquiries")
- 15 — ≥ 1 photo · 5 — ≥ 3 photos
- 15 — grade specified · 10 — pricePerUnit > 0 (…and more)

### `fraud-agent.ts` — Fraud Detection
Scans ACTIVE listings for risk signals → `FraudFlag[]` (risk HIGH/MEDIUM/LOW + reasons)
for the `/admin/flagged` queue. Signals include:
- **Duplicate detection** — same company + near-identical normalized title
- **Extreme underpricing** vs spot reference (uses price-intelligence; classic scam bait)
- High-value threshold `HIGH_VALUE_USD = 50000`, plus unverified/new-company/missing-contact signals

### `price-intelligence.ts` — Price Intelligence
Compares a listing's ask against a **static spot-price snapshot** (USD/metric-ton,
modeled on LME/ISRI composite ranges). Returns `PriceSignal`:
verdict FAIR/BELOW_MARKET/ABOVE_MARKET/UNKNOWN, `deviationPct`, reference low/high, note.
- `SPOT_RANGES` per category, e.g. FERROUS_METALS [250,450], NON_FERROUS [1800,9500],
  AEROSPACE [1500,12000], PRECIOUS_SPECIALTY [5000,60000].
- `TON_FACTORS` to normalize units: TONS 1.10231 (short→metric), KG 1000, LBS 2204.62.
- ⚠️ **Static data** — swap for a live feed (LME API / metals-api.com / MSTC) for prod (see §15 flag 3).
- Powers the `FairPriceBadge` component and feeds the fraud agent.

### `match-agent.ts` — Buyer↔Seller Matching
Scores open RFQs against active SELL listings; persists high-confidence matches as
`MatchAlert` rows. Runs on demand (`POST /api/agents/match`) or nightly via cron.
Scoring blends category/subcategory match, keyword overlap (tokenized, stopword-filtered),
quantity fit, price fit (target vs ask, negotiable), and location proximity → `score` 0–100 + reasons.

---

## 8. Auth & Middleware

**`lib/auth.ts` (NextAuth v5):**
- Providers: **Google** (clientId/secret from env, empty-string fallback) and
  **Credentials** (email + bcrypt password compare against `User.password`).
- Adapter: `PrismaAdapter(prisma)`. Session strategy: **JWT**.
- Pages: signIn `/login`, newUser `/register`.
- Callbacks: `jwt` embeds `token.id` and looks up + embeds `token.companyId`;
  `session` copies `id` and `companyId` onto `session.user`.

**`proxy.ts` (middleware — note the non-standard filename):**
- Protects: `/dashboard`, `/my-listings`, `/post-listing`, `/settings`, `/inquiries`.
- Uses `getToken({ secret: AUTH_SECRET })`; unauthenticated → redirect to
  `/login?callbackUrl=<path>`.
- Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, and `/api/`.

---

## 9. Design System

All tokens live in `app/globals.css` (Tailwind v4 `@theme inline` maps CSS vars to
utilities). **Dark palette is the default** (`<html className="dark">` in `layout.tsx`).

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--background` | `#0a0a0a` | `#ffffff` | Page bg |
| `--card` | `#191919` | `#ffffff` | Cards/panels |
| `--muted` | `#262626` | `#f5f5f5` | Inputs/hover |
| `--foreground` | `#fafafa` | `#0a0a0a` | Primary text |
| `--border` | `#383838` | `#e5e5e5` | Borders |
| `--muted-foreground` | `#a1a1a1` | `#717171` | Labels/captions |
| `--primary` | `#737373` | `#737373` | |
| `--destructive` | `#ff6467` | `#e7000b` | |
| `--radius` | `0rem` | `0rem` | **Sharp corners** |
| charts `--chart-1..5` | `#737373` | `#737373` | Monochrome |

Semantic accent colors (README): `--success #22c55e` (verified), `--steel-blue #60a5fa`
(links/info), `--copper #fb923c` (WANTED listings). Prices/data use **Geist Mono**
(tabular numerals); UI copy uses **Inter**; **Bebas Neue** for display.

Fonts loaded via Google Fonts `<link>` in `layout.tsx`. Providers wrapped in root layout:
SessionProvider → ToastProvider → (ViewTransitions, CommandPaletteProvider, children, ScrollToTop).

`DESIGN_PLAN.md` documents an 8-step "terminal aesthetic" upgrade (glow/elevation
tokens, Sparkline/StatCard/MarketTicker primitives, market dashboard, home bento grid,
motion system, view-transition shared elements) plus a shipped **Phase 2 smoothness**
pass (route skeletons, `Reveal` IntersectionObserver, category tile hover, Market Pulse
bento). Global rule: stay monochrome + Geist Mono; color/glow accent-only; respect
`prefers-reduced-motion`.

---

## 10. Key Library Code

**`lib/prisma.ts`** — singleton `PrismaClient` over a `pg.Pool` via `PrismaPg` adapter
(Prisma 7 pattern; cached on `globalThis` in non-prod to survive HMR).

**`lib/utils.ts`** — `cn()` (clsx + tailwind-merge), `formatPrice()` (Intl currency),
`formatNumber()`, `formatTimeAgo()` / `formatDate()` (date-fns), `slugify()`, `truncate()`.

**`lib/rate-limit.ts`** — in-memory sliding-window limiter keyed by `routeKey:clientIP`
(`x-forwarded-for` → `x-real-ip` → `'local'`). Returns a 429 `Response` (with
`Retry-After`) when over limit, else `null`. Periodic sweep every 60s prevents key leak.
Interface matches an Upstash-backed impl for later swap. Usage:
`const limited = rateLimit(request, 'listings-post', { limit: 10, windowMs: 60_000 }); if (limited) return limited`.

**`lib/materialImages.ts`** — deterministic image URLs per category (fallback thumbnails
since there's no real photo upload yet).

**`types/index.ts`** — mirrors Prisma enums as TS unions; `Company`/`Listing`/`ListingFilters`
interfaces; label maps `CATEGORY_LABELS`, `UNIT_LABELS`, `CONDITION_LABELS`,
`BUSINESS_TYPE_LABELS` (used across UI for human-readable enum display).

**`prisma/seed.ts`** — seeds **20 companies** (real US cities/states, varied business
types & verification statuses, ratings) + ~**100 listings** from 32 hand-authored
templates across all 14 categories. Uses the `PrismaPg` driver adapter.

---

## 11. Environment Variables

`.env` is **gitignored** (`.env*` in `.gitignore`) so it has no GitHub copy. It was
**reconstructed 2026-06-12** after disk corruption destroyed the original (see §14).
Current contents:

```env
# Reconstructed 2026-06-12 after disk corruption killed the original .env
DATABASE_URL="postgresql://scrapbridge:scrapbridge@localhost:5433/scrapbridge"
AUTH_SECRET="b4j9htajY9uqekQbZg7a4cfDCqno9K4sRW/1rwpwwZ0="
NEXTAUTH_SECRET="b4j9htajY9uqekQbZg7a4cfDCqno9K4sRW/1rwpwwZ0="
NEXTAUTH_URL="http://localhost:3000"
# GOOGLE_CLIENT_ID=   (was never set — see Flag item 2)
# GOOGLE_CLIENT_SECRET=
```

> The `AUTH_SECRET` above is a dev secret; regenerating it invalidated all prior login
> sessions. **Keep a copy of `.env` in a password manager** — it can't live on GitHub.
> Generate a fresh secret with `openssl rand -base64 32`.

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | Postgres connection string (local Docker on 5433; hosted for prod) |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | ✅ | JWT signing (both set to same value) |
| `NEXTAUTH_URL` | ✅ | Full app URL, no trailing slash |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ⬜ | Google OAuth (never set; credentials login works without) |

**Not yet added but referenced by flags/future work:** `STRIPE_SECRET_KEY` /
`STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` (escrow), `METALS_API_KEY` (live
prices), `RESEND_API_KEY` / Twilio creds (notifications), `UPSTASH_REDIS_REST_URL` +
`UPSTASH_REDIS_REST_TOKEN` (distributed rate limiting).

---

## 12. Local Setup & Scripts

**Prereqs:** Node.js **22 LTS** (⚠️ *not* 25 — see §14) and Docker (or existing Postgres on 5433).

```bash
git clone https://github.com/Krishmonpara/scrapbridge.git
cd scrapbridge
npm install                 # runs postinstall → prisma generate
docker-compose up -d        # Postgres 15-alpine on :5433 (container scrapbridge-postgres-1)
npx prisma db push          # sync schema (no migrations)
npm run db:seed             # 20 companies + ~100 listings
npm run dev                 # http://localhost:3000  (webpack mode)
```

Start on Node 22 explicitly (Homebrew):
```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
docker compose up -d
npm run dev
```

**Script reference:**
```bash
npm run dev        # next dev --webpack  (:3000)
npm run build      # next build --webpack
npm run start      # next start
npm run lint       # eslint
npm run db:seed    # ts-node prisma/seed.ts
npm run db:push    # prisma db push
npm run db:studio  # Prisma Studio (:5555)
npm run fix-perms  # chmod -R a+rX node_modules (Node-25 permission workaround)
docker-compose up -d / down
```

On first load the **splash animation** plays once per session (session-storage gated).
Click **Skip intro →** or wait for 240 frames, then **Start Scraping** → `/home`.

**Verified routes (RESUME_TOMORROW.md, Node 22):** `/`, `/browse`, `/companies`,
`/login`, `/register`, `/rfq`, `/api/companies`, `/api/search?q=copper` all 200;
`/dashboard` and `/post-listing` correctly 307→`/login` (auth gate working).

---

## 13. Deployment (Vercel)

- **Production URL:** https://scrapbridge-kappa.vercel.app
  (⚠️ `scrapbridge.vercel.app` without `-kappa` is a stranger's unrelated app.)
- **Vercel project link** (`.vercel/project.json`):
  - `projectId`: `prj_fviM2X2IIHgx7PSVulF4mUozc5lq`
  - `orgId`: `team_kymcTMdnQlvZZrgtaq1BgH2W`
  - `projectName`: `scrapbridge`
- `postinstall: prisma generate` was added specifically so Vercel builds succeed.
- **To go live fully, two human-only steps remain (Flag 9):**
  1. `npx vercel login` once in a terminal (email link), then run the production deploy.
  2. Provision **hosted Postgres** (Neon or Supabase — local Docker DB is unreachable
     from Vercel) and set `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL` in Vercel env vars.
     Without it the site deploys but shows empty listings (degrades gracefully).
- `.vercelignore` present. Docker alternative: `docker-compose up --build` (add a Node
  service pointing at the built Next output for full containerization).

---

## 14. Operational History & Critical Warnings

### ⚠️ Node.js version is load-bearing
**Node 25.9.0 was the root cause of every environment problem** (permission resets,
webpack-worker IPC hangs, `effect` package `doNotation.bind is not a function`, Homebrew
`simdutf` mismatch). Fix: **use Node 22 LTS** (`brew install node@22`, run the `node@22`
binary directly). On Node 22 the `fix-perms` chmod hooks and the
`webpackBuildWorker:false`/`workerThreads:true` config are no longer needed (kept for safety).

### ⚠️ This Mac's SSD is failing (APFS data-block corruption)
During a work session **~300 project files became unreadable**: 57 source files, all of
`public/` + `frames/` (480 images), `postcss.config.mjs`, the local `.git` pack — even
files written earlier that same session. **Everything was recovered from GitHub** (all
work had been pushed; nothing lost). `node_modules` and `.next` were rebuilt fresh.

**Standing operational rules from this event:**
- **GitHub is the only safe copy.** Push after *every* work session.
- Recover corruption by re-cloning fresh from GitHub.
- Keep ≥ **5 GB free** (below that, git/webpack writes start failing). Safe reclaims:
  `~/.npm` cache, `.next/cache` if > ~1 GB, unused Docker layers via
  `docker system prune` (ask first). Run Disk Utility → First Aid on Macintosh HD.
- `.env` can't live on GitHub → keep it in a password manager.
- `.git-dead/` (3.3 MB) is the corrupted-git safety net kept from recovery; the current
  `.git` is healthy and pushed. Delete once confident: `rm -rf ".git-dead"`.

(These mirror the user's persistent memory: "Disk corruption recovery" and "Vercel
production URL".)

---

## 15. Open Flags / Gaps Requiring Human Input

From `Flag - Input Required or Suggestion.txt` — each item was stubbed/defaulted so work
never blocked:

1. **Stripe keys (escrow payments)** — need `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`,
   `STRIPE_WEBHOOK_SECRET`. Escrow flow **not built** (deferred — untestable without keys).
   Add keys, say "build payments" → Stripe Connect escrow gets built.
2. **Google OAuth creds** — need `GOOGLE_CLIENT_ID`/`SECRET`. Google button exists but
   errors; credentials login works. (Add `http://localhost:3000/api/auth/callback/google`
   as an authorized redirect URI.)
3. **Live metal price feed** — `price-intelligence.ts` uses a **static** spot snapshot.
   Plug in LME API (paid), metals-api.com (free 50 req/mo → daily cron), or scrape MSTC;
   needs `METALS_API_KEY`.
4. **Email / WhatsApp notifications** — match alerts + messages are in-app only. Add
   `RESEND_API_KEY` (email, free 100/day — fastest path) and/or Twilio (WhatsApp).
5. **Verification document review** — request flow sets companies to PENDING; approving
   is a human/admin task (queue at `/admin/flagged`). Decide who reviews.
6. **Rate-limiting storage** — currently in-memory (`lib/rate-limit.ts`); for multi-instance
   add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
7. **Disk failure** — see §14 (critical).
8. **`.env` reconstructed** — secrets regenerated 2026-06-12; re-add any other keys you had.
9. **Vercel deploy** — login + hosted Postgres pending (see §13). Also: leftover
   `.git-dead/` deletable once repo confirmed healthy.

**README "Known Limitations":** no real-time (no email/websocket wiring yet — dashboard
refreshes on reload); Google OAuth needs redirect URI setup; photo upload UI is a
placeholder (no S3/blob — falls back to deterministic thumbnails); rate limiting is
in-memory.

---

## 16. Git History

- **Remote:** `origin` → https://github.com/Krishmonpara/scrapbridge.git
- **Branch:** `main` (tracks `origin/main`). Total commits: **11**.

```
f30d018  Vercel deploy prep: postinstall prisma generate, .vercelignore, flag notes
ac7ba03  Phase 2 smoothness: route skeletons, scroll reveal, Market Pulse bento
09bd8e0  Add reviews, listing lifecycle, and notification center
9963318  Design upgrade: terminal aesthetic foundation, live ticker, sparklines, HUD cards
def9d03  Add rate limiting, quality backfill endpoint, embeddable price widget
f1400a9  Wire FairPriceBadge into listing page; update flag file
1d233f6  Add agent layer: messaging, RFQ matching, quality scoring, price intelligence, fraud detection
6b63d5a  docs: add README and plan.html architecture graph
fd9856e  Fix above-fold content invisible on first paint
5d32528  Build ScrapBridge B2B industrial scrap marketplace
```

**Contributing flow:** branch → change → `npm run lint` → commit → push → PR.
**License:** MIT © 2025 ScrapBridge.

---

*End of `cloud.md`. This document is intended to be complete on its own — the actual
source lives in the `scrapbridge/` directory and on GitHub. For a clickable architecture
map, open `plan.html` in a browser.*
