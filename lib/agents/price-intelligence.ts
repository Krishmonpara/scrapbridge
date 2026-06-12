// Price Intelligence Agent — compares a listing's asking price against a
// reference spot range for its material category. Reference values are a
// static snapshot (USD per metric ton) modeled on LME / ISRI composite
// ranges; swap in a live feed (LME API, MSTC) without changing consumers.

import type { MaterialCategory, Unit } from '@/types'

export interface PriceSignal {
  verdict: 'FAIR' | 'BELOW_MARKET' | 'ABOVE_MARKET' | 'UNKNOWN'
  /** percent deviation from the midpoint of the reference range, e.g. -12 */
  deviationPct: number | null
  referenceLow: number | null
  referenceHigh: number | null
  note: string
}

// USD per metric ton, conservative scrap-market ranges
const SPOT_RANGES: Partial<Record<MaterialCategory, [number, number]>> = {
  FERROUS_METALS: [250, 450],
  NON_FERROUS_METALS: [1800, 9500], // wide: aluminium → copper
  ENGINES_DRIVETRAIN: [300, 800],
  ELECTRIC_MOTORS: [500, 1400],
  PIPING_FITTINGS: [300, 900],
  TANKS_VESSELS: [250, 700],
  HEAVY_MACHINERY: [400, 1200],
  MARINE_OFFSHORE: [280, 650],
  RAIL_TRANSPORT: [280, 550],
  AEROSPACE: [1500, 12000],
  CONSTRUCTION_DEMOLITION: [180, 400],
  ELECTRONIC_ELECTRICAL: [800, 4000],
  PRECIOUS_SPECIALTY: [5000, 60000],
  INDUSTRIAL_EQUIPMENT: [350, 1100],
}

// convert listing price to USD/metric-ton when the unit allows it
const TON_FACTORS: Partial<Record<Unit, number>> = {
  TONS: 1.10231, // listing tons assumed short tons → metric
  KG: 1000,
  LBS: 2204.62,
}

export function getPriceSignal(listing: {
  materialCategory: MaterialCategory
  pricePerUnit?: number | null
  unit: Unit
  currency?: string | null
}): PriceSignal {
  const range = SPOT_RANGES[listing.materialCategory]
  const factor = TON_FACTORS[listing.unit]

  if (!range || !factor || !listing.pricePerUnit || listing.pricePerUnit <= 0) {
    return {
      verdict: 'UNKNOWN',
      deviationPct: null,
      referenceLow: range?.[0] ?? null,
      referenceHigh: range?.[1] ?? null,
      note: 'Not enough data to benchmark this price.',
    }
  }

  // only benchmark USD listings; other currencies need FX normalization
  if (listing.currency && listing.currency !== 'USD') {
    return {
      verdict: 'UNKNOWN',
      deviationPct: null,
      referenceLow: range[0],
      referenceHigh: range[1],
      note: 'Benchmark available for USD listings only.',
    }
  }

  const pricePerTon = listing.pricePerUnit * factor
  const [low, high] = range
  const mid = (low + high) / 2
  const deviationPct = Math.round(((pricePerTon - mid) / mid) * 100)

  if (pricePerTon < low * 0.7) {
    return {
      verdict: 'BELOW_MARKET',
      deviationPct,
      referenceLow: low,
      referenceHigh: high,
      note: 'Priced well below typical market range — strong buy signal, or verify the seller.',
    }
  }
  if (pricePerTon <= high * 1.1) {
    return {
      verdict: 'FAIR',
      deviationPct,
      referenceLow: low,
      referenceHigh: high,
      note: 'Within the typical market range for this category.',
    }
  }
  return {
    verdict: 'ABOVE_MARKET',
    deviationPct,
    referenceLow: low,
    referenceHigh: high,
    note: 'Priced above the typical market range — expect negotiation.',
  }
}
