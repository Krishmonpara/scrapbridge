// Buyer-Seller Match Agent — scores open RFQs against active SELL listings
// and persists high-confidence matches as MatchAlert rows. Designed to run
// on demand (POST /api/agents/match) or nightly via cron.

import { prisma } from '@/lib/prisma'

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'has',
  'have', 'will', 'can', 'all', 'any', 'our', 'your', 'per', 'ton', 'tons',
  'lot', 'need', 'needed', 'looking', 'approx', 'approximately',
])

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s&-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  )
}

function keywordOverlap(a: string, b: string): number {
  const ta = tokenize(a)
  const tb = tokenize(b)
  if (ta.size === 0 || tb.size === 0) return 0
  let hits = 0
  for (const w of ta) if (tb.has(w)) hits++
  return hits / Math.min(ta.size, tb.size)
}

export interface MatchScore {
  score: number // 0-100
  reasons: string[]
}

interface RFQLike {
  materialCategory: string
  materialSubcategory?: string | null
  title: string
  description?: string | null
  quantityNeeded: number
  unit: string
  targetPrice?: number | null
  deliveryLocation?: string | null
}

interface ListingLike {
  materialCategory: string
  materialSubcategory?: string | null
  title: string
  description?: string | null
  grade?: string | null
  quantity: number
  unit: string
  pricePerUnit?: number | null
  negotiable: boolean
  city: string
  state: string
}

export function scoreMatch(rfq: RFQLike, listing: ListingLike): MatchScore {
  const reasons: string[] = []
  let score = 0

  // category is a hard gate — handled by the query, scored here for clarity
  if (rfq.materialCategory === listing.materialCategory) {
    score += 35
    reasons.push('Same material category')
  } else {
    return { score: 0, reasons: [] }
  }

  if (
    rfq.materialSubcategory &&
    listing.materialSubcategory &&
    rfq.materialSubcategory.toLowerCase() === listing.materialSubcategory.toLowerCase()
  ) {
    score += 10
    reasons.push('Subcategory matches exactly')
  }

  // quantity: listing can fulfill the RFQ (same unit only)
  if (rfq.unit === listing.unit) {
    if (listing.quantity >= rfq.quantityNeeded) {
      score += 20
      reasons.push(`Quantity covers requirement (${listing.quantity} ≥ ${rfq.quantityNeeded} ${rfq.unit})`)
    } else if (listing.quantity >= rfq.quantityNeeded * 0.5) {
      score += 10
      reasons.push('Partial quantity available (≥50% of requirement)')
    }
  }

  // price vs target
  if (rfq.targetPrice && listing.pricePerUnit) {
    if (listing.pricePerUnit <= rfq.targetPrice) {
      score += 15
      reasons.push('Asking price at or below target')
    } else if (listing.negotiable && listing.pricePerUnit <= rfq.targetPrice * 1.15) {
      score += 8
      reasons.push('Within 15% of target and negotiable')
    }
  }

  // keyword similarity between RFQ text and listing text
  const overlap = keywordOverlap(
    `${rfq.title} ${rfq.description ?? ''}`,
    `${listing.title} ${listing.grade ?? ''} ${listing.description ?? ''}`
  )
  const kwPoints = Math.round(overlap * 15)
  if (kwPoints > 0) {
    score += kwPoints
    reasons.push(`Description similarity ${Math.round(overlap * 100)}%`)
  }

  // location hint
  if (rfq.deliveryLocation) {
    const loc = rfq.deliveryLocation.toLowerCase()
    if (loc.includes(listing.city.toLowerCase()) || loc.includes(listing.state.toLowerCase())) {
      score += 5
      reasons.push('Near delivery location')
    }
  }

  return { score: Math.min(score, 100), reasons }
}

export const MATCH_THRESHOLD = 55

export async function runMatchAgent() {
  const [rfqs, listings] = await Promise.all([
    prisma.rFQ.findMany({ where: { status: 'OPEN' } }),
    prisma.listing.findMany({ where: { status: 'ACTIVE', listingType: 'SELL' } }),
  ])

  let created = 0
  let evaluated = 0

  for (const rfq of rfqs) {
    const candidates = listings.filter((l) => l.materialCategory === rfq.materialCategory)
    for (const listing of candidates) {
      evaluated++
      const { score, reasons } = scoreMatch(rfq, listing)
      if (score < MATCH_THRESHOLD) continue

      await prisma.matchAlert.upsert({
        where: { rfqId_listingId: { rfqId: rfq.id, listingId: listing.id } },
        create: { rfqId: rfq.id, listingId: listing.id, score, reasons },
        update: { score, reasons },
      })
      created++
    }
  }

  return { rfqs: rfqs.length, listings: listings.length, evaluated, matches: created }
}
