import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''

  if (!q || q.length < 2) {
    return Response.json({ listings: [], companies: [] })
  }

  const [listings, companies] = await Promise.all([
    prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { materialSubcategory: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, materialCategory: true, city: true, state: true },
      take: 5,
    }),
    prisma.company.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
      },
      select: { id: true, name: true, slug: true, city: true, state: true },
      take: 5,
    }),
  ])

  return Response.json({ listings, companies })
}
