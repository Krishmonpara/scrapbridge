import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

async function requireCompany() {
  const session = await auth()
  const companyId = (session?.user as { companyId?: string } | undefined)?.companyId
  if (!session?.user) return { error: Response.json({ error: 'Sign in required' }, { status: 401 }) }
  if (!companyId) return { error: Response.json({ error: 'No company on this account' }, { status: 403 }) }
  return { companyId }
}

const PatchInput = z.object({
  label: z.string().trim().max(120).nullable().optional(),
  quantity: z.number().positive().finite().optional(),
  unit: z.enum(['TONS', 'LBS', 'KG', 'PIECES', 'LOT']).optional(),
  costBasis: z.number().nonnegative().finite().nullable().optional(),
  status: z.enum(['HELD', 'LISTED', 'SOLD']).optional(),
  // the listing this lot became; set by the wizard once the listing exists
  listingId: z.string().trim().max(64).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
})

/**
 * Fetch one lot. Exists so the listing wizard can prefill from a lot id in the
 * URL without trusting the URL for the data itself — the company scope here is
 * what makes a guessed id useless.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireCompany()
  if ('error' in gate) return gate.error
  const { id } = await params

  try {
    const lot = await prisma.inventoryLot.findFirst({
      where: { id, companyId: gate.companyId },
      select: {
        id: true,
        symbol: true,
        label: true,
        quantity: true,
        unit: true,
        costBasis: true,
        status: true,
        listingId: true,
        notes: true,
      },
    })
    if (!lot) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(lot)
  } catch {
    return Response.json({ error: 'Could not load this lot' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request, 'inventory-patch', { limit: 60, windowMs: 60_000 })
  if (limited) return limited

  const gate = await requireCompany()
  if ('error' in gate) return gate.error
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = PatchInput.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid update' }, { status: 400 })
  }

  try {
    // Scoped update: the companyId in the WHERE clause is what stops one
    // dealer editing another's lot by guessing an id.
    const result = await prisma.inventoryLot.updateMany({
      where: { id, companyId: gate.companyId },
      data: parsed.data as never,
    })
    if (result.count === 0) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Could not update this lot' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request, 'inventory-delete', { limit: 30, windowMs: 60_000 })
  if (limited) return limited

  const gate = await requireCompany()
  if ('error' in gate) return gate.error
  const { id } = await params

  try {
    const result = await prisma.inventoryLot.deleteMany({
      where: { id, companyId: gate.companyId },
    })
    if (result.count === 0) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Could not delete this lot' }, { status: 500 })
  }
}
