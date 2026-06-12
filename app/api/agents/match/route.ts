import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runMatchAgent } from '@/lib/agents/match-agent'

// POST /api/agents/match → run the matcher across all open RFQs
export async function POST() {
  try {
    const result = await runMatchAgent()
    return Response.json(result)
  } catch {
    return Response.json({ error: 'Match agent failed' }, { status: 500 })
  }
}

// GET /api/agents/match?companyId=... → match alerts for a company's RFQs
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('companyId')
  if (!companyId) {
    return Response.json({ error: 'companyId required' }, { status: 400 })
  }

  try {
    const rfqs = await prisma.rFQ.findMany({
      where: { companyId },
      select: { id: true },
    })
    const alerts = await prisma.matchAlert.findMany({
      where: { rfqId: { in: rfqs.map((r) => r.id) }, status: { not: 'DISMISSED' } },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    })

    // hydrate listings + rfqs in two queries instead of N
    const [listings, fullRfqs] = await Promise.all([
      prisma.listing.findMany({
        where: { id: { in: alerts.map((a) => a.listingId) } },
        include: { company: { select: { name: true, slug: true, verificationStatus: true } } },
      }),
      prisma.rFQ.findMany({ where: { id: { in: alerts.map((a) => a.rfqId) } } }),
    ])
    const listingMap = new Map(listings.map((l) => [l.id, l]))
    const rfqMap = new Map(fullRfqs.map((r) => [r.id, r]))

    return Response.json({
      alerts: alerts.map((a) => ({
        ...a,
        listing: listingMap.get(a.listingId) ?? null,
        rfq: rfqMap.get(a.rfqId) ?? null,
      })),
    })
  } catch {
    return Response.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}

// PATCH /api/agents/match { id, status } → mark SEEN / DISMISSED / CONTACTED
export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json()
    const updated = await prisma.matchAlert.update({ where: { id }, data: { status } })
    return Response.json(updated)
  } catch {
    return Response.json({ error: 'Failed to update match' }, { status: 500 })
  }
}
