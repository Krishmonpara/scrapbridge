import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CATEGORY_LABELS, type MaterialCategory } from '@/types'
import { getPriceSignal } from '@/lib/agents/price-intelligence'

export const revalidate = 3600

// GET /widget/price/[category] → self-contained iframe-able HTML price card.
// Embed: <iframe src="https://scrapbridge.example/widget/price/FERROUS_METALS"
//         width="320" height="180" frameborder="0"></iframe>
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params
  const cat = category.toUpperCase() as MaterialCategory
  const label = CATEGORY_LABELS[cat]

  if (!label) {
    return new Response('Unknown category', { status: 404 })
  }

  let activeListings = 0
  let avgAsk: number | null = null
  try {
    const agg = await prisma.listing.aggregate({
      where: { status: 'ACTIVE', listingType: 'SELL', materialCategory: cat },
      _count: { id: true },
      _avg: { pricePerUnit: true },
    })
    activeListings = agg._count.id
    avgAsk = agg._avg.pricePerUnit
  } catch {
    // DB offline — render reference range only
  }

  const ref = getPriceSignal({ materialCategory: cat, pricePerUnit: null, unit: 'TONS', currency: 'USD' })
  const range =
    ref.referenceLow !== null
      ? `$${ref.referenceLow.toLocaleString()} – $${ref.referenceHigh!.toLocaleString()}`
      : '—'

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root{color-scheme:dark}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#fafafa}
  .card{padding:16px 18px;border:1px solid #262626;border-radius:8px;margin:8px;background:#111}
  .label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#737373;margin:0 0 4px}
  .title{font-size:15px;font-weight:600;margin:0 0 12px}
  .row{display:flex;justify-content:space-between;font-size:13px;padding:3px 0;color:#a3a3a3}
  .row b{color:#fafafa;font-weight:600}
  .foot{margin-top:10px;font-size:10px;color:#525252}
  .foot a{color:#737373;text-decoration:none}
</style></head>
<body>
  <div class="card">
    <p class="label">ScrapBridge Market Data</p>
    <p class="title">${label}</p>
    <div class="row"><span>Reference range (USD/t)</span><b>${range}</b></div>
    <div class="row"><span>Active listings</span><b>${activeListings}</b></div>
    <div class="row"><span>Avg asking price</span><b>${avgAsk ? '$' + (Math.round(avgAsk * 100) / 100).toLocaleString() : '—'}</b></div>
    <p class="foot">Updated hourly · <a href="/market" target="_blank" rel="noopener">scrapbridge — market intelligence</a></p>
  </div>
</body></html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // allow embedding anywhere — that's the point of the widget
      'Content-Security-Policy': 'frame-ancestors *',
    },
  })
}
