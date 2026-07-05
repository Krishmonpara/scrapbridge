'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LiveDot } from '@/components/ui/LiveDot'
import { TrendingUp, Minus } from 'lucide-react'

interface Category {
  category: string
  label: string
  activeListings: number
  newLast30d: number
}

interface Item {
  category: string
  label: string
  active: number
  fresh: number
}

// Ticker content is drawn entirely from real marketplace aggregates
// (active listing counts + new-in-30-days). No fabricated spot prices —
// a live commodity feed is tracked as Flag item 3.
export function MarketTicker() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    let alive = true
    fetch('/api/public/prices')
      .then((r) => r.json())
      .then((d: { categories?: Category[] }) => {
        if (alive && d.categories) {
          setItems(
            d.categories.map((c) => ({
              category: c.category,
              label: c.label,
              active: c.activeListings,
              fresh: c.newLast30d,
            }))
          )
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (items.length === 0) return null

  const run = [...items, ...items]

  return (
    <div
      className="h-10 flex items-center overflow-hidden relative"
      style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
      aria-label="Live market activity"
    >
      {/* "LIVE MARKET" stamp pinned to the left edge */}
      <div
        className="shrink-0 h-full flex items-center gap-2 px-4 z-10"
        style={{ background: 'var(--background)', borderRight: '1px solid var(--border)' }}
      >
        <LiveDot size={5} />
        <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          Live Market
        </span>
      </div>

      <div className="ticker-track flex items-center whitespace-nowrap" style={{ fontFamily: 'var(--font-display)' }}>
        {run.map((item, i) => (
          <Link
            key={`${item.category}-${i}`}
            href={`/browse?category=${item.category}`}
            className="group flex items-center gap-2 px-6"
          >
            <span className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-[var(--foreground)] transition-colors">
              {item.label}
            </span>
            <span className="text-[12px] tabular-nums text-[var(--foreground)]">{item.active}</span>
            <span className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">active</span>
            <span
              className="inline-flex items-center gap-0.5 text-[11px] tabular-nums"
              style={{ color: item.fresh > 0 ? 'var(--up)' : 'var(--neutral)' }}
            >
              {item.fresh > 0 ? <TrendingUp size={11} /> : <Minus size={11} />}
              {item.fresh > 0 ? `${item.fresh} new` : 'flat'}
            </span>
            <span className="text-[var(--border)] pl-4 select-none">|</span>
          </Link>
        ))}
      </div>

      {/* right edge fade */}
      <div
        className="absolute inset-y-0 right-0 w-16 pointer-events-none"
        style={{ background: 'linear-gradient(270deg, var(--bg-secondary), transparent)' }}
      />
    </div>
  )
}
