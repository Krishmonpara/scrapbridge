import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'inquiry-post', { limit: 10, windowMs: 60000 })
  if (limited) return limited

  try {
    const body = await request.json()
    const { listingId, toCompanyId, contactName, contactEmail, contactPhone, message } = body

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { companyId: true },
    })

    if (!listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404 })
    }

    // For now create a placeholder inquiry without auth
    const inquiry = await prisma.inquiry.create({
      data: {
        listingId,
        fromCompanyId: toCompanyId, // placeholder — replace with actual auth
        toCompanyId: listing.companyId,
        message,
        contactName,
        contactEmail,
        contactPhone,
      },
    })

    await prisma.listing.update({
      where: { id: listingId },
      data: { inquiryCount: { increment: 1 } },
    })

    return Response.json(inquiry, { status: 201 })
  } catch (err) {
    return Response.json({ error: 'Failed to send inquiry' }, { status: 400 })
  }
}
