import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const search = searchParams.get('search')
  const type = searchParams.get('type')
  const verified = searchParams.get('verified')
  const state = searchParams.get('state')

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (type) where.businessType = type
  if (verified) where.verificationStatus = 'VERIFIED'
  if (state) where.state = state

  const companies = await prisma.company.findMany({
    where,
    orderBy: { rating: 'desc' },
    take: 50,
  })

  return Response.json({ companies })
}
