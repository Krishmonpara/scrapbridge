import Link from 'next/link'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'
import { Badge } from '@/components/ui/Badge'
import { MaterialIcon } from '@/components/shared/MaterialIcon'
import { PriceChart } from '@/components/market/PriceChart'
import { ForecastChart } from '@/components/market/ForecastChart'
import { GradeLadder } from '@/components/market/GradeLadder'
import { RegionDispersion } from '@/components/market/RegionDispersion'
import { EventTimeline } from '@/components/market/EventTimeline'
import { prisma } from '@/lib/prisma'
import { CATEGORY_LABELS, type MaterialCategory } from '@/types'
import { getPriceSignal } from '@/lib/agents/price-intelligence'
import { getGrades, getRegions, getSeries } from '@/lib/market/queries'
import { backtest, forecastSeries } from '@/lib/market/forecast'
import { formatQuote } from '@/lib/market/types'
import { formatNumber } from '@/lib/utils'
import { BarChart3, TrendingUp, Package, Clock } from 'lucide-react'

// Cache Components is not enabled for this project, so the previous caching
// model applies and `dynamic` is still a supported segment config.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Market Intelligence — ScrapBridge',
  description:
    'Scrap and benchmark metal prices, the events that moved them, regional dispersion, and marketplace supply.',
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

/**
 * An unreachable Postgres blocks until the driver's connect timeout rather
 * than failing fast, which would hold the whole page hostage. Bound it and
 * render the empty state instead.
 */
function withTimeout<T>(p: Promise<T>, ms = 1500): Promise<T | null> {
  return Promise.race([
    p.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

async function getMarketData(): Promise<CategoryStat[]> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    const result = await withTimeout(
      Promise.all([
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
    )
    if (!result) return []
    const [grouped, recent] = result
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

function SectionHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2
        className="text-[13px] uppercase tracking-[0.16em] font-semibold"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
      >
        <span style={{ color: 'var(--accent)' }}>/ </span>
        {title}
      </h2>
      {children && (
        <p className="mt-1 max-w-[70ch] text-sm" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </p>
      )}
    </div>
  )
}

const card = { background: 'var(--bg-secondary)', border: '1px solid var(--border)' }

export default async function MarketPage() {
  const [stats, copper, grades, regions] = await Promise.all([
    getMarketData(),
    getSeries('CU_COMEX'),
    getGrades(),
    getRegions(),
  ])

  const totalActive = stats.reduce((s, c) => s + c.activeListings, 0)
  const totalNew = stats.reduce((s, c) => s + c.newLast30d, 0)

  const ticks = copper?.ticks ?? []
  const first = ticks[0]?.close ?? 0
  const last = ticks.at(-1)?.close ?? 0
  const changeAbs = last - first
  const changePct = first ? (changeAbs / first) * 100 : 0
  const high = ticks.length ? Math.max(...ticks.map((t) => t.close)) : 0
  const low = ticks.length ? Math.min(...ticks.map((t) => t.close)) : 0

  const projection = ticks.length ? forecastSeries(ticks, 30) : null
  const bt = ticks.length ? backtest(ticks, 30) : null
  const isSample = copper?.source === 'SAMPLE'

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {isSample && (
          <div
            className="px-6 py-2 text-center text-[11px] uppercase tracking-[0.1em]"
            style={{ background: 'var(--copper)', color: '#0a0a0a', fontFamily: 'var(--font-mono)' }}
          >
            Sample price series — not a live market feed
          </div>
        )}

        <div className="max-w-screen-xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={20} className="text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Market Intelligence</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-10 max-w-2xl">
            Benchmark and scrap-grade prices, the events that moved them, and what is actually flowing
            through the marketplace. Marketplace aggregates are live; price series are sample data until
            a feed is connected.
          </p>

          {/* ---------- Why it moved ---------- */}
          {copper && ticks.length > 1 && (
            <section className="mb-12">
              <SectionHead title={`Why it moved — ${copper.label}`}>
                What the price did over the last {ticks.length} sessions, and the dated events behind
                each move.
              </SectionHead>

              <div style={card}>
                <div className="flex flex-wrap items-end gap-7 border-b p-6" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <div
                      className="text-[11px] uppercase tracking-[0.14em]"
                      style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
                    >
                      {copper.label} · {ticks.length} sessions
                    </div>
                    <div
                      className="text-[42px] font-bold leading-none tracking-tight"
                      style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                    >
                      {formatQuote(last, copper.unit)}
                    </div>
                    <div
                      className="mt-1.5 text-[16px] font-semibold tabular-nums"
                      style={{
                        color: changeAbs >= 0 ? 'var(--up)' : 'var(--down)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {changeAbs >= 0 ? '▲ +' : '▼ −'}
                      {Math.abs(changeAbs).toFixed(2)} &nbsp;{changeAbs >= 0 ? '+' : '−'}
                      {Math.abs(changePct).toFixed(2)}%
                    </div>
                  </div>
                  <div className="ml-auto flex flex-wrap gap-7">
                    {[
                      ['Period high', formatQuote(high, copper.unit)],
                      ['Period low', formatQuote(low, copper.unit)],
                      [
                        'Annualised vol',
                        projection ? `${(projection.sigmaAnnual * 100).toFixed(0)}%` : '—',
                      ],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div
                          className="text-[11px] uppercase tracking-[0.14em]"
                          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
                        >
                          {l}
                        </div>
                        <div
                          className="mt-0.5 text-[16px] font-semibold tabular-nums"
                          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                        >
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <PriceChart
                  ticks={ticks}
                  events={copper.events}
                  unit={copper.unit}
                  label={`${copper.label} over ${ticks.length} sessions, from ${formatQuote(first, copper.unit)} to ${formatQuote(last, copper.unit)}, with ${copper.events.length} annotated events. Use arrow keys to step through days.`}
                />
              </div>

              {copper.events.length > 0 && (
                <div className="mt-4" style={card}>
                  <EventTimeline events={copper.events} />
                </div>
              )}
            </section>
          )}

          {/* ---------- Scrap grade ladder ---------- */}
          {grades.length > 0 && (
            <section className="mb-12">
              <SectionHead title="Grade ladder">
                What each grade fetches today. Non-ferrous carries its basis to the copper benchmark —
                the discount that decides whether a load is worth buying.
              </SectionHead>
              <div style={{ border: '1px solid var(--border)' }}>
                <GradeLadder rows={grades} />
              </div>
            </section>
          )}

          {/* ---------- Regional dispersion ---------- */}
          {regions.length > 0 && (
            <section className="mb-12">
              <SectionHead title="Regional dispersion">
                The same grade clears at different numbers by region. Freight has to beat the spread
                before shipping out of your own market makes sense.
              </SectionHead>
              <div style={card}>
                <RegionDispersion rows={regions} />
              </div>
            </section>
          )}

          {/* ---------- Projection ---------- */}
          {projection && copper && (
            <section className="mb-12">
              <SectionHead title="Forward projection">
                A 30-session projection with its uncertainty band. This is a{' '}
                <b style={{ color: 'var(--text-primary)' }}>random walk with drift</b> — the naive
                baseline, not a trained model. It is shown because nothing more complex ships until it
                beats this.
              </SectionHead>

              <div style={card}>
                <ForecastChart history={ticks} forecast={projection} unit={copper.unit} />
                <div className="px-5 pb-4">
                  <span
                    className="text-[11px] uppercase tracking-[0.14em]"
                    style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
                  >
                    Shaded = 80% and 50% intervals · dashed = median path · method {projection.method}
                  </span>
                </div>
              </div>

              {bt && (
                <div className="mt-4 grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: 'var(--border)', border: '1px solid var(--border)' }}>
                  {[
                    {
                      l: 'MAPE, 30d',
                      v: `${bt.mape.toFixed(1)}%`,
                      n: `Walk-forward over ${bt.samples} windows.`,
                      tone: 'plain' as const,
                    },
                    {
                      l: 'vs. no-change',
                      v: `${bt.improvementPct >= 0 ? '▲ +' : '▼ −'}${Math.abs(bt.improvementPct).toFixed(0)}%`,
                      n:
                        bt.improvementPct >= 0
                          ? 'Error reduction over assuming no change.'
                          : 'Worse than assuming no change — treat the median as decoration.',
                      tone: bt.improvementPct >= 0 ? ('up' as const) : ('down' as const),
                    },
                    {
                      l: 'Direction',
                      v: `${bt.directionAccuracy.toFixed(0)}%`,
                      n: 'Up/down called correctly at 30 sessions.',
                      tone: 'plain' as const,
                    },
                    {
                      l: 'Baseline MAPE',
                      v: `${bt.mapeNaive.toFixed(1)}%`,
                      n: 'What no-change would have scored.',
                      tone: 'plain' as const,
                    },
                  ].map((m) => (
                    <div key={m.l} className="p-4" style={{ background: 'var(--bg-secondary)' }}>
                      <div
                        className="text-[11px] uppercase tracking-[0.14em]"
                        style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
                      >
                        {m.l}
                      </div>
                      <div
                        className="my-1 text-[24px] font-bold leading-tight tabular-nums"
                        style={{
                          color:
                            m.tone === 'up' ? 'var(--up)' : m.tone === 'down' ? 'var(--down)' : 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {m.v}
                      </div>
                      <div className="text-[12px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                        {m.n}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                A projection of where the price could sit, not advice on whether to buy or sell.
              </p>
            </section>
          )}

          {/* ---------- Marketplace supply (real data) ---------- */}
          <section>
            <SectionHead title="Marketplace supply">
              Live aggregates from active ScrapBridge listings — the one dataset here that is entirely
              our own. Available via{' '}
              <code className="px-1.5 py-0.5 text-xs" style={{ background: 'var(--bg-tertiary)' }}>
                GET /api/public/prices
              </code>
            </SectionHead>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Active Listings', value: formatNumber(totalActive), icon: Package },
                { label: 'New in 30 Days', value: formatNumber(totalNew), icon: Clock },
                { label: 'Tracked Categories', value: stats.length, icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-4 flex items-center gap-3" style={card}>
                  <Icon size={18} className="text-[var(--text-tertiary)]" />
                  <div>
                    <p className="text-lg font-bold text-[var(--text-primary)] leading-tight">{value}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {stats.length === 0 ? (
              <div className="p-6 text-sm" style={{ ...card, color: 'var(--text-tertiary)' }}>
                No marketplace supply to show yet — the listings database is unavailable or empty.
                Price series above are unaffected.
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
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
                            <div className="h-1.5 w-20 overflow-hidden hidden md:block" style={{ background: 'var(--bg-tertiary)' }}>
                              <div
                                className="h-full"
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
              Reference ranges are a static snapshot modeled on LME / ISRI composites — not live quotes
              (Flag #3). Marketplace aggregates update in real time as listings change.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  )
}
