# ScrapBridge — Industrial Scrap Materials Marketplace

> The world's B2B marketplace for scrap metals, industrial equipment, engines, and surplus materials.
> Bloomberg Terminal meets Linear.app — but for heavy industry.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + CSS variables |
| Database | PostgreSQL (via Docker) |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Auth | NextAuth.js v5 (Credentials + Google OAuth) |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Icons | Lucide React |
| Typography | Inter (UI) + JetBrains Mono (prices/data) |

---

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Start PostgreSQL (Docker)

```bash
docker-compose up -d
```

This starts Postgres on port 5432 with user/password/db all set to `scrapbridge`.

### 3. Configure Environment

The `.env` file is pre-filled for local Docker. Verify the values:

```env
DATABASE_URL="postgresql://scrapbridge:scrapbridge@localhost:5432/scrapbridge"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="scrapbridge-dev-secret-change-in-production"
GOOGLE_CLIENT_ID=""        # Optional — for Google OAuth
GOOGLE_CLIENT_SECRET=""    # Optional — for Google OAuth
```

### 4. Push Database Schema

```bash
npx prisma db push
```

### 5. Seed the Database

```bash
npm run db:seed
```

Creates 20 companies + 100 listings across all material categories.

### 6. Start Dev Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_URL` | ✅ | Full app URL (`http://localhost:3000` for dev) |
| `NEXTAUTH_SECRET` | ✅ | JWT secret. Generate: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | ⬜ | Google OAuth (optional) |
| `GOOGLE_CLIENT_SECRET` | ⬜ | Google OAuth (optional) |

---

## Scripts

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run start        # Production server
npm run db:push      # Push schema to DB
npm run db:seed      # Seed with 20 companies + 100 listings
npm run db:studio    # Open Prisma Studio GUI
```

---

## Design System

CSS custom properties in `globals.css`:

| Token | Value | Use |
|-------|-------|-----|
| `--bg-primary` | `#0a0e14` | Page background |
| `--bg-secondary` | `#111820` | Cards, surfaces |
| `--accent` | `#e8831a` | CTAs, highlights (industrial amber) |
| `--text-primary` | `#e8edf2` | Headings, body |
| `--text-secondary` | `#7a9ab5` | Labels, muted |
| `--success` | `#1a8c4e` | Verified badges |
| `--steel-blue` | `#1e6fa5` | Links, info |

Prices use **JetBrains Mono**. UI uses **Inter**.

---

## Animation Injection Point

`components/hero/HeroSection.tsx` has a clearly marked slot for the 240-frame industrial refinery explosion animation. Replace `#animation-frame` with `<RefineryExplosion />` when frames are ready.

---

## API Routes

| Endpoint | Methods | Query Params |
|----------|---------|-------------|
| `/api/listings` | GET, POST | `search`, `category`, `type`, `state`, `verified`, `within`, `sort`, `condition`, `page`, `limit` |
| `/api/listings/inquiry` | POST | — |
| `/api/companies` | GET | `search`, `type`, `verified`, `state` |
| `/api/rfq` | GET, POST | `category` |
| `/api/search` | GET | `q` |

---

## Old Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
