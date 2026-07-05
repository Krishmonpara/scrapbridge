import Link from 'next/link'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'
import { Badge } from '@/components/ui/Badge'
import { MaterialIcon } from '@/components/shared/MaterialIcon'
import { prisma } from '@/lib/prisma'
import { CATEGORY_LABELS, type MaterialCategory } from '@/types'
import { getPriceSignal } from '@/lib/agents/price-intelligence'
import { formatNumber } from '@/lib/utils'
import { BarChart3, TrendingUp, Package, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Market Intelligence — ScrapBridge',
  description: 'Live scrap material market data: supply by category, average asking prices, and reference spot ranges.',
}

interface CategoryStat {
  category: MaterialCategory
  label: string
  activeListings: number
  newLast30d: number
  avgAskPrice: number | null
  totalQuantity: number | null
  refLow: number | null
  refHigh: number | null
}

async function getMarketData(): Promise<CategoryStat[]> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    const [grouped, recent] = await Promise.all([
      prisma.listing.groupBy({
        by: ['materialCategory'],
        where: { status: 'ACTIVE', listingType: 'SELL' },
        _count: { id: true },
        _avg: { pricePerUnit: true },
        _sum: { quantity: true },
      }),
      prisma.listing.groupBy({
        by: ['materialCategory'],
        where: { status: 'ACTIVE', listingType: 'SELL', createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
      }),
    ])
    const recentMap = Object.fromEntries(recent.map((r) => [r.materialCategory, r._count.id]))

    return grouped
      .map((g) => {
        const cat = g.materialCategory as MaterialCategory
        const ref = getPriceSignal({ materialCategory: cat, pricePerUnit: null, unit: 'TONS', currency: 'USD' })
        return {
          category: cat,
          label: CATEGORY_LABELS[cat],
          activeListings: g._count.id,
          newLast30d: recentMap[cat] ?? 0,
          avgAskPrice: g._avg.pricePerUnit,
          totalQuantity: g._sum.quantity,
          refLow: ref.referenceLow,
          refHigh: ref.referenceHigh,
        }
      })
      .sort((a, b) => b.activeListings - a.activeListings)
  } catch {
    return []
  }
}

export default async function MarketPage() {
  const stats = await getMarketData()
  const totalActive = stats.reduce((s, c) => s + c.activeListings, 0)
  const totalNew = stats.reduce((s, c) => s + c.newLast30d, 0)

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-screen-xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={20} className="text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Market Intelligence</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-2xl">
            Live supply and pricing across every material category on ScrapBridge, benchmarked against
            reference spot ranges. Data also available via{' '}
            <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>
              GET /api/public/prices
            </code>
          </p>

          {/* Summary strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Active Listings', value: formatNumber(totalActive), icon: Package },
              { label: 'New in 30 Days', value: formatNumber(totalNew), icon: Clock },
              { label: 'Tracked Categories', value: stats.length, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded p-4 flex items-center gap-3"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <Icon size={18} className="text-[var(--text-tertiary)]" />
                <div>
                  <p className="text-lg font-bold text-[var(--text-primary)] leading-tight">{value}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {stats.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No market data available — database offline.</p>
          ) : (
            <div className="rounded overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm" style={{ minWidth: 720 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    {['Category', 'Supply', 'New (30d)', 'Momentum', 'Avg Ask', 'Reference Range (USD/t)', ''].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, i) => (
                    <tr
                      key={s.category}
                      className="hover:bg-[var(--bg-tertiary)] transition-colors"
                      style={{
                        background: 'var(--bg-primary)',
                        borderBottom: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[var(--text-tertiary)]">
                            <MaterialIcon category={s.category} size={16} />
                          </span>
                          <span className="font-medium text-[var(--text-primary)]">{s.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--text-primary)]">{s.activeListings}</span>
                          <div className="h-1.5 rounded-full w-20 overflow-hidden hidden md:block" style={{ background: 'var(--bg-tertiary)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min((s.activeListings / Math.max(stats[0].activeListings, 1)) * 100, 100)}%`,
                                background: 'var(--foreground)',
                                opacity: 0.5,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {s.newLast30d > 0 ? (
                          <Badge variant="success">+{s.newLast30d}</Badge>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          // momentum = share of supply listed in the last 30 days
                          const pct = s.activeListings > 0 ? Math.round((s.newLast30d / s.activeListings) * 100) : 0
                          const hot = pct >= 25
                          return (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-14 overflow-hidden hidden md:block" style={{ background: 'var(--bg-tertiary)' }}>
                                <div
                                  className="h-full"
                                  style={{
                                    width: `${Math.min(pct, 100)}%`,
                                    background: hot ? 'var(--up)' : 'var(--neutral)',
                                    boxShadow: hot ? `0 0 8px var(--up-glow)` : 'none',
                                  }}
                                />
                              </div>
                              <span
                                className="text-xs tabular-nums"
                                style={{ color: hot ? 'var(--up)' : 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}
                              >
                                {pct}%
                              </span>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {s.avgAskPrice ? `$${formatNumber(Math.round(s.avgAskPrice * 100) / 100)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {s.refLow !== null ? `$${formatNumber(s.refLow)} – $${formatNumber(s.refHigh!)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/browse?category=${s.category}`}
                          className="text-xs text-[var(--accent)] hover:underline whitespace-nowrap"
                        >
                          Browse →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-[var(--text-tertiary)] mt-4">
            Reference ranges are a static snapshot modeled on LME / ISRI composites — not live quotes.
            Marketplace aggregates update in real time as listings change.
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}
