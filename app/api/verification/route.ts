import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/verification?companyId=... → current verification status
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('companyId')
  if (!companyId) return Response.json({ error: 'companyId required' }, { status: 400 })

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, verificationStatus: true, ein: true, licenseNumber: true },
    })
    if (!company) return Response.json({ error: 'Company not found' }, { status: 404 })
    return Response.json(company)
  } catch {
    return Response.json({ error: 'Failed to fetch verification status' }, { status: 500 })
  }
}

// POST /api/verification { companyId, ein, licenseNumber }
// → stores documents and moves UNVERIFIED → PENDING for manual review
export async function POST(request: NextRequest) {
  try {
    const { companyId, ein, licenseNumber } = await request.json()

    if (!companyId || !ein?.trim()) {
      return Response.json({ error: 'companyId and ein are required' }, { status: 400 })
    }
    if (!/^\d{2}-?\d{7}$/.test(ein.trim())) {
      return Response.json({ error: 'EIN must be in XX-XXXXXXX format' }, { status: 400 })
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) return Response.json({ error: 'Company not found' }, { status: 404 })
    if (company.verificationStatus === 'VERIFIED') {
      return Response.json({ error: 'Company is already verified' }, { status: 409 })
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        ein: ein.trim(),
        licenseNumber: licenseNumber?.trim() || undefined,
        verificationStatus: 'PENDING',
      },
      select: { id: true, verificationStatus: true },
    })

    return Response.json(updated)
  } catch {
    return Response.json({ error: 'Failed to submit verification request' }, { status: 500 })
  }
}
