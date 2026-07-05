import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

// GET /api/reviews?companyId=... → reviews received by a company
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('companyId')
  if (!companyId) return Response.json({ error: 'companyId required' }, { status: 400 })

  try {
    const reviews = await prisma.review.findMany({
      where: { toCompanyId: companyId },
      include: { fromCompany: { select: { name: true, slug: true, verificationStatus: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return Response.json({ reviews })
  } catch {
    return Response.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST /api/reviews { fromCompanyId, toCompanyId, rating, comment?, transactionType? }
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'reviews-post', { limit: 5, windowMs: 300_000 })
  if (limited) return limited

  try {
    const { fromCompanyId, toCompanyId, rating, comment, transactionType } = await request.json()

    if (!fromCompanyId || !toCompanyId) {
      return Response.json({ error: 'fromCompanyId and toCompanyId are required' }, { status: 400 })
    }
    if (fromCompanyId === toCompanyId) {
      return Response.json({ error: 'A company cannot review itself' }, { status: 400 })
    }
    const stars = Number(rating)
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return Response.json({ error: 'rating must be an integer 1-5' }, { status: 400 })
    }

    // one review per reviewer→reviewee pair keeps the average honest
    const existing = await prisma.review.findFirst({ where: { fromCompanyId, toCompanyId } })
    if (existing) {
      return Response.json({ error: 'You have already reviewed this company' }, { status: 409 })
    }

    const review = await prisma.review.create({
      data: {
        fromCompanyId,
        toCompanyId,
        rating: stars,
        comment: comment?.trim() || undefined,
        transactionType: transactionType?.trim() || undefined,
      },
    })

    // recompute the denormalized aggregate on Company
    const agg = await prisma.review.aggregate({
      where: { toCompanyId },
      _avg: { rating: true },
      _count: { id: true },
    })
    await prisma.company.update({
      where: { id: toCompanyId },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count.id,
      },
    })

    return Response.json(review, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
