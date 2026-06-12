import { prisma } from '@/lib/prisma'
import { scoreListing } from '@/lib/agents/quality-agent'

// POST /api/agents/quality → backfill qualityScore for all listings
export async function POST() {
  try {
    const listings = await prisma.listing.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        specs: true,
        grade: true,
        materialSubcategory: true,
        pricePerUnit: true,
        minOrder: true,
        photos: true,
        location: true,
        expiresAt: true,
        qualityScore: true,
      },
    })

    let updated = 0
    const distribution: Record<string, number> = { EXCELLENT: 0, GOOD: 0, FAIR: 0, POOR: 0 }

    for (const l of listings) {
      const { score, grade } = scoreListing(l)
      distribution[grade]++
      if (score !== l.qualityScore) {
        await prisma.listing.update({ where: { id: l.id }, data: { qualityScore: score } })
        updated++
      }
    }

    return Response.json({ scanned: listings.length, updated, distribution })
  } catch {
    return Response.json({ error: 'Backfill failed' }, { status: 500 })
  }
}
