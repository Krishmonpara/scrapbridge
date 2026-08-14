import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { getPosition } from '@/lib/position/queries'
import { SAMPLE_SYMBOLS } from '@/lib/market/sample-data'

export const dynamic = 'force-dynamic'

/**
 * Inventory is commercially sensitive — it exposes what a yard holds and what
 * they paid. Unlike the older listing routes, every handler here resolves the
 * company from the SESSION and never trusts a companyId in the request body.
 */
async function requireCompany() {
  const session = await auth()
  const companyId = (session?.user as { companyId?: string } | undefined)?.companyId
  if (!session?.user) return { error: Response.json({ error: 'Sign in required' }, { status: 401 }) }
  if (!companyId) {
    return { error: Response.json({ error: 'No company on this account' }, { status: 403 }) }
  }
  return { companyId }
}

const LotInput = z.object({
  symbol: z.enum(SAMPLE_SYMBOLS as [string, ...string[]]),
  label: z.string().trim().max(120).optional().nullable(),
  quantity: z.number().positive().finite(),
  unit: z.enum(['TONS', 'LBS', 'KG', 'PIECES', 'LOT']),
  costBasis: z.number().nonnegative().finite().optional().nullable(),
  acquiredAt: z.string().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
})

export async function GET() {
  const gate = await requireCompany()
  if ('error' in gate) return gate.error
  const position = await getPosition(gate.companyId)
  return Response.json(position)
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'inventory-post', { limit: 30, windowMs: 60_000 })
  if (limited) return limited

  const gate = await requireCompany()
  if ('error' in gate) return gate.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = LotInput.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid lot', issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) },
      { status: 400 }
    )
  }
  const d = parsed.data

  try {
    const lot = await prisma.inventoryLot.create({
      data: {
        // companyId comes from the session, never the payload
        companyId: gate.companyId,
        symbol: d.symbol as never,
        label: d.label ?? null,
        quantity: d.quantity,
        unit: d.unit as never,
        costBasis: d.costBasis ?? null,
        acquiredAt: d.acquiredAt ? new Date(d.acquiredAt) : new Date(),
        notes: d.notes ?? null,
      },
    })
    return Response.json({ id: lot.id }, { status: 201 })
  } catch {
    return Response.json({ error: 'Could not save this lot' }, { status: 500 })
  }
}
