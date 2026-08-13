import type { RegionRow } from '@/lib/market/types'

// Regional dispersion for one grade. One series, one colour — the bar length
// already encodes magnitude, so tinting each bar by its own value would burn
// the colour channel on information the chart shows twice.
export function RegionDispersion({ rows, unit = '/ton' }: { rows: RegionRow[]; unit?: string }) {
  if (rows.length === 0) return null
  const max = Math.max(...rows.map((r) => r.price))
  const min = Math.min(...rows.map((r) => r.price))
  const spread = max - min

  return (
    <div className="p-5">
      <div className="mb-4 flex flex-wrap items-baseline gap-3">
        <h3
          className="text-[12px] uppercase tracking-[0.14em] font-semibold"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
        >
          HMS #1 by region
        </h3>
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          ${spread}{unit} spread between the best and worst region — the number freight has to beat.
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.region} className="flex items-center gap-3">
            <span
              className="w-[92px] shrink-0 text-[12px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {r.region}
            </span>
            <span className="relative h-[10px] flex-1" style={{ background: 'var(--bg-tertiary)' }}>
              <span
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${((r.price - min * 0.97) / (max - min * 0.97)) * 100}%`,
                  background: 'var(--steel-blue)',
                }}
              />
            </span>
            <span
              className="w-[58px] shrink-0 text-right text-[12.5px] font-bold tabular-nums"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
            >
              ${r.price}
            </span>
            <span
              className="w-[46px] shrink-0 text-right text-[11.5px] tabular-nums"
              style={{
                color: r.vsNational >= 0 ? 'var(--up)' : 'var(--down)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {r.vsNational >= 0 ? '▲ +' : '▼ −'}
              {Math.abs(r.vsNational)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
