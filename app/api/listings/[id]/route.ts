import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { scoreListing } from '@/lib/agents/quality-agent'

// GET /api/listings/:id
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { company: { select: { name: true, slug: true, verificationStatus: true } } },
    })
    if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 })
    return Response.json(listing)
  } catch {
    return Response.json({ error: 'Failed to fetch listing' }, { status: 500 })
  }
}

const EDITABLE_FIELDS = [
  'title', 'description', 'specs', 'grade', 'materialSubcategory',
  'quantity', 'unit', 'pricePerUnit', 'negotiable', 'minOrder',
  'city', 'state', 'location', 'pickupAvailable', 'deliveryAvailable',
  'status', 'expiresAt',
] as const

// PATCH /api/listings/:id — lifecycle transitions + field edits.
// status: ACTIVE (renew/relist), SOLD (mark sold), EXPIRED, DRAFT
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request, 'listings-patch', { limit: 30, windowMs: 60_000 })
  if (limited) return limited

  const { id } = await params
  try {
    const body = await request.json()

    const data: Record<string, unknown> = {}
    for (const key of EDITABLE_FIELDS) {
      if (key in body) data[key] = body[key]
    }
    if (Object.keys(data).length === 0) {
      return Response.json({ error: 'No editable fields provided' }, { status: 400 })
    }

    if ('status' in data && !['ACTIVE', 'SOLD', 'EXPIRED', 'DRAFT'].includes(data.status as string)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }
    // renewing a listing resets its expiry 30 days out
    if (data.status === 'ACTIVE' && !('expiresAt' in body)) {
      data.expiresAt = new Date(Date.now() + 30 * 86400000)
    }

    const existing = await prisma.listing.findUnique({ where: { id } })
    if (!existing) return Response.json({ error: 'Listing not found' }, { status: 404 })

    // re-score quality whenever content fields change
    const merged = { ...existing, ...data }
    const quality = scoreListing(merged as Parameters<typeof scoreListing>[0])

    const updated = await prisma.listing.update({
      where: { id },
      data: { ...data, qualityScore: quality.score },
    })
    return Response.json({ ...updated, quality })
  } catch {
    return Response.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

// DELETE /api/listings/:id — soft delete: keeps history, hides from marketplace
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request, 'listings-delete', { limit: 10, windowMs: 60_000 })
  if (limited) return limited

  const { id } = await params
  try {
    const existing = await prisma.listing.findUnique({ where: { id } })
    if (!existing) return Response.json({ error: 'Listing not found' }, { status: 404 })

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: 'EXPIRED' },
    })
    return Response.json({ id: updated.id, status: updated.status })
  } catch {
    return Response.json({ error: 'Failed to remove listing' }, { status: 500 })
  }
}
