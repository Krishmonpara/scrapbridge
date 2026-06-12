import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/messages?inquiryId=...        → full thread for one inquiry
// GET /api/messages?companyId=...        → all threads (inquiries) with last message + unread count
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const inquiryId = searchParams.get('inquiryId')
  const companyId = searchParams.get('companyId')

  try {
    if (inquiryId) {
      const messages = await prisma.message.findMany({
        where: { inquiryId },
        orderBy: { createdAt: 'asc' },
      })
      return Response.json({ messages })
    }

    if (companyId) {
      const inquiries = await prisma.inquiry.findMany({
        where: { OR: [{ fromCompanyId: companyId }, { toCompanyId: companyId }] },
        include: {
          listing: { select: { id: true, title: true, photos: true } },
          fromCompany: { select: { id: true, name: true, slug: true } },
          toCompany: { select: { id: true, name: true, slug: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      })

      const unreadCounts = await prisma.message.groupBy({
        by: ['inquiryId'],
        where: {
          inquiry: { OR: [{ fromCompanyId: companyId }, { toCompanyId: companyId }] },
          senderCompanyId: { not: companyId },
          readAt: null,
        },
        _count: { id: true },
      })
      const unreadMap = Object.fromEntries(unreadCounts.map((u) => [u.inquiryId, u._count.id]))

      const threads = inquiries.map((inq) => ({
        inquiry: inq,
        lastMessage: inq.messages[0] ?? null,
        unread: unreadMap[inq.id] ?? 0,
      }))
      return Response.json({ threads })
    }

    return Response.json({ error: 'inquiryId or companyId required' }, { status: 400 })
  } catch {
    return Response.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST /api/messages { inquiryId, senderCompanyId, body }
export async function POST(request: NextRequest) {
  try {
    const { inquiryId, senderCompanyId, body } = await request.json()

    if (!inquiryId || !senderCompanyId || !body?.trim()) {
      return Response.json({ error: 'inquiryId, senderCompanyId and body are required' }, { status: 400 })
    }

    const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } })
    if (!inquiry) {
      return Response.json({ error: 'Inquiry not found' }, { status: 404 })
    }
    if (senderCompanyId !== inquiry.fromCompanyId && senderCompanyId !== inquiry.toCompanyId) {
      return Response.json({ error: 'Sender is not part of this thread' }, { status: 403 })
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { inquiryId, senderCompanyId, body: body.trim() },
      }),
      prisma.inquiry.update({
        where: { id: inquiryId },
        data: { status: senderCompanyId === inquiry.toCompanyId ? 'RESPONDED' : inquiry.status },
      }),
    ])

    return Response.json(message, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

// PATCH /api/messages { inquiryId, readerCompanyId } → mark thread read
export async function PATCH(request: NextRequest) {
  try {
    const { inquiryId, readerCompanyId } = await request.json()
    if (!inquiryId || !readerCompanyId) {
      return Response.json({ error: 'inquiryId and readerCompanyId required' }, { status: 400 })
    }
    const result = await prisma.message.updateMany({
      where: { inquiryId, senderCompanyId: { not: readerCompanyId }, readAt: null },
      data: { readAt: new Date() },
    })
    return Response.json({ marked: result.count })
  } catch {
    return Response.json({ error: 'Failed to mark read' }, { status: 500 })
  }
}
