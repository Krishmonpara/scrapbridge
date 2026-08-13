// Live metal price ingestion — closes Flag #3.
//
// The sample generator stays as the fallback; this writes real prints into
// PriceTick with source = FEED. Once a series has FEED ticks, every consumer
// picks them up automatically and the "sample data" banner disappears, because
// `source` travels with the series rather than being hardcoded in the UI.
//
// Provider: metals-api.com (free tier ~50 req/month), which is why this is a
// once-daily pull rather than on-demand. The response shape is a rates map
// keyed by symbol, quoted per troy ounce for precious metals and per pound for
// base metals; we only consume the base metals and convert explicitly below.
//
// Set METALS_API_KEY to enable. Without it, ingestion is a no-op and the app
// keeps serving sample data — a missing key must never break the market pages.

import { prisma } from '@/lib/prisma'
import type { MarketSymbol } from './types'

const API_BASE = 'https://metals-api.com/api/latest'

/**
 * Provider symbol → our series, with the multiplier that converts the
 * provider's quote into our stored unit.
 *
 * Copper (LME-XCU) is quoted USD per tonne by this provider; we store USD/lb,
 * hence the 1/2204.62 factor. Scrap grades are not quoted by any public feed,
 * so they are derived from the benchmark by their basis instead — see
 * DERIVED_BASIS below.
 */
const PROVIDER_MAP: { provider: string; symbol: MarketSymbol; toStored: number }[] = [
  { provider: 'XCU', symbol: 'CU_COMEX', toStored: 1 / 2204.62 },
  { provider: 'ALU', symbol: 'AL_EXTRUSION', toStored: 1 / 2204.62 },
]

/**
 * Scrap grades priced off the benchmark. These are the basis percentages a
 * yard actually pays; they drift with the market and should be re-fitted from
 * realised transaction data once there is enough of it. Until then they are
 * explicit constants rather than a hidden fudge factor.
 */
const DERIVED_BASIS: { symbol: MarketSymbol; from: MarketSymbol; pct: number }[] = [
  { symbol: 'CU_BARE_BRIGHT', from: 'CU_COMEX', pct: 0.95 },
  { symbol: 'CU_NO2', from: 'CU_COMEX', pct: 0.86 },
  { symbol: 'BRASS_YELLOW', from: 'CU_COMEX', pct: 0.62 },
]

export interface IngestResult {
  ok: boolean
  reason?: string
  written: number
  symbols: string[]
  date?: string
}

/** UTC date floor — settlement is a day, not an instant. */
function today(): Date {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * Pull the latest quotes and upsert one tick per series for today.
 * Idempotent: re-running the same day overwrites rather than duplicating,
 * which matters because the cron may retry.
 */
export async function ingestLatestPrices(): Promise<IngestResult> {
  const key = process.env.METALS_API_KEY
  if (!key) {
    return { ok: false, reason: 'METALS_API_KEY not set — serving sample data', written: 0, symbols: [] }
  }

  const symbols = PROVIDER_MAP.map((m) => m.provider).join(',')
  let rates: Record<string, number>

  try {
    const res = await fetch(`${API_BASE}?access_key=${key}&base=USD&symbols=${symbols}`, {
      // never serve a cached quote as today's print
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      return { ok: false, reason: `provider returned ${res.status}`, written: 0, symbols: [] }
    }
    const body = (await res.json()) as { success?: boolean; rates?: Record<string, number>; error?: unknown }
    if (!body.success || !body.rates) {
      return { ok: false, reason: `provider error: ${JSON.stringify(body.error ?? body)}`, written: 0, symbols: [] }
    }
    rates = body.rates
  } catch (e) {
    return { ok: false, reason: `fetch failed: ${(e as Error).message}`, written: 0, symbols: [] }
  }

  const date = today()
  const resolved = new Map<MarketSymbol, number>()

  for (const m of PROVIDER_MAP) {
    const raw = rates[m.provider]
    // metals-api inverts some pairs (USD base → metal per USD); guard against
    // a zero or absurd value writing a garbage print into the series.
    if (typeof raw !== 'number' || !isFinite(raw) || raw <= 0) continue
    const price = raw * m.toStored
    if (price <= 0 || price > 100_000) continue
    resolved.set(m.symbol, price)
  }

  for (const d of DERIVED_BASIS) {
    const base = resolved.get(d.from)
    if (base) resolved.set(d.symbol, base * d.pct)
  }

  if (resolved.size === 0) {
    return { ok: false, reason: 'no usable quotes in response', written: 0, symbols: [] }
  }

  let written = 0
  const touched: string[] = []

  for (const [symbol, close] of resolved) {
    const series = await prisma.priceSeries.findUnique({ where: { symbol } })
    if (!series) continue // series must be seeded first; loader does not invent them

    await prisma.priceTick.upsert({
      where: { seriesId_date: { seriesId: series.id, date } },
      update: { close },
      create: { seriesId: series.id, date, close },
    })
    // Flip the series off SAMPLE now that it carries a real print.
    if (series.source !== 'FEED') {
      await prisma.priceSeries.update({ where: { id: series.id }, data: { source: 'FEED' } })
    }
    written++
    touched.push(symbol)
  }

  return { ok: true, written, symbols: touched, date: date.toISOString().slice(0, 10) }
}
