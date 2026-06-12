// Sliding-window rate limiter. In-memory by default (fine for a single
// dev/small instance); the interface matches what an Upstash-backed
// implementation needs, so swapping storage later doesn't touch callers.
//
// Usage in a route handler:
//   const limited = rateLimit(request, 'listings-post', { limit: 10, windowMs: 60_000 })
//   if (limited) return limited

import { NextRequest } from 'next/server'

interface Bucket {
  timestamps: number[]
}

const buckets = new Map<string, Bucket>()

// periodic sweep so abandoned keys don't leak memory
let lastSweep = Date.now()
function sweep(windowMs: number) {
  const now = Date.now()
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs)
    if (bucket.timestamps.length === 0) buckets.delete(key)
  }
}

export interface RateLimitOptions {
  /** max requests allowed per window */
  limit: number
  /** window size in milliseconds */
  windowMs: number
}

function clientKey(request: NextRequest): string {
  // behind a proxy the real client is in x-forwarded-for; fall back to a
  // stable constant locally (everyone shares one bucket in dev)
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'local'
  )
}

/**
 * Returns a 429 Response when the caller is over the limit, null otherwise.
 */
export function rateLimit(
  request: NextRequest,
  routeKey: string,
  { limit, windowMs }: RateLimitOptions
): Response | null {
  sweep(windowMs)

  const key = `${routeKey}:${clientKey(request)}`
  const now = Date.now()
  const bucket = buckets.get(key) ?? { timestamps: [] }

  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs)

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0]
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
    return Response.json(
      { error: 'Too many requests — slow down.', retryAfterSeconds: retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }

  bucket.timestamps.push(now)
  buckets.set(key, bucket)
  return null
}
