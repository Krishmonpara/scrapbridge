import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CATEGORY_LABELS, type MaterialCategory } from '@/types'
import { MaterialIcon } from '@/components/shared/MaterialIcon'
import { Activity, ArrowRight } from 'lucide-react'

// Server-rendered bento tile: live supply snapshot of the top categories.
// All data comes from marketplace aggregates — no external feed.
export async function MarketPulse() {
  let rows: { category: MaterialCategory; label: string; active: number; fresh: number }[] = []
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    const [grouped, recent] = await Promise.all([
      prisma.listing.groupBy({
        by: ['materialCategory'],
        where: { status: 'ACTIVE', listingType: 'SELL' },
        _count: { id: true },
      }),
      prisma.listing.groupBy({
        by: ['materialCategory'],
        where: { status: 'ACTIVE', listingType: 'SELL', createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
      }),
    ])
    const freshMap = Object.fromEntries(recent.map((r) => [r.materialCategory, r._count.id]))
    rows = grouped
      .map((g) => ({
        category: g.materialCategory as MaterialCategory,
        label: CATEGORY_LABELS[g.materialCategory as MaterialCategory],
        active: g._count.id,
        fresh: freshMap[g.materialCategory] ?? 0,
      }))
      .sort((a, b) => b.active - a.active)
      .slice(0, 5)
  } catch {
    return null
  }

  if (rows.length === 0) return null
  const max = rows[0].active

  return (
    <div
      className="rounded-sm p-5 flex flex-col gap-4 h-full"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[var(--text-tertiary)]" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Market Pulse
          </span>
        </div>
        <Link
          href="/market"
          className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
        >
          Full data <ArrowRight size={11} />
        </Link>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {rows.map((r) => (
          <Link key={r.category} href={`/browse?category=${r.category}`} className="group flex items-center gap-3">
            <span className="text-[var(--text-tertiary)] group-hover:text-[var(--foreground)] transition-colors shrink-0">
              <MaterialIcon category={r.category} size={15} />
            </span>
            <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors w-36 truncate shrink-0">
              {r.label}
            </span>
            <span className="flex-1 h-1.5 overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
              <span
                className="block h-full transition-[width] duration-500"
                style={{ width: `${(r.active / max) * 100}%`, background: 'var(--foreground)', opacity: 0.55 }}
              />
            </span>
            <span
              className="text-xs tabular-nums text-[var(--text-primary)] w-8 text-right shrink-0"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {r.active}
            </span>
            {r.fresh > 0 && (
              <span className="text-[10px] tabular-nums shrink-0" style={{ color: 'var(--up)' }}>
                +{r.fresh}
              </span>
            )}
          </Link>
        ))}
      </div>

      <p className="text-[10px] text-[var(--text-tertiary)]">
        Active supply by category · live marketplace data
      </p>
    </div>
  )
}
