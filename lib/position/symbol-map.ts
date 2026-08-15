// Maps a priced series onto the marketplace's own taxonomy, so a dealer can
// turn a tracked lot into a listing without re-entering what the system
// already knows.
//
// The two vocabularies exist for different reasons and should not be merged:
// MarketSymbol is a *pricing* identity (one series, one quote unit), while
// MaterialCategory is a *browse* facet. Several symbols legitimately collapse
// onto one category — that is the mapping doing its job, not a modelling error.

import type { MarketSymbol } from '@/lib/market/types'
import type { MaterialCategory } from '@/types'

export interface SymbolListingDefaults {
  category: MaterialCategory
  /** the trade name a buyer searches for, prefilled into the grade field */
  grade: string
  /** how the grade is normally sold, used to preselect the unit */
  unit: 'TONS' | 'LBS'
}

export const SYMBOL_LISTING_DEFAULTS: Record<MarketSymbol, SymbolListingDefaults> = {
  // Non-ferrous is quoted per pound and sold by the pound.
  CU_COMEX: { category: 'NON_FERROUS_METALS', grade: 'Copper', unit: 'LBS' },
  CU_BARE_BRIGHT: { category: 'NON_FERROUS_METALS', grade: '#1 Copper Bare Bright', unit: 'LBS' },
  CU_NO2: { category: 'NON_FERROUS_METALS', grade: '#2 Copper', unit: 'LBS' },
  BRASS_YELLOW: { category: 'NON_FERROUS_METALS', grade: 'Yellow Brass', unit: 'LBS' },
  AL_EXTRUSION: { category: 'NON_FERROUS_METALS', grade: 'Aluminium Extrusion', unit: 'LBS' },
  // Stainless carries iron but the scrap trade prices and moves it with the
  // non-ferrous book, so it browses there rather than under FERROUS_METALS.
  SS_304: { category: 'NON_FERROUS_METALS', grade: 'Stainless 304 Solids', unit: 'LBS' },

  // Ferrous grades are quoted and sold by the ton.
  HMS_1: { category: 'FERROUS_METALS', grade: 'HMS #1', unit: 'TONS' },
  HMS_12: { category: 'FERROUS_METALS', grade: 'HMS #1&2 (80:20)', unit: 'TONS' },
  SHRED_STEEL: { category: 'FERROUS_METALS', grade: 'Shredded Steel', unit: 'TONS' },
  BUSHELING: { category: 'FERROUS_METALS', grade: '#1 Busheling', unit: 'TONS' },
}

/**
 * A listing title a buyer would actually recognise, e.g.
 * "42 tons of #2 Copper". The dealer's private label for the pile
 * ("Bin 4") is deliberately not used — it means nothing to a buyer.
 */
export function suggestListingTitle(
  symbol: MarketSymbol,
  quantity: number,
  unit: string
): string {
  const grade = SYMBOL_LISTING_DEFAULTS[symbol]?.grade ?? symbol
  const qty = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2)
  const unitWord: Record<string, string> = {
    TONS: 'tons',
    LBS: 'lbs',
    KG: 'kg',
    PIECES: 'pieces',
    LOT: 'lot',
  }
  return `${qty} ${unitWord[unit] ?? unit.toLowerCase()} of ${grade}`
}
