import { NextRequest } from 'next/server'
import { ingestLatestPrices } from '@/lib/market/feed'

// Daily price pull. Wired to Vercel Cron via vercel.json; the free provider
// tier is ~50 requests/month, so this must stay once-daily.
export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Vercel sets `Authorization: Bearer <CRON_SECRET>` on cron invocations.
 * Without the check this endpoint would let anyone burn the month's API quota,
 * so an unset secret fails closed rather than open.
 */
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await ingestLatestPrices()

  // A missing API key or provider hiccup is reported, not thrown: the app
  // keeps serving its existing series either way.
  return Response.json(result, { status: result.ok ? 200 : 503 })
}
