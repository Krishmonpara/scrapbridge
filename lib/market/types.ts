// Shared shapes for the market intelligence layer. These mirror the Prisma
// models (PriceSeries / PriceTick / MarketEvent / PriceForecast) but stay
// plain so the sample-data fallback and the DB path return the same thing.

export type MarketSymbol =
  | 'CU_COMEX'
  | 'CU_BARE_BRIGHT'
  | 'CU_NO2'
  | 'BRASS_YELLOW'
  | 'AL_EXTRUSION'
  | 'HMS_1'
  | 'HMS_12'
  | 'SHRED_STEEL'
  | 'BUSHELING'
  | 'SS_304'

export type QuoteUnit = 'USD_LB' | 'USD_TON' | 'USD_CWT'

export type EventCategory =
  | 'POLICY'
  | 'SUPPLY'
  | 'DEMAND'
  | 'INVENTORY'
  | 'MACRO'
  | 'FORECAST'

export type PriceSource = 'SAMPLE' | 'MANUAL' | 'FEED'

export interface Tick {
  /** ISO date, YYYY-MM-DD */
  date: string
  close: number
}

export interface MarketEvent {
  date: string
  category: EventCategory
  headline: string
  body: string
  /** signed same-day price impact in percent */
  impactPct: number | null
  sourceName: string
  sourceUrl?: string | null
}

export interface Series {
  symbol: MarketSymbol
  label: string
  unit: QuoteUnit
  source: PriceSource
  ticks: Tick[]
  events: MarketEvent[]
}

export interface ForecastPoint {
  date: string
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

export interface Forecast {
  method: string
  runDate: string
  points: ForecastPoint[]
  /** annualised volatility implied by the history, as a fraction */
  sigmaAnnual: number
  /** mean daily drift, as a fraction */
  driftDaily: number
}

/** A scrap grade priced off a benchmark, with its realised basis. */
export interface GradeRow {
  symbol: MarketSymbol
  label: string
  unit: QuoteUnit
  last: number
  changePct: number
  spark: number[]
  /** percent of the benchmark this grade fetched, e.g. 88 */
  pctOfBenchmark: number | null
}

export interface RegionRow {
  region: string
  price: number
  vsNational: number
}

export const UNIT_SUFFIX: Record<QuoteUnit, string> = {
  USD_LB: '/lb',
  USD_TON: '/ton',
  USD_CWT: '/cwt',
}

export const EVENT_LABELS: Record<EventCategory, string> = {
  POLICY: 'Policy',
  SUPPLY: 'Supply',
  DEMAND: 'Demand',
  INVENTORY: 'Inventory',
  MACRO: 'Macro',
  FORECAST: 'Forecast',
}

export function formatQuote(v: number, unit: QuoteUnit): string {
  return unit === 'USD_TON'
    ? `$${Math.round(v)}${UNIT_SUFFIX[unit]}`
    : `$${v.toFixed(2)}${UNIT_SUFFIX[unit]}`
}
