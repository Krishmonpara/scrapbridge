// Position data access. Every function here is company-scoped by construction:
// inventory reveals what a yard is holding and at what cost, which is exactly
// what a competitor would want. There is no "all lots" query on purpose.

import { prisma } from '@/lib/prisma'
import { getSeries } from '@/lib/market/queries'
import { SAMPLE_SYMBOLS } from '@/lib/market/sample-data'
import type { MarketSymbol, QuoteUnit } from '@/lib/market/types'
import { totalPosition, valueLot, type LotUnit, type LotValuation, type PortfolioTotals } from './valuation'

export interface LotRow {
  id: string
  symbol: MarketSymbol
  seriesLabel: string
  label: string | null
  quantity: number
  unit: LotUnit
  costBasis: number | null
  acquiredAt: string
  status: 'HELD' | 'LISTED' | 'SOLD'
  notes: string | null
  valuation: LotValuation
  /** the price the valuation used, for transparency */
  price: number | null
  quoteUnit: QuoteUnit
}

export interface PositionView {
  lots: LotRow[]
  totals: PortfolioTotals
  /** true when any contributing series is still synthesised sample data */
  usingSamplePrices: boolean
}

/**
 * Latest close per symbol, resolved once and shared across lots so a
 * fifty-lot portfolio does not issue fifty series reads.
 */
async function latestPrices() {
  const map = new Map<
    MarketSymbol,
    { close: number | null; unit: QuoteUnit; asOf: string | null; label: string; sample: boolean }
  >()
  const series = await Promise.all(SAMPLE_SYMBOLS.map((s) => getSeries(s)))
  for (const s of series) {
    if (!s) continue
    const last = s.ticks.at(-1)
    map.set(s.symbol, {
      close: last?.close ?? null,
      unit: s.unit,
      asOf: last?.date ?? null,
      label: s.label,
      sample: s.source === 'SAMPLE',
    })
  }
  return map
}

export async function getPosition(companyId: string): Promise<PositionView> {
  const prices = await latestPrices()

  let rows: {
    id: string
    symbol: string
    label: string | null
    quantity: number
    unit: string
    costBasis: number | null
    acquiredAt: Date
    status: string
    notes: string | null
  }[] = []

  try {
    rows = await prisma.inventoryLot.findMany({
      where: { companyId, status: { not: 'SOLD' } },
      orderBy: { acquiredAt: 'desc' },
    })
  } catch {
    // DB unavailable — an empty position is the honest answer. We never
    // substitute sample lots: a dealer must not see holdings that aren't theirs.
    return { lots: [], totals: totalPosition([]), usingSamplePrices: false }
  }

  let usingSamplePrices = false

  const lots: LotRow[] = rows.map((r) => {
    const symbol = r.symbol as MarketSymbol
    const p = prices.get(symbol)
    if (p?.sample) usingSamplePrices = true
    const valuation = valueLot(
      { quantity: r.quantity, unit: r.unit as LotUnit, costBasis: r.costBasis },
      p?.close ?? null,
      p?.unit ?? 'USD_LB',
      p?.asOf ?? null
    )
    return {
      id: r.id,
      symbol,
      seriesLabel: p?.label ?? symbol,
      label: r.label,
      quantity: r.quantity,
      unit: r.unit as LotUnit,
      costBasis: r.costBasis,
      acquiredAt: r.acquiredAt.toISOString().slice(0, 10),
      status: r.status as LotRow['status'],
      notes: r.notes,
      valuation,
      price: p?.close ?? null,
      quoteUnit: p?.unit ?? 'USD_LB',
    }
  })

  return {
    lots,
    totals: totalPosition(lots.map((l) => l.valuation)),
    usingSamplePrices: usingSamplePrices && lots.length > 0,
  }
}

/** Symbols a lot may reference, with labels, for the add-lot form. */
export async function getSymbolChoices(): Promise<{ symbol: MarketSymbol; label: string; unit: QuoteUnit }[]> {
  const prices = await latestPrices()
  return [...prices.entries()].map(([symbol, p]) => ({ symbol, label: p.label, unit: p.unit }))
}
