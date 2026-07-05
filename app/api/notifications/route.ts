import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface NotificationItem {
  id: string
  type: 'message' | 'match' | 'inquiry'
  title: string
  detail: string
  href: string
  createdAt: string
}

// GET /api/notifications?companyId=... → badge counts + recent items,
// aggregated live from messages, match alerts, and inquiries (no extra table).
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('companyId')
  if (!companyId) return Response.json({ error: 'companyId required' }, { status: 400 })

  try {
    const [unreadMessages, rfqIds, pendingInquiries] = await Promise.all([
      prisma.message.findMany({
        where: {
          inquiry: { OR: [{ fromCompanyId: companyId }, { toCompanyId: companyId }] },
          senderCompanyId: { not: companyId },
          readAt: null,
        },
        include: {
          inquiry: {
            include: {
              listing: { select: { title: true } },
              fromCompany: { select: { id: true, name: true } },
              toCompany: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.rFQ.findMany({ where: { companyId }, select: { id: true } }),
      prisma.inquiry.findMany({
        where: { toCompanyId: companyId, status: 'PENDING' },
        include: {
          listing: { select: { title: true } },
          fromCompany: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    const newMatches = await prisma.matchAlert.findMany({
      where: { rfqId: { in: rfqIds.map((r) => r.id) }, status: 'NEW' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    const matchListings = await prisma.listing.findMany({
      where: { id: { in: newMatches.map((m) => m.listingId) } },
      select: { id: true, title: true },
    })
    const listingMap = new Map(matchListings.map((l) => [l.id, l.title]))

    const items: NotificationItem[] = [
      ...unreadMessages.map((m) => {
        const other =
          m.inquiry.fromCompany.id === companyId ? m.inquiry.toCompany : m.inquiry.fromCompany
        return {
          id: `msg-${m.id}`,
          type: 'message' as const,
          title: `New message from ${other.name}`,
          detail: m.body.slice(0, 80),
          href: '/messages',
          createdAt: m.createdAt.toISOString(),
        }
      }),
      ...newMatches.map((m) => ({
        id: `match-${m.id}`,
        type: 'match' as const,
        title: `RFQ match · score ${Math.round(m.score)}`,
        detail: listingMap.get(m.listingId) ?? 'Listing',
        href: '/matches',
        createdAt: m.createdAt.toISOString(),
      })),
      ...pendingInquiries.map((i) => ({
        id: `inq-${i.id}`,
        type: 'inquiry' as const,
        title: `Inquiry from ${i.fromCompany.name}`,
        detail: i.listing?.title ?? '',
        href: '/inquiries',
        createdAt: i.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 12)

    return Response.json({
      counts: {
        messages: unreadMessages.length,
        matches: newMatches.length,
        inquiries: pendingInquiries.length,
        total: unreadMessages.length + newMatches.length + pendingInquiries.length,
      },
      items,
    })
  } catch {
    return Response.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
