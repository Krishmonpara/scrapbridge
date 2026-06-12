import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const category = searchParams.get('category')

  const where: any = { status: 'OPEN' }
  if (category) where.materialCategory = category

  const rfqs = await prisma.rFQ.findMany({
    where,
    include: { company: { select: { name: true, verificationStatus: true, city: true, state: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return Response.json({ rfqs })
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'rfq-post', { limit: 5, windowMs: 60000 })
  if (limited) return limited

  try {
    const body = await request.json()
    const rfq = await prisma.rFQ.create({ data: body })
    return Response.json(rfq, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create RFQ' }, { status: 400 })
  }
}
