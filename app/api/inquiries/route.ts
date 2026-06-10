import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const companyId = searchParams.get('companyId')
  const direction = searchParams.get('direction') ?? 'received' // 'received' | 'sent'

  if (!companyId) {
    return Response.json({ error: 'companyId required' }, { status: 400 })
  }

  try {
    const inquiries = await prisma.inquiry.findMany({
      where: direction === 'sent'
        ? { fromCompanyId: companyId }
        : { toCompanyId: companyId },
      include: {
        listing: { select: { id: true, title: true } },
        fromCompany: { select: { name: true, slug: true } },
        toCompany: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json({ inquiries })
  } catch {
    return Response.json({ error: 'Failed to fetch inquiries' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json()
    const updated = await prisma.inquiry.update({
      where: { id },
      data: { status },
    })
    return Response.json(updated)
  } catch {
    return Response.json({ error: 'Failed to update inquiry' }, { status: 500 })
  }
}
