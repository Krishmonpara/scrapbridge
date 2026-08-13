// Sample market data — Flag #3 (live metal price feed) is still open, so the
// series below are SYNTHESISED. They are deterministic (seeded PRNG), so every
// build renders identical numbers and diffs stay readable.
//
// The narrative attached to CU_COMEX is real: the 2026 copper move was driven
// by US refined-copper tariff policy, not supply. The daily path is invented;
// the events, dates and magnitudes come from public reporting.
//
// Every consumer surfaces `source: 'SAMPLE'` so this never masquerades as a
// live feed. Replacing this with a real provider means writing ticks into
// PriceTick and flipping the source to FEED — no consumer changes.

import type { GradeRow, MarketEvent, RegionRow, Series, MarketSymbol, QuoteUnit } from './types'

const DAYS = 180

/** mulberry32 — small deterministic PRNG so the sample never shifts between builds */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Trading days ending on `end`, skipping weekends. */
function tradingDays(end: Date, n: number): string[] {
  const out: string[] = []
  const d = new Date(end)
  while (out.length < n) {
    const day = d.getUTCDay()
    if (day !== 0 && day !== 6) out.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return out.reverse()
}

/** The anchor date for the sample. Fixed so output is stable across builds. */
export const SAMPLE_AS_OF = new Date(Date.UTC(2026, 7, 12)) // 12 Aug 2026

const DATES = tradingDays(SAMPLE_AS_OF, DAYS)

/**
 * Copper's path is hand-shaped around the real 2026 storyline: a grind higher
 * on tariff anticipation, a sharp give-back when Commerce missed its 30 June
 * deadline, then a late push as the COMEX-LME spread re-widened.
 */
function copperPath(): number[] {
  const r = rng(20260812)
  const out: number[] = []
  let v = 4.42
  for (let i = 0; i < DAYS; i++) {
    const t = i / (DAYS - 1)
    // baseline upward drift, steepening in the last third
    const drift = 0.0016 + 0.0022 * Math.max(0, t - 0.55)
    let step = drift + (r() - 0.5) * 0.019
    const date = DATES[i]
    if (date === '2026-06-30') step = -0.031 // Commerce misses the deadline
    if (date === '2026-07-01') step = -0.011
    if (date === '2026-06-18') step = 0.016
    if (date === '2026-07-09') step = 0.018
    if (date === '2026-07-22') step = 0.015
    if (date === '2026-08-10') step = 0.017
    v = v * (1 + step)
    out.push(Math.round(v * 1000) / 1000)
  }
  return out
}

const CU = copperPath()

/**
 * Scrap grades are derived from the benchmark with a stable basis plus its own
 * noise — which is how the real market behaves: a yard's #2 copper tracks
 * COMEX at a discount that widens when the market runs.
 */
function derive(base: number[], pct: number, seed: number, jitter = 0.006): number[] {
  const r = rng(seed)
  return base.map((v) => Math.round(v * pct * (1 + (r() - 0.5) * jitter) * 1000) / 1000)
}

/** Ferrous moves on its own cycle — mills, not exchanges. */
function ferrousPath(start: number, seed: number, drift: number): number[] {
  const r = rng(seed)
  const out: number[] = []
  let v = start
  for (let i = 0; i < DAYS; i++) {
    // ferrous settles monthly, so hold flat in runs then step
    const step = i % 21 === 0 ? drift + (r() - 0.5) * 0.05 : (r() - 0.5) * 0.004
    v = v * (1 + step)
    out.push(Math.round(v * 100) / 100)
  }
  return out
}

const SERIES_DEFS: {
  symbol: MarketSymbol
  label: string
  unit: QuoteUnit
  values: number[]
  benchmarkPct?: number
}[] = [
  { symbol: 'CU_COMEX', label: 'Copper, COMEX', unit: 'USD_LB', values: CU },
  { symbol: 'CU_BARE_BRIGHT', label: '#1 Copper Bare Bright', unit: 'USD_LB', values: derive(CU, 0.95, 11), benchmarkPct: 95 },
  { symbol: 'CU_NO2', label: '#2 Copper', unit: 'USD_LB', values: derive(CU, 0.86, 12), benchmarkPct: 86 },
  { symbol: 'BRASS_YELLOW', label: 'Yellow Brass', unit: 'USD_LB', values: derive(CU, 0.62, 13), benchmarkPct: 62 },
  { symbol: 'AL_EXTRUSION', label: 'Aluminium Extrusion', unit: 'USD_LB', values: derive(CU, 0.21, 14, 0.01), benchmarkPct: 21 },
  { symbol: 'SS_304', label: 'Stainless 304 Solids', unit: 'USD_LB', values: derive(CU, 0.34, 15, 0.012), benchmarkPct: 34 },
  { symbol: 'HMS_1', label: 'HMS #1', unit: 'USD_TON', values: ferrousPath(352, 21, 0.026) },
  { symbol: 'HMS_12', label: 'HMS #1&2 (80:20)', unit: 'USD_TON', values: ferrousPath(338, 22, 0.025) },
  { symbol: 'SHRED_STEEL', label: 'Shredded Steel', unit: 'USD_TON', values: ferrousPath(366, 23, 0.027) },
  { symbol: 'BUSHELING', label: '#1 Busheling', unit: 'USD_TON', values: ferrousPath(404, 24, 0.028) },
]

/** Real 2026 copper reporting, mapped onto the sample path. */
const COPPER_EVENTS: MarketEvent[] = [
  {
    date: '2026-06-18',
    category: 'INVENTORY',
    headline: 'LME stocks drawn down as metal routes to the US',
    body: 'Warehouse stocks fell sharply as traders moved units ahead of any duty, tightening prompt availability outside the US.',
    impactPct: 1.6,
    sourceName: 'Discovery Alert',
  },
  {
    date: '2026-06-30',
    category: 'POLICY',
    headline: 'Commerce Dept. misses its tariff recommendation deadline',
    body: 'The department let the 30 June deadline pass without a recommendation on refined copper. Positions built for an announcement unwound, and the market gave back weeks of gains in a session.',
    impactPct: -3.1,
    sourceName: 'ING Think',
  },
  {
    date: '2026-07-09',
    category: 'INVENTORY',
    headline: 'COMEX inventories reach a record ~650,000 tons',
    body: 'US stocks rose roughly eight-fold from ~80,000 t, concentrating global inventory onshore and stranding supply outside the US.',
    impactPct: 1.8,
    sourceName: 'TradingKey',
  },
  {
    date: '2026-07-22',
    category: 'FORECAST',
    headline: 'Goldman sees copper breaching $14,000/t once tariffs bite',
    body: 'A widely-circulated forecast pulled speculative length back into the contract and reset the market ceiling.',
    impactPct: 1.5,
    sourceName: 'TradingKey',
  },
  {
    date: '2026-08-10',
    category: 'POLICY',
    headline: 'Tariff shift puts the COMEX-LME spread back in focus',
    body: 'The premium widened to roughly 19 cents/lb, about 8x its two-decade average, as US buyers re-priced the odds of the duty becoming law.',
    impactPct: 1.7,
    sourceName: 'Tradingpedia',
  },
]

const FERROUS_EVENTS: MarketEvent[] = [
  {
    date: '2026-07-01',
    category: 'DEMAND',
    headline: 'July mill buy opens up $20/ton on restocking',
    body: 'Domestic mills entered the July buy short on prime grades after a thin June, lifting obsolete grades with them.',
    impactPct: 2.6,
    sourceName: 'Mill buy summary',
  },
  {
    date: '2026-08-03',
    category: 'SUPPLY',
    headline: 'Summer flow slows as demolition slates thin out',
    body: 'Yard intake fell through late summer, keeping obsolete grades firm even as export interest softened.',
    impactPct: 1.4,
    sourceName: 'Yard intake survey',
  },
]

function eventsFor(symbol: MarketSymbol): MarketEvent[] {
  if (symbol === 'CU_COMEX') return COPPER_EVENTS
  if (symbol === 'CU_BARE_BRIGHT' || symbol === 'CU_NO2' || symbol === 'BRASS_YELLOW') {
    return COPPER_EVENTS.filter((e) => e.category === 'POLICY')
  }
  if (symbol === 'HMS_1' || symbol === 'SHRED_STEEL' || symbol === 'BUSHELING' || symbol === 'HMS_12') {
    return FERROUS_EVENTS
  }
  return []
}

export function sampleSeries(symbol: MarketSymbol): Series | null {
  const def = SERIES_DEFS.find((d) => d.symbol === symbol)
  if (!def) return null
  return {
    symbol: def.symbol,
    label: def.label,
    unit: def.unit,
    source: 'SAMPLE',
    ticks: DATES.map((date, i) => ({ date, close: def.values[i] })),
    events: eventsFor(def.symbol),
  }
}

export function sampleGrades(): GradeRow[] {
  return SERIES_DEFS.map((d) => {
    const v = d.values
    const last = v[v.length - 1]
    const prev = v[v.length - 2] ?? last
    return {
      symbol: d.symbol,
      label: d.label,
      unit: d.unit,
      last,
      changePct: ((last - prev) / prev) * 100,
      spark: v.slice(-24),
      pctOfBenchmark: d.benchmarkPct ?? null,
    }
  })
}

/**
 * Regional dispersion for HMS #1. Freight and mill density mean the same grade
 * clears at materially different numbers by region — the spread a dealer
 * actually trades against.
 */
export function sampleRegions(): RegionRow[] {
  const national = SERIES_DEFS.find((d) => d.symbol === 'HMS_1')!.values.slice(-1)[0]
  const offsets: [string, number][] = [
    ['Midwest', 1.06],
    ['Great Lakes', 1.03],
    ['Northeast', 0.99],
    ['Southeast', 0.96],
    ['Gulf Coast', 0.94],
    ['West Coast', 0.91],
  ]
  return offsets.map(([region, m]) => ({
    region,
    price: Math.round(national * m),
    vsNational: Math.round(national * m - national),
  }))
}

export const SAMPLE_SYMBOLS = SERIES_DEFS.map((d) => d.symbol)
