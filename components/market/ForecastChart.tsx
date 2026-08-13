'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Forecast, QuoteUnit, Tick } from '@/lib/market/types'
import { formatQuote } from '@/lib/market/types'

interface Props {
  history: Tick[]
  forecast: Forecast
  unit: QuoteUnit
  height?: number
}

const PAD = { t: 26, r: 74, b: 34, l: 58 }

function fmtDate(iso: string) {
  const [, m, d] = iso.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[Number(m) - 1]} ${d}`
}

// The fan, never a bare number. Two intervals (80% and 50%) around a damped
// random-walk median — the uncertainty is the deliverable, so it is drawn
// first and largest, with the median path dashed to read as projection.
export function ForecastChart({ history, forecast, unit, height = 320 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(880)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(320, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const hist = useMemo(() => history.slice(-40), [history])
  const pts = forecast.points
  const n = hist.length + pts.length
  const narrow = w < 560
  const padR = narrow ? 22 : PAD.r
  const plotW = w - PAD.l - padR
  const plotH = height - PAD.t - PAD.b

  const { lo, hi } = useMemo(() => {
    const vals = [
      ...hist.map((t) => t.close),
      ...pts.map((p) => p.p10),
      ...pts.map((p) => p.p90),
    ]
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const pad = (max - min) * 0.1 || max * 0.02
    return { lo: min - pad, hi: max + pad }
  }, [hist, pts])

  const xAt = (i: number) => PAD.l + (plotW * i) / Math.max(1, n - 1)
  const yAt = (v: number) => PAD.t + plotH * (1 - (v - lo) / (hi - lo || 1))

  const histPath = hist.map((t, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)} ${yAt(t.close).toFixed(1)}`).join('')
  const cut = hist.length - 1

  // median path starts at the last actual so the line is continuous
  const medPath =
    `M${xAt(cut).toFixed(1)} ${yAt(hist[cut].close).toFixed(1)}` +
    pts.map((p, i) => `L${xAt(hist.length + i).toFixed(1)} ${yAt(p.p50).toFixed(1)}`).join('')

  const band = (loKey: 'p10' | 'p25', hiKey: 'p90' | 'p75') => {
    const up = pts.map((p, i) => `${i ? 'L' : 'M'}${xAt(hist.length + i).toFixed(1)} ${yAt(p[hiKey]).toFixed(1)}`).join('')
    const down = [...pts]
      .reverse()
      .map((p, i) => `L${xAt(n - 1 - i).toFixed(1)} ${yAt(p[loKey]).toFixed(1)}`)
      .join('')
    const anchor = `M${xAt(cut).toFixed(1)} ${yAt(hist[cut].close).toFixed(1)}`
    return `${anchor}${up.replace(/^M/, 'L')}${down}Z`
  }

  const gridVals = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4)
  const activePt = active !== null && active >= hist.length ? pts[active - hist.length] : null
  const activeHist = active !== null && active < hist.length ? hist[active] : null

  const idxFromClientX = (clientX: number) => {
    const svg = wrapRef.current?.querySelector('svg')
    if (!svg) return 0
    const box = svg.getBoundingClientRect()
    const scale = box.width / w
    const mx = (clientX - box.left) / scale
    return Math.max(0, Math.min(n - 1, Math.round(((mx - PAD.l) / plotW) * (n - 1))))
  }

  return (
    <div ref={wrapRef} className="relative px-3 pb-3">
      <svg
        viewBox={`0 0 ${w} ${height}`}
        height={height}
        className="block w-full"
        role="img"
        aria-label={`Price projection. Median path from ${formatQuote(hist[cut].close, unit)} to ${formatQuote(pts[pts.length - 1].p50, unit)} over ${pts.length} trading days, inside an 80 percent interval of ${formatQuote(pts[pts.length - 1].p10, unit)} to ${formatQuote(pts[pts.length - 1].p90, unit)}.`}
        tabIndex={0}
        onMouseMove={(e) => setActive(idxFromClientX(e.clientX))}
        onMouseLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { setActive((p) => Math.min(n - 1, (p ?? -1) + 1)); e.preventDefault() }
          else if (e.key === 'ArrowLeft') { setActive((p) => Math.max(0, (p ?? n) - 1)); e.preventDefault() }
          else if (e.key === 'Escape') setActive(null)
        }}
      >
        {gridVals.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={PAD.l + plotW} y1={yAt(v)} y2={yAt(v)} stroke="var(--border)" strokeWidth={1} />
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

        <path d={band('p10', 'p90')} fill="var(--copper)" fillOpacity={0.13} />
        <path d={band('p25', 'p75')} fill="var(--copper)" fillOpacity={0.18} />

        <path d={histPath} fill="none" stroke="var(--text-primary)" strokeWidth={2} strokeLinejoin="round" />
        <path
          d={medPath}
          fill="none"
          stroke="var(--copper)"
          strokeWidth={2}
          strokeDasharray="5 4"
          strokeLinejoin="round"
        />

        <line x1={xAt(cut)} x2={xAt(cut)} y1={PAD.t} y2={PAD.t + plotH} stroke="var(--text-secondary)" strokeWidth={1} opacity={0.5} />
        <text x={xAt(cut) + 6} y={PAD.t + 11} fill="var(--text-secondary)" fontSize={10} fontFamily="var(--font-mono)">
          PROJECTION
        </text>

        {!narrow && (
          <g>
            <circle cx={xAt(n - 1)} cy={yAt(pts[pts.length - 1].p50)} r={3.5} fill="var(--copper)" />
            <text
              x={xAt(n - 1) + 8}
              y={yAt(pts[pts.length - 1].p50) + 4}
              fill="var(--copper)"
              fontSize={12}
              fontWeight={700}
              fontFamily="var(--font-mono)"
            >
              {formatQuote(pts[pts.length - 1].p50, unit)}
            </text>
          </g>
        )}

        {[0, Math.floor(hist.length / 2), cut, n - 1].map((i, k) => (
          <text
            key={i}
            x={xAt(i)}
            y={height - 12}
            textAnchor={k === 0 ? 'start' : k === 3 ? 'end' : 'middle'}
            fill="var(--text-tertiary)"
            fontSize={10.5}
            fontFamily="var(--font-mono)"
          >
            {fmtDate(i < hist.length ? hist[i].date : pts[i - hist.length].date)}
          </text>
        ))}

        {active !== null && (
          <line x1={xAt(active)} x2={xAt(active)} y1={PAD.t} y2={PAD.t + plotH} stroke="var(--text-secondary)" strokeWidth={1} opacity={0.4} />
        )}
      </svg>

      {(activePt || activeHist) && (
        <div
          className="pointer-events-none absolute top-2 z-10 border px-3 py-2 text-[12px]"
          style={{
            left: Math.min(Math.max(0, (xAt(active!) / w) * 100), 70) + '%',
            background: 'var(--bg-tertiary)',
            borderColor: 'var(--border)',
            fontFamily: 'var(--font-mono)',
            minWidth: 150,
          }}
        >
          {activeHist && (
            <>
              <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {fmtDate(activeHist.date)} · actual
              </div>
              <div className="text-[15px] font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {formatQuote(activeHist.close, unit)}
              </div>
            </>
          )}
          {activePt && (
            <>
              <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {fmtDate(activePt.date)} · projected
              </div>
              <div className="text-[15px] font-semibold tabular-nums" style={{ color: 'var(--copper)' }}>
                {formatQuote(activePt.p50, unit)}
              </div>
              <div className="mt-1 border-t pt-1 leading-snug" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                80% range
                <br />
                {formatQuote(activePt.p10, unit)} – {formatQuote(activePt.p90, unit)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
