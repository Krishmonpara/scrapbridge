# ScrapBridge — Status: ✅ Running

The app is up at **http://localhost:3000** with seeded data.

## What got fixed in this session
1. **Node.js 25.9.0 was the root cause** of every problem (permission resets, webpack worker IPC hangs). Installed Node 22 LTS via `brew install node@22` and Homebrew's `simdutf` mismatch goes away as long as you use the `node@22` binary directly.
2. Clean reinstall on Node 22 → no more 600-perm issues.
3. `prisma db push` synced schema, `db:seed` inserted 20 companies + 62 listings.
4. Fixed `prisma/seed.ts` to use the `PrismaPg` driver adapter (Prisma 7 pattern).
5. Fixed two SSR errors:
   - `components/ui/Button.tsx` — Slot was getting 2 children when `asChild` was set + loading spinner present. Now only passes a single child when delegating to Slot.
   - `components/company/CompanyCard.tsx` — was a server component with `onMouseEnter`/`onMouseLeave`. Added `'use client'`.
   - `app/page.tsx` — replaced inline mouse handlers with Tailwind `hover:` utility classes (kept it as a server component).

## Routes tested
| Path | Status |
|---|---|
| `/` | 200 |
| `/browse` | 200 |
| `/companies` | 200 |
| `/login` | 200 |
| `/register` | 200 |
| `/rfq` | 200 |
| `/api/companies` | 200 (returns all 20) |
| `/api/search?q=copper` | 200 (returns listings) |
| `/dashboard` | 307 → /login (auth gate working) |
| `/post-listing` | 307 → /login (auth gate working) |

## How to start the dev server
```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
docker compose up -d   # if not already running
npm run dev
```

## Notes
- `next.config.ts` still has `webpackBuildWorker: false` + `workerThreads: true` from the Node 25 era. Safe to remove now on Node 22 if you want to keep the build worker enabled.
- Production build (`npm run build`) hasn't been re-tested on Node 22 yet — dev mode is verified.
- Docker Postgres on port 5433, container `scrapbridge-postgres-1`.

## Known nits to look at later
- `effect` package threw `doNotation.bind is not a function` on Node 25 (this is gone on Node 22, but worth a once-over).
- The build warned `⨯ webpackBuildWorker` as an unknown experiment in the Next 16.2.6 schema — might just be a display quirk since `config-schema.js` does declare it. Cosmetic.
