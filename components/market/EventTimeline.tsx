import { EVENT_LABELS, type MarketEvent } from '@/lib/market/types'

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d} ${months[Number(m) - 1]} ${y}`
}

// Each numbered marker on the price chart, with the reporting behind it.
// The numeral is the link back to the chart; impact direction carries an
// arrow glyph so it never depends on colour alone.
export function EventTimeline({ events }: { events: MarketEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="p-6 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
        No market events recorded for this series yet.
      </div>
    )
  }

  return (
    <div>
      {events.map((e, i) => {
        const up = (e.impactPct ?? 0) >= 0
        return (
          <div
            key={`${e.date}-${i}`}
            className="flex gap-3.5 border-b p-4 last:border-b-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="grid h-6 w-6 shrink-0 place-items-center border text-[12px] font-bold"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span
                  className="text-[11.5px] tracking-[0.06em]"
                  style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
                >
                  {fmtDate(e.date)}
                </span>
                <span
                  className="border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em]"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {EVENT_LABELS[e.category]}
                </span>
                {e.impactPct !== null && (
                  <span
                    className="text-[12px] font-semibold tabular-nums"
                    style={{ color: up ? 'var(--up)' : 'var(--down)', fontFamily: 'var(--font-mono)' }}
                  >
                    {up ? '▲ +' : '▼ −'}
                    {Math.abs(e.impactPct).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[14.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {e.headline}
              </div>
              <p className="mt-0.5 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {e.body}
              </p>
              <div
                className="mt-1.5 text-[11px]"
                style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
              >
                Source: {e.sourceName}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
