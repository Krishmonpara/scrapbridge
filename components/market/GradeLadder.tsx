import { Sparkline } from '@/components/ui/Sparkline'
import { formatQuote, type GradeRow } from '@/lib/market/types'

// The grade ladder — what a yard actually prices against. Non-ferrous grades
// carry their basis to the COMEX benchmark, which is the number that decides
// whether a load is worth buying.
export function GradeLadder({ rows }: { rows: GradeRow[] }) {
  const nonFerrous = rows.filter((r) => r.unit === 'USD_LB')
  const ferrous = rows.filter((r) => r.unit === 'USD_TON')

  return (
    <div className="grid gap-px md:grid-cols-2" style={{ background: 'var(--border)' }}>
      <GradeGroup title="Non-ferrous · USD / lb" rows={nonFerrous} showBasis />
      <GradeGroup title="Ferrous · USD / ton" rows={ferrous} />
    </div>
  )
}

function GradeGroup({
  title,
  rows,
  showBasis = false,
}: {
  title: string
  rows: GradeRow[]
  showBasis?: boolean
}) {
  return (
    <div style={{ background: 'var(--bg-secondary)' }} className="p-5">
      <h3
        className="mb-3 text-[12px] uppercase tracking-[0.14em] font-semibold"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
      >
        {title}
      </h3>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['Grade', 'Last', 'Chg', showBasis ? '% of Cu' : 'Trend'].map((h) => (
              <th
                key={h}
                className="border-b px-1 py-1.5 text-left text-[10px] uppercase tracking-[0.1em] font-medium last:text-right"
                style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const up = r.changePct >= 0
            return (
              <tr key={r.symbol}>
                <td
                  className="border-b px-1 py-2 text-[13px]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkline data={r.spark} width={44} height={16} />
                    <span>{r.label}</span>
                  </div>
                </td>
                <td
                  className="border-b px-1 py-2 text-[13px] tabular-nums"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                >
                  {formatQuote(r.last, r.unit).replace(/\/(lb|ton)$/, '')}
                </td>
                <td
                  className="border-b px-1 py-2 text-[12px] tabular-nums"
                  style={{ borderColor: 'var(--border)', color: up ? 'var(--up)' : 'var(--down)', fontFamily: 'var(--font-mono)' }}
                >
                  {up ? '▲' : '▼'} {up ? '+' : '−'}
                  {Math.abs(r.changePct).toFixed(1)}%
                </td>
                <td
                  className="border-b px-1 py-2 text-right text-[12px] tabular-nums"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
                >
                  {showBasis ? (r.pctOfBenchmark !== null ? `${r.pctOfBenchmark}%` : '—') : ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
