// Mark-to-market valuation for a dealer's own inventory.
//
// UNIT CONVENTIONS — the single biggest correctness risk in this file, because
// a wrong factor here tells a dealer the wrong number about their own money.
// Stated explicitly rather than left implicit:
//
//   * A lot's `Unit.TONS` means a SHORT (net) ton = 2000 lb. This matches the
//     existing assumption in price-intelligence.ts ("listing tons assumed short
//     tons") and US domestic scrap practice.
//   * A series' `QuoteUnit.USD_TON` likewise means USD per SHORT ton. Export
//     ferrous is often quoted per gross (long) ton — if a gross-ton series is
//     ever ingested it needs its own QuoteUnit, not a silent reinterpretation.
//   * `USD_CWT` is per hundredweight = 100 lb.
//
// NOTE ON REUSE: this deliberately does NOT reuse `TON_FACTORS` from
// price-intelligence.ts. That table converts a *price per unit* into a *price
// per metric ton* for benchmarking against SPOT_RANGES. What we need here is
// the opposite direction — a *quantity* expressed in the series' quote basis —
// and its metric-ton pivot would add a rounding hop and conflate short/metric
// tons. Two small explicit tables beat one overloaded one.

import type { QuoteUnit } from '@/lib/market/types'

export type LotUnit = 'TONS' | 'LBS' | 'KG' | 'PIECES' | 'LOT'

/** Pounds per unit of quantity. Non-mass units are unvaluable by design. */
const POUNDS_PER: Partial<Record<LotUnit, number>> = {
  TONS: 2000,
  LBS: 1,
  KG: 2.2046226218,
}

/** How many of the series' quote units one pound represents. */
const QUOTE_UNITS_PER_POUND: Record<QuoteUnit, number> = {
  USD_LB: 1,
  USD_TON: 1 / 2000,
  USD_CWT: 1 / 100,
}

/** A price older than this is reported as stale rather than shown bare. */
export const STALE_AFTER_DAYS = 7

export interface LotInput {
  quantity: number
  unit: LotUnit
  costBasis?: number | null
}

export interface LotValuation {
  /** null when the lot cannot be valued; `reason` says why */
  marketValue: number | null
  /** total cost, null when the dealer never entered a basis */
  costTotal: number | null
  /** null unless BOTH market value and cost basis are known */
  unrealizedPnl: number | null
  unrealizedPct: number | null
  stale: boolean
  asOf: string | null
  reason?: string
}

/** Convert a quantity to pounds. Returns null for non-mass units. */
export function toPounds(quantity: number, unit: LotUnit): number | null {
  const f = POUNDS_PER[unit]
  if (f === undefined) return null
  if (!isFinite(quantity) || quantity < 0) return null
  return quantity * f
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000)
}

/**
 * Value one lot against the latest close of its series.
 *
 * `close` is the price in `quoteUnit`; `asOf` is that print's date. Passing a
 * null close (no ticks for the series) yields an unvalued result rather than a
 * zero, because zero would silently read as "worthless" on the dashboard.
 */
export function valueLot(
  lot: LotInput,
  close: number | null,
  quoteUnit: QuoteUnit,
  asOf: string | null,
  now: Date = new Date()
): LotValuation {
  const base: LotValuation = {
    marketValue: null,
    costTotal: null,
    unrealizedPnl: null,
    unrealizedPct: null,
    stale: false,
    asOf,
  }

  const pounds = toPounds(lot.quantity, lot.unit)
  if (pounds === null) {
    return {
      ...base,
      reason:
        lot.unit === 'PIECES' || lot.unit === 'LOT'
          ? 'Priced by the piece — no weight to mark against a per-pound benchmark.'
          : 'Quantity is not a valid weight.',
    }
  }

  // cost is knowable even when there is no market price
  const costTotal =
    lot.costBasis != null && isFinite(lot.costBasis) && lot.costBasis >= 0
      ? lot.costBasis * lot.quantity
      : null

  if (close == null || !isFinite(close) || close <= 0) {
    return { ...base, costTotal, reason: 'No price on file for this grade yet.' }
  }

  const quoteUnits = pounds * QUOTE_UNITS_PER_POUND[quoteUnit]
  const marketValue = round2(quoteUnits * close)

  const stale = asOf ? daysBetween(now, new Date(`${asOf}T00:00:00Z`)) > STALE_AFTER_DAYS : false

  const unrealizedPnl = costTotal != null ? round2(marketValue - costTotal) : null
  const unrealizedPct =
    costTotal != null && costTotal > 0 ? round2(((marketValue - costTotal) / costTotal) * 100) : null

  return { marketValue, costTotal, unrealizedPnl, unrealizedPct, stale, asOf }
}

export interface PortfolioTotals {
  marketValue: number
  /** cost of only those lots that carry a basis AND could be valued */
  costTotal: number
  unrealizedPnl: number
  unrealizedPct: number | null
  /** lots we could not value, so the UI can say so instead of under-reporting */
  unvaluedCount: number
  staleCount: number
  lotCount: number
}

/**
 * Roll lot valuations into portfolio totals.
 *
 * P&L only aggregates lots that have BOTH a market value and a cost basis —
 * mixing in cost-less lots would understate the return on the ones that have
 * one. `unvaluedCount` is surfaced so the total never silently pretends to be
 * the whole portfolio.
 */
export function totalPosition(vals: LotValuation[]): PortfolioTotals {
  let marketValue = 0
  let costTotal = 0
  let pnlBase = 0
  let unrealizedPnl = 0
  let unvaluedCount = 0
  let staleCount = 0

  for (const v of vals) {
    if (v.marketValue == null) {
      unvaluedCount++
      continue
    }
    marketValue += v.marketValue
    if (v.stale) staleCount++
    if (v.costTotal != null) {
      costTotal += v.costTotal
      pnlBase += v.costTotal
      unrealizedPnl += v.marketValue - v.costTotal
    }
  }

  return {
    marketValue: round2(marketValue),
    costTotal: round2(costTotal),
    unrealizedPnl: round2(unrealizedPnl),
    unrealizedPct: pnlBase > 0 ? round2((unrealizedPnl / pnlBase) * 100) : null,
    unvaluedCount,
    staleCount,
    lotCount: vals.length,
  }
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}
