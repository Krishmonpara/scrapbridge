/**
 * Category-themed photo URLs.
 *
 * We use loremflickr.com — it returns a Creative Commons Flickr photo matching the
 * keywords. The `lock` parameter pins a specific image so the same listing always
 * shows the same photo (deterministic across reloads, builds, and seeds).
 */

const KEYWORDS: Record<string, string[]> = {
  FERROUS_METALS: ['steel,scrap', 'iron,scrap', 'rebar,steel', 'scrap,metal,yard'],
  NON_FERROUS_METALS: ['copper,wire', 'aluminum,scrap', 'brass,metal', 'copper,industrial'],
  ENGINES_DRIVETRAIN: ['engine,industrial', 'diesel,engine', 'motor,used', 'engine,scrap'],
  ELECTRIC_MOTORS: ['electric,motor', 'industrial,motor', 'generator,industrial', 'motor,coil'],
  PIPING_FITTINGS: ['pipe,steel', 'industrial,pipe', 'pipeline,metal', 'pipe,fitting'],
  TANKS_VESSELS: ['tank,industrial', 'pressure,vessel', 'storage,tank', 'industrial,tank'],
  HEAVY_MACHINERY: ['bulldozer,construction', 'excavator,used', 'crane,industrial', 'machinery,heavy'],
  MARINE_OFFSHORE: ['ship,industrial', 'marine,scrap', 'shipyard', 'boat,scrap'],
  RAIL_TRANSPORT: ['railroad,track', 'train,scrap', 'railway,industrial', 'rail,track'],
  AEROSPACE: ['aircraft,scrap', 'aviation,industrial', 'airplane,parts', 'jet,engine'],
  CONSTRUCTION_DEMOLITION: ['demolition,construction', 'rubble,construction', 'building,demolition', 'construction,site'],
  ELECTRONIC_ELECTRICAL: ['electronics,circuit', 'circuit,board', 'wires,electrical', 'electrical,scrap'],
  PRECIOUS_SPECIALTY: ['gold,bar', 'silver,metal', 'platinum,industrial', 'precious,metal'],
  INDUSTRIAL_EQUIPMENT: ['factory,industrial', 'industrial,equipment', 'machinery,factory', 'workshop,industrial'],
}

const FALLBACK = ['scrap,metal', 'industrial,yard', 'metal,recycling']

/**
 * Deterministic image URL for a listing in a given category.
 *
 * @param category MaterialCategory enum value
 * @param seed     Stable identifier (listing index, slug, etc.) — same seed → same image
 */
export function getMaterialImage(category: string, seed: number | string = 0): string {
  const list = KEYWORDS[category] || FALLBACK
  const seedNum =
    typeof seed === 'number' ? seed : [...String(seed)].reduce((s, c) => s + c.charCodeAt(0), 0)
  const kw = list[seedNum % list.length]
  // lock pins a specific photo for this (kw, lock) pair
  const lock = (seedNum * 31 + 7) % 9999
  return `https://loremflickr.com/800/600/${kw}/?lock=${lock}`
}

/** Same as getMaterialImage but returns multiple photos for a gallery. */
export function getMaterialImages(category: string, seed: number | string = 0, count = 3): string[] {
  const seedNum =
    typeof seed === 'number' ? seed : [...String(seed)].reduce((s, c) => s + c.charCodeAt(0), 0)
  return Array.from({ length: count }, (_, i) => getMaterialImage(category, seedNum + i * 137))
}
