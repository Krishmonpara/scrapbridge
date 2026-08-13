// Market data access. Reads PriceSeries/PriceTick/MarketEvent when the tables
// exist and are populated; otherwise falls back to the synthesised sample set.
//
// The fallback is not a convenience hack — hosted Postgres is still pending
// (§13) and Flag #3 is open, so the market pages must render without a feed.
// `source` travels with every series, and the UI labels SAMPLE explicitly.

import { prisma } from '@/lib/prisma'
import { sampleGrades, sampleRegions, sampleSeries, SAMPLE_SYMBOLS } from './sample-data'
import type { GradeRow, MarketSymbol, RegionRow, Series } from './types'

/**
 * The generated Prisma client only knows the market models after
 * `prisma generate` runs against the updated schema. Until the DB is
 * reachable that codegen cannot happen, so the market delegates are reached
 * through this narrow structural type. Every call is inside try/catch and
 * falls back to sample data, so an un-migrated client degrades rather than
 * crashing the page.
 */
type MarketDelegates = {
  priceSeries?: {
    findUnique(args: unknown): Promise<{
      symbol: string
      label: string
      unit: string
      source: string
      ticks: { date: Date; close: number }[]
      events: {
        date: Date
        category: string
        headline: string
        body: string
        impactPct: number | null
        sourceName: string
        sourceUrl: string | null
      }[]
    } | null>
  }
}

function marketDb(): MarketDelegates {
  return prisma as unknown as MarketDelegates
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** How long a market query may block before we fall back to sample data. */
const DB_TIMEOUT_MS = 1500

/**
 * Bound a DB call. An unreachable Postgres does not fail fast — it blocks
 * until the driver's connect timeout, and the grade ladder issues one query
 * per symbol, so an outage would otherwise stall the whole page for as long
 * as those add up. Losing the race yields `null` and the caller falls back.
 */
function withTimeout<T>(p: Promise<T>): Promise<T | null> {
  return Promise.race([
    p.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), DB_TIMEOUT_MS)),
  ])
}

export async function getSeries(symbol: MarketSymbol): Promise<Series | null> {
  try {
    const model = marketDb().priceSeries
    if (!model) return sampleSeries(symbol)

    const row = await withTimeout(
      model.findUnique({
        where: { symbol },
        include: {
          ticks: { orderBy: { date: 'asc' } },
          events: { orderBy: { date: 'asc' } },
        },
      })
    )
    if (!row || row.ticks.length === 0) return sampleSeries(symbol)

    return {
      symbol: row.symbol as MarketSymbol,
      label: row.label,
      unit: row.unit as Series['unit'],
      source: row.source as Series['source'],
      ticks: row.ticks.map((t) => ({ date: iso(t.date), close: t.close })),
      events: row.events.map((e) => ({
        date: iso(e.date),
        category: e.category as Series['events'][number]['category'],
        headline: e.headline,
        body: e.body,
        impactPct: e.impactPct,
        sourceName: e.sourceName,
        sourceUrl: e.sourceUrl,
      })),
    }
  } catch {
    return sampleSeries(symbol)
  }
}

/** Every tracked grade, benchmark first — the ladder a dealer prices against. */
export async function getGrades(): Promise<GradeRow[]> {
  try {
    const rows = await Promise.all(SAMPLE_SYMBOLS.map((s) => getSeries(s)))
    const built = rows.filter((r): r is Series => !!r && r.ticks.length > 1)
    if (built.length === 0) return sampleGrades()

    const benchmark = built.find((s) => s.symbol === 'CU_COMEX')
    const benchLast = benchmark?.ticks.at(-1)?.close ?? null

    return built.map((s) => {
      const last = s.ticks.at(-1)!.close
      const prev = s.ticks.at(-2)!.close
      const isCopperFamily = s.unit === 'USD_LB' && s.symbol !== 'CU_COMEX'
      return {
        symbol: s.symbol,
        label: s.label,
        unit: s.unit,
        last,
        changePct: ((last - prev) / prev) * 100,
        spark: s.ticks.slice(-24).map((t) => t.close),
        pctOfBenchmark:
          isCopperFamily && benchLast ? Math.round((last / benchLast) * 100) : null,
      }
    })
  } catch {
    return sampleGrades()
  }
}

export async function getRegions(): Promise<RegionRow[]> {
  return sampleRegions()
}

/**
 * What is actually flowing through the marketplace right now, by category.
 * This is real proprietary data — listings ScrapBridge holds and nobody else
 * does — so it is read straight from the DB with no sample fallback. An empty
 * result renders an empty state rather than invented supply.
 */
export async function getYardSupply(): Promise<
  { category: string; listings: number; tons: number | null }[]
> {
  try {
    const grouped = await withTimeout(
      prisma.listing.groupBy({
        by: ['materialCategory'],
        where: { status: 'ACTIVE', listingType: 'SELL' },
        _count: { id: true },
        _sum: { quantity: true },
      })
    )
    if (!grouped) return []
    return grouped
      .map((g) => ({
        category: g.materialCategory as string,
        listings: g._count.id,
        tons: g._sum.quantity,
      }))
      .sort((a, b) => b.listings - a.listings)
  } catch {
    return []
  }
}
