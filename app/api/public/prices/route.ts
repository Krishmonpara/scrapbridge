import { prisma } from '@/lib/prisma'
import { CATEGORY_LABELS, type MaterialCategory } from '@/types'
import { getPriceSignal } from '@/lib/agents/price-intelligence'

export const revalidate = 3600 // public data, cache for an hour

// GET /api/public/prices → market snapshot per category:
// reference spot range + live marketplace aggregates (supply, avg ask, velocity)
export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)

    const [grouped, recent] = await Promise.all([
      prisma.listing.groupBy({
        by: ['materialCategory'],
        where: { status: 'ACTIVE', listingType: 'SELL' },
        _count: { id: true },
        _avg: { pricePerUnit: true },
        _sum: { quantity: true },
      }),
      prisma.listing.groupBy({
        by: ['materialCategory'],
        where: { status: 'ACTIVE', listingType: 'SELL', createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
      }),
    ])

    const recentMap = Object.fromEntries(recent.map((r) => [r.materialCategory, r._count.id]))

    const categories = grouped.map((g) => {
      const cat = g.materialCategory as MaterialCategory
      // reference range from the price intelligence layer (USD per metric ton)
      const ref = getPriceSignal({ materialCategory: cat, pricePerUnit: null, unit: 'TONS', currency: 'USD' })
      return {
        category: cat,
        label: CATEGORY_LABELS[cat],
        activeListings: g._count.id,
        newLast30d: recentMap[cat] ?? 0,
        avgAskPrice: g._avg.pricePerUnit ? Math.round(g._avg.pricePerUnit * 100) / 100 : null,
        totalQuantityListed: g._sum.quantity,
        referenceRangeUsdPerTon:
          ref.referenceLow !== null ? { low: ref.referenceLow, high: ref.referenceHigh } : null,
      }
    })

    return Response.json({
      asOf: new Date().toISOString(),
      source: 'ScrapBridge marketplace aggregates + static spot reference',
      categories: categories.sort((a, b) => b.activeListings - a.activeListings),
    })
  } catch {
    return Response.json({ error: 'Failed to build market snapshot' }, { status: 500 })
  }
}
