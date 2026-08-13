'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MarketEvent, QuoteUnit, Tick } from '@/lib/market/types'
import { EVENT_LABELS, formatQuote } from '@/lib/market/types'

interface Props {
  ticks: Tick[]
  events?: MarketEvent[]
  unit: QuoteUnit
  height?: number
  /** accessible summary of the whole series */
  label: string
}

const PAD = { t: 26, r: 68, b: 34, l: 58 }

function fmtDate(iso: string) {
  const [, m, d] = iso.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[Number(m) - 1]} ${d}`
}

// Annotated price history. Event markers are numbered rather than colour-coded:
// the numeral carries identity, so the up/down tint is redundant reinforcement
// (the up/down token pair sits in the CVD warn band and can't carry meaning alone).
export function PriceChart({ ticks, events = [], unit, height = 330, label }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(880)
  const [active, setActive] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setW(Math.max(320, entry.contentRect.width))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const narrow = w < 560
  const padR = narrow ? 22 : PAD.r
  const plotW = w - PAD.l - padR
  const plotH = height - PAD.t - PAD.b

  const eventByIdx = useMemo(() => {
    const map = new Map<number, MarketEvent & { n: number }>()
    events.forEach((e, i) => {
      const idx = ticks.findIndex((t) => t.date === e.date)
      if (idx >= 0) map.set(idx, { ...e, n: i + 1 })
    })
    return map
  }, [events, ticks])

  const { lo, hi } = useMemo(() => {
    const vals = ticks.map((t) => t.close)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const pad = (max - min) * 0.12 || max * 0.02
    return { lo: min - pad, hi: max + pad }
  }, [ticks])

  const xAt = useCallback(
    (i: number) => PAD.l + (plotW * i) / Math.max(1, ticks.length - 1),
    [plotW, ticks.length]
  )
  const yAt = useCallback(
    (v: number) => PAD.t + plotH * (1 - (v - lo) / (hi - lo || 1)),
    [plotH, lo, hi]
  )

  const linePath = useMemo(
    () => ticks.map((t, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)} ${yAt(t.close).toFixed(1)}`).join(''),
    [ticks, xAt, yAt]
  )
  const areaPath = `${linePath}L${xAt(ticks.length - 1).toFixed(1)} ${PAD.t + plotH}L${PAD.l} ${PAD.t + plotH}Z`

  const gridVals = useMemo(
    () => Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4),
    [lo, hi]
  )

  const xTickIdx = useMemo(() => {
    const n = ticks.length
    return [0, Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75), n - 1]
  }, [ticks.length])

  const idxFromClientX = (clientX: number) => {
    const svg = wrapRef.current?.querySelector('svg')
    if (!svg) return 0
    const box = svg.getBoundingClientRect()
    const scale = box.width / w
    const mx = (clientX - box.left) / scale
    const i = Math.round(((mx - PAD.l) / plotW) * (ticks.length - 1))
    return Math.max(0, Math.min(ticks.length - 1, i))
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      setActive((p) => Math.min(ticks.length - 1, (p ?? -1) + 1))
      e.preventDefault()
    } else if (e.key === 'ArrowLeft') {
      setActive((p) => Math.max(0, (p ?? ticks.length) - 1))
      e.preventDefault()
    } else if (e.key === 'Escape') setActive(null)
  }

  const last = ticks[ticks.length - 1]
  const activeTick = active !== null ? ticks[active] : null
  const activeEvent = active !== null ? eventByIdx.get(active) : undefined
  const activeChange =
    active !== null && active > 0 ? ticks[active].close - ticks[active - 1].close : null

  return (
    <div>
      <div ref={wrapRef} className="relative px-3 pb-3">
        <svg
          viewBox={`0 0 ${w} ${height}`}
          height={height}
          className="block w-full"
          role="img"
          aria-label={label}
          tabIndex={0}
          onKeyDown={onKey}
          onMouseMove={(e) => setActive(idxFromClientX(e.clientX))}
          onMouseLeave={() => setActive(null)}
          onBlur={() => setActive(null)}
          onTouchStart={(e) => e.touches[0] && setActive(idxFromClientX(e.touches[0].clientX))}
          onTouchMove={(e) => e.touches[0] && setActive(idxFromClientX(e.touches[0].clientX))}
          style={{ outlineOffset: 2 }}
        >
          <defs>
            <linearGradient id="pc-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--text-primary)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--text-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridVals.map((v) => (
            <g key={v}>
              <line
                x1={PAD.l}
                x2={PAD.l + plotW}
                y1={yAt(v)}
                y2={yAt(v)}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={PAD.l - 10}
                y={yAt(v) + 4}
                textAnchor="end"
                fill="var(--text-tertiary)"
                fontSize={10.5}
                fontFamily="var(--font-mono)"
              >
                {formatQuote(v, unit)}
              </text>
            </g>
          ))}

          {xTickIdx.map((i, k) => (
            <text
              key={i}
              x={xAt(i)}
              y={height - 12}
              textAnchor={k === 0 ? 'start' : k === xTickIdx.length - 1 ? 'end' : 'middle'}
              fill="var(--text-tertiary)"
              fontSize={10.5}
              fontFamily="var(--font-mono)"
            >
              {fmtDate(ticks[i].date)}
            </text>
          ))}

          <path d={areaPath} fill="url(#pc-area)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--text-primary)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {[...eventByIdx.entries()].map(([idx, e]) => {
            const x = xAt(idx)
            const y = yAt(ticks[idx].close)
            const tint = (e.impactPct ?? 0) >= 0 ? 'var(--up)' : 'var(--down)'
            return (
              <g key={e.date}>
                <circle cx={x} cy={y} r={9} fill="var(--bg-secondary)" />
                <circle cx={x} cy={y} r={8} fill={tint} stroke="var(--bg-secondary)" strokeWidth={2} />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill="#0a0a0a"
                  fontSize={11}
                  fontWeight={700}
                  fontFamily="var(--font-mono)"
                >
                  {e.n}
                </text>
              </g>
            )
          })}

          {!narrow && (
            <g>
              <circle cx={xAt(ticks.length - 1)} cy={yAt(last.close)} r={3.5} fill="var(--text-primary)" />
              <text
                x={xAt(ticks.length - 1) + 8}
                y={yAt(last.close) + 4}
                fill="var(--text-primary)"
                fontSize={12}
                fontWeight={700}
                fontFamily="var(--font-mono)"
              >
                {formatQuote(last.close, unit)}
              </text>
            </g>
          )}

          {active !== null && (
            <g>
              <line
                x1={xAt(active)}
                x2={xAt(active)}
                y1={PAD.t}
                y2={PAD.t + plotH}
                stroke="var(--text-secondary)"
                strokeWidth={1}
                opacity={0.5}
              />
              <circle
                cx={xAt(active)}
                cy={yAt(ticks[active].close)}
                r={4}
                fill="var(--text-primary)"
                stroke="var(--bg-secondary)"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {activeTick && (
          <div
            className="pointer-events-none absolute top-2 z-10 border px-3 py-2"
            style={{
              left: Math.min(Math.max(0, (xAt(active!) / w) * 100), 72) + '%',
              background: 'var(--bg-tertiary)',
              borderColor: 'var(--border)',
              minWidth: 160,
            }}
          >
            <div className="text-[11px]" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {fmtDate(activeTick.date)} {activeTick.date.slice(0, 4)}
            </div>
            <div
              className="text-[15px] font-semibold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
            >
              {formatQuote(activeTick.close, unit)}{' '}
              {activeChange !== null && (
                <span
                  className="text-[12px]"
                  style={{ color: activeChange >= 0 ? 'var(--up)' : 'var(--down)' }}
                >
                  {activeChange >= 0 ? '▲' : '▼'} {activeChange >= 0 ? '+' : '−'}
                  {Math.abs(activeChange).toFixed(unit === 'USD_TON' ? 0 : 2)}
                </span>
              )}
            </div>
            {activeEvent && (
              <div
                className="mt-1.5 border-t pt-1.5 text-[12px] leading-snug"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <b>
                  ({activeEvent.n}) {EVENT_LABELS[activeEvent.category]}
                </b>
                <br />
                {activeEvent.headline}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-5 pb-4">
        <span
          className="text-[11px] uppercase tracking-[0.14em]"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
        >
          {eventByIdx.size > 0 ? 'Numbered markers = events below' : 'Hover or use arrow keys'}
        </span>
        <button
          type="button"
          onClick={() => setShowTable((s) => !s)}
          aria-expanded={showTable}
          className="ml-auto border px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] transition-colors"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {showTable ? 'Hide table' : 'View as table'}
        </button>
      </div>

      {showTable && (
        <div className="overflow-x-auto px-5 pb-5">
          <table className="w-full border-collapse text-[12.5px] tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr>
                {['Date', 'Close', 'Change', 'Event'].map((h, i) => (
                  <th
                    key={h}
                    className={`border-b px-2.5 py-1.5 text-[11px] uppercase tracking-[0.1em] font-medium ${i > 1 || i === 0 ? 'text-left' : 'text-right'}`}
                    style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ticks.map((t, i) => {
                const ch = i ? t.close - ticks[i - 1].close : null
                const ev = eventByIdx.get(i)
                return (
                  <tr key={t.date}>
                    <td className="border-b px-2.5 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      {fmtDate(t.date)}
                    </td>
                    <td className="border-b px-2.5 py-1.5 text-right" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                      {formatQuote(t.close, unit)}
                    </td>
                    <td
                      className="border-b px-2.5 py-1.5 text-right"
                      style={{ borderColor: 'var(--border)', color: ch === null ? 'var(--text-tertiary)' : ch >= 0 ? 'var(--up)' : 'var(--down)' }}
                    >
                      {ch === null
                        ? '—'
                        : `${ch >= 0 ? '▲ +' : '▼ −'}${Math.abs(ch).toFixed(unit === 'USD_TON' ? 0 : 2)}`}
                    </td>
                    <td className="border-b px-2.5 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      {ev ? `(${ev.n}) ${ev.headline}` : ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
