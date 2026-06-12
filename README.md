# ScrapBridge

**The B2B industrial scrap marketplace.** Connecting scrap yards, demolition firms, ship breakers, and manufacturers across North America — no middlemen, no hidden fees.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql)](https://postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## What is ScrapBridge?

ScrapBridge is a full-stack B2B marketplace where industrial companies list, discover, and transact scrap metals, surplus machinery, and salvage materials. Think Bloomberg Terminal meets Linear.app — built for the people who move steel.

**Who it's for:**

| Role | What they do |
|------|-------------|
| **Scrap Yards** | List tonnes of HMS steel, non-ferrous metals, and mixed scrap by grade |
| **Demolition Companies** | Post surplus structural steel, pipe, tanks, and equipment after a teardown |
| **Ship Breakers** | Offer marine-grade steel plate, engines, pumps, and electrical equipment |
| **Manufacturers** | Find raw material feedstock; post production offcuts and defective stock |
| **Traders / Brokers** | Browse across categories, send inquiries, post RFQs for custom lots |

---

## Features

### Marketplace
- **Browse & Filter** — filter by category, condition, location, verified sellers, and freshness
- **Live Market Ticker** — real-time commodity price strip (HMS, copper, aluminium, stainless)
- **14 Material Categories** — ferrous metals, non-ferrous, engines, piping, tanks, marine, rail, aerospace, and more
- **Photo Galleries** — up to 12 photos per listing with a full-screen lightbox
- **Related Listings Carousel** — snap-scroll similar listings with nav arrows and edge fades
- **RFQ System** — post a Request for Quote; verified sellers respond directly

### Seller Tools
- **Multi-step Listing Form** — 6-step wizard with per-step validation: type → material → quantity/price → location → photos → review
- **Seller Dashboard** — view count, inquiry count, active listings, open RFQs at a glance
- **My Listings Table** — sortable data table with status, views, and inquiry count per listing
- **Inquiries Inbox** — received and sent inquiries with direct reply links

### Companies
- **Verified Badge System** — UNVERIFIED → PENDING → VERIFIED with 3× inquiry uplift
- **Company Profiles** — business type, rating, member since, active listings grid
- **Company Directory** — searchable by name, type, state, verified status

### Auth & Security
- **Credentials Auth** — email + bcrypt password, min 8 chars
- **Google OAuth** — one-click sign-in for GSuite companies
- **JWT Sessions** — company ID embedded in token for all protected routes
- **Route Middleware** — server-side redirect for `/dashboard`, `/my-listings`, `/post-listing`, `/settings`, `/inquiries`

### UX Polish
- **240-frame Splash Animation** — industrial explosion sequence on first visit (24 FPS canvas playback, skip button, session storage gate)
- **Command Palette** — `⌘K` global search across listings and companies
- **Scroll-to-top** — floating button appears after 400 px scroll
- **View Transitions** — soft cross-fade on route changes
- **Monochrome Dark Theme** — CSS variable token system, light/dark switchable

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 16 App Router | Server components, streaming, edge middleware |
| **Language** | TypeScript 5 | End-to-end type safety |
| **Styling** | Tailwind CSS v4 + CSS variables | Utility-first with semantic design tokens |
| **Database** | PostgreSQL 17 (Docker) | Full-text search, JSONB, row-level security |
| **ORM** | Prisma 7 + `@prisma/adapter-pg` | Type-safe queries, native pg driver |
| **Auth** | NextAuth.js v5 | JWT strategy, Credentials + Google OAuth |
| **Forms** | React Hook Form + Zod | Schema-driven validation, zero re-renders |
| **Animation** | Framer Motion | List stagger, photo gallery, step transitions |
| **Icons** | Lucide React | Consistent stroke-weight icon set |
| **Typography** | Inter (UI) · JetBrains Mono (prices) | Tabular numerals for prices, mono for data |

---

## Quick Start (5 minutes)

### Prerequisites

- Node.js 22+
- Docker (for PostgreSQL) **or** an existing PostgreSQL instance on port 5433

### 1 — Clone & install

```bash
git clone https://github.com/Krishmonpara/scrapbridge.git
cd scrapbridge
npm install
npx prisma generate
```

### 2 — Start the database

```bash
docker-compose up -d
```

Starts PostgreSQL on **port 5433** (`scrapbridge:scrapbridge@localhost:5433/scrapbridge`).

> Already have Postgres? Update `DATABASE_URL` in `.env` to point at your instance.

### 3 — Push the schema

```bash
npx prisma db push
```

### 4 — Seed with demo data

```bash
npm run db:seed
```

Creates **20 companies** + **100 listings** across all 14 material categories with realistic US locations, prices, and conditions.

### 5 — Run the dev server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**.

The splash animation plays once per session. Click **Skip intro →** or wait for the 240 frames to load, then click **Start Scraping** to reach the home page.

---

## Environment Variables

The `.env` file is pre-filled for the local Docker setup. No changes needed for local dev.

```env
# PostgreSQL (Docker Compose)
DATABASE_URL="postgresql://scrapbridge:scrapbridge@localhost:5433/scrapbridge"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="scrapbridge-dev-secret-change-in-production"
AUTH_SECRET="scrapbridge-dev-secret-change-in-production"

# Google OAuth (optional — credentials login works without this)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | Standard PostgreSQL connection string |
| `NEXTAUTH_URL` | ✅ | Full URL of the app (no trailing slash) |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | ✅ | Generate: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | ⬜ | Google Cloud Console → OAuth 2.0 → Client ID |
| `GOOGLE_CLIENT_SECRET` | ⬜ | Same credential as above |

---

## Database

### Schema (10 models)

```
User          ←──┐
Account       ←──┤ NextAuth
Session       ←──┘
VerificationToken

Company  ──── Listing  ──── Inquiry
    └───────── RFQ
    └───────── Review
    └───────── SavedSearch
```

### Key scripts

```bash
npx prisma db push        # Apply schema (no migrations)
npx prisma db seed        # Run prisma/seed.ts
npm run db:seed           # Alias for above
npm run db:studio         # Open Prisma Studio at localhost:5555
npx prisma generate       # Re-generate client after schema change
```

### Prisma Studio

```bash
npm run db:studio
```

Opens a visual DB browser at `http://localhost:5555`.

---

## Project Structure

```
scrapbridge/
├── app/
│   ├── (auth)/           # login, register
│   ├── (dashboard)/      # dashboard, my-listings, post-listing,
│   │                     # inquiries, settings, saved-searches
│   ├── (marketplace)/    # browse, listing/[id], companies,
│   │                     # company/[id], rfq
│   ├── api/              # Route handlers (listings, companies,
│   │                     # rfq, search, register, auth)
│   ├── home/             # Main homepage (post-splash)
│   ├── globals.css       # Design tokens + animations
│   └── layout.tsx        # Root layout (dark mode, fonts, providers)
│
├── components/
│   ├── hero/             # HeroSection, FrameAnimationHero
│   ├── listings/         # ListingCard, ListingGrid, ListingFilters,
│   │                     # RelatedListingsCarousel, ListingPhotoGallery
│   ├── company/          # CompanyCard, CompanyProfile
│   ├── forms/            # InquiryForm, RFQForm
│   ├── navigation/       # Navbar, Footer
│   ├── shared/           # Badge, FreshnessTag, MaterialIcon,
│   │                     # LocationPin, VerifiedBadge
│   └── ui/               # Button, Input, Badge, Modal, Toast,
│                         # CommandPalette, HorizontalScroll,
│                         # RelatedListingsCarousel, DataTable, ...
│
├── lib/
│   ├── auth.ts           # NextAuth config (providers, callbacks)
│   ├── prisma.ts         # Prisma client singleton (pg.Pool)
│   ├── materialImages.ts # Deterministic image URLs per category
│   └── utils.ts          # cn(), formatNumber(), formatDate()
│
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script (20 companies, 100 listings)
│
├── types/
│   └── index.ts          # Shared types + CATEGORY_LABELS, UNIT_LABELS, ...
│
├── proxy.ts              # Next.js middleware (auth guard)
├── docker-compose.yml    # PostgreSQL + optional pgAdmin
├── plan.html             # 👁 Interactive architecture graph (open in browser)
└── .env                  # Environment variables
```

---

## API Reference

All routes are under `/api/`. Auth-required routes need a valid JWT session cookie.

### `GET /api/listings`

Returns paginated active listings with company data.

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Full-text search (title, description, grade, subcategory) |
| `category` | MaterialCategory | One of 14 enum values |
| `type` | ListingType | `SELL` \| `BUY` \| `WANTED` \| `AUCTION` |
| `state` | string | Two-letter US state code |
| `verified` | `1` | Verified sellers only |
| `within` | `24h` \| `7d` \| `30d` | Posted within time window |
| `sort` | string | `newest` \| `price_asc` \| `price_desc` \| `most_inquiries` \| `expiring_soon` |
| `condition` | string | Comma-separated: `COMPLETE,DAMAGED,AS_IS,...` |
| `page` | number | Default `1` |
| `limit` | number | Default `24`, max `100` |

**Response:** `{ listings: Listing[], total: number, page: number, limit: number }`

### `POST /api/listings`

Create a new listing. Requires auth.

**Body:** Full `Listing` object (see `types/index.ts` → `Listing`)

### `POST /api/listings/inquiry`

Send an inquiry on a listing.

**Body:** `{ listingId, toCompanyId, message, contactEmail, contactPhone?, quantity? }`

### `GET /api/companies`

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Name or description search |
| `type` | BusinessType | `SCRAP_YARD` \| `DEMOLITION` \| `SHIP_BREAKER` \| ... |
| `verified` | `1` | Verified only |
| `state` | string | US state filter |

### `GET /api/search`

Global autocomplete used by the command palette.

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search term (min 2 chars) |

**Response:** `{ listings: [...], companies: [...] }`

### `GET /api/rfq`

Returns open RFQs. Optional `?category=` filter.

### `POST /api/rfq`

Post a new RFQ. Public (no auth required).

### `POST /api/register`

Create a new user + company account.

**Body:** `{ name, email, password, company, businessType }`

---

## Use Cases

### Scenario A — Demolition company posts surplus pipe

1. Register at `/register` → select "Demolition" as business type
2. Navigate to `/post-listing`
3. Step 1: Select **SELL** + **Piping & Fittings**
4. Step 2: Title "4″ Schedule 40 Carbon Steel Pipe — 2,000 ft"; Condition **Complete**
5. Step 3: 2000 ft, $1.85/ft
6. Step 4: Detroit, MI; pickup available
7. Submit → listing goes live on `/browse`

### Scenario B — Manufacturer sources aluminium scrap

1. Browse to `/browse?category=NON_FERROUS_METALS`
2. Apply filter chips: condition **Scrap Only**, state **OH**
3. Find a match → click listing card
4. On listing detail: fill in the inquiry form → seller receives email notification

### Scenario C — Trader posts RFQ for motors

1. Navigate to `/rfq`
2. Category: **Electric Motors**; quantity: 50 PIECES; delivery: Chicago, IL
3. Submit → appears in seller dashboards under "Open RFQs"
4. Sellers respond directly via contact info or inquiry

### Scenario D — Scrap yard builds verified profile

1. Register + log in → `/settings#company`
2. Fill company details, submit verification request
3. Status changes UNVERIFIED → PENDING (admin reviews in 24–48h)
4. On verification: VERIFIED badge appears on all listings; 3× inquiry uplift

---

## Design Tokens

All tokens live in `app/globals.css`. The dark palette is default (`html.dark`).

| Token | Dark value | Light value | Usage |
|-------|-----------|-------------|-------|
| `--bg-primary` | `#0a0a0a` | `#ffffff` | Page background |
| `--bg-secondary` | `#191919` | `#ffffff` | Cards, panels |
| `--bg-tertiary` | `#262626` | `#f5f5f5` | Inputs, hover states |
| `--foreground` | `#fafafa` | `#0a0a0a` | Primary text, accent |
| `--accent` | `= foreground` | `= foreground` | CTAs, prices, highlights |
| `--border` | `#383838` | `#e5e5e5` | All borders |
| `--muted-foreground` | `#a1a1a1` | `#717171` | Labels, captions |
| `--success` | `#22c55e` | `#22c55e` | Verified badges |
| `--steel-blue` | `#60a5fa` | `#60a5fa` | Links, info |
| `--copper` | `#fb923c` | `#fb923c` | WANTED listings |

Prices and data values use **JetBrains Mono**. All UI copy uses **Inter**.

---

## Architecture

For a fully interactive, clickable map of every API endpoint, UI component, caching rule, and database connection — open the architecture graph:

```bash
open plan.html
```

Click any node to see:
- **API nodes** → which UI components call them, which DB tables they touch
- **Caching nodes** → what keys, what invalidates them
- **Route nodes** → which middleware protects them, which API they call
- **DB table nodes** → which API routes read/write them

---

## Scripts Reference

```bash
npm run dev           # Dev server on :3000 (webpack mode)
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint

npx prisma db push    # Sync schema → DB (no migrations)
npm run db:seed       # Seed 20 companies + 100 listings
npm run db:studio     # Prisma Studio GUI on :5555

docker-compose up -d  # Start PostgreSQL on :5433
docker-compose down   # Stop PostgreSQL
```

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import repo in Vercel dashboard
3. Add environment variables (see [Environment Variables](#environment-variables))
4. Set up a managed PostgreSQL (Vercel Postgres, Neon, Supabase, or Railway)
5. Run `npx prisma db push` against your production DB

### Docker

```bash
docker-compose up --build
```

The `docker-compose.yml` includes Postgres. Add a Node.js service pointing at the built Next.js output for full containerisation.

---

## Known Limitations

- **No real-time** — inquiry notifications are not yet wired to email/websocket; dashboard refreshes on manual reload
- **Google OAuth** — requires adding `http://localhost:3000/api/auth/callback/google` as an authorised redirect URI in Google Cloud Console
- **Photo upload** — the drag-drop UI is a placeholder; no S3/blob integration yet (listings fall back to deterministic Flickr thumbnails)
- **Rate limiting is in-memory** — write endpoints are throttled per-IP via `lib/rate-limit.ts` (sliding window); swap the storage for `@upstash/ratelimit` when deploying multiple instances

---

## Contributing

```bash
git checkout -b feature/your-feature
# make changes
npm run lint
git commit -m "feat: your change"
git push origin feature/your-feature
# open a PR
```

---

## License

MIT © 2025 ScrapBridge
