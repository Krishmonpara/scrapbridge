import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const search = searchParams.get('search')
  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const state = searchParams.get('state')
  const verified = searchParams.get('verified')
  const within = searchParams.get('within')
  const sort = searchParams.get('sort') ?? 'newest'
  const condition = searchParams.get('condition')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '24')

  const where: Prisma.ListingWhereInput = {
    status: 'ACTIVE',
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { grade: { contains: search, mode: 'insensitive' } },
      { materialSubcategory: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (category) where.materialCategory = category as any
  if (type) where.listingType = type as any
  if (state) where.state = state
  if (condition) where.condition = { in: condition.split(',') as any[] }

  if (verified) {
    where.company = { verificationStatus: 'VERIFIED' }
  }

  if (within && within !== 'all') {
    const cutoff = new Date()
    if (within === '24h') cutoff.setHours(cutoff.getHours() - 24)
    else if (within === '7d') cutoff.setDate(cutoff.getDate() - 7)
    else if (within === '30d') cutoff.setDate(cutoff.getDate() - 30)
    where.createdAt = { gte: cutoff }
  }

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    sort === 'price_asc' ? { pricePerUnit: 'asc' }
    : sort === 'price_desc' ? { pricePerUnit: 'desc' }
    : sort === 'most_inquiries' ? { inquiryCount: 'desc' }
    : sort === 'expiring_soon' ? { expiresAt: 'asc' }
    : { createdAt: 'desc' }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        company: { select: { name: true, verificationStatus: true, slug: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ])

  return Response.json({ listings, total, page, limit })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const listing = await prisma.listing.create({ data: body })
    return Response.json(listing, { status: 201 })
  } catch (err) {
    return Response.json({ error: 'Failed to create listing' }, { status: 400 })
  }
}
