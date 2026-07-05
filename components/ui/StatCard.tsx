import { CountUp } from '@/components/ui/CountUp'
import { Sparkline } from '@/components/ui/Sparkline'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  /** percent change vs prior period, e.g. 12 or -4.3 */
  delta?: number
  /** trend series for the inline sparkline */
  trend?: number[]
  icon?: LucideIcon
  /** count-up on scroll (default true) */
  animate?: boolean
}

// Terminal-style metric: mono value, semantic delta, optional sparkline.
export function StatCard({
  label,
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  delta,
  trend,
  icon: Icon,
  animate = true,
}: StatCardProps) {
  const deltaUp = (delta ?? 0) >= 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={13} strokeWidth={1.5} className="text-[var(--muted-foreground)]" />}
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          {label}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <span
          className="font-display text-[32px] md:text-[40px] leading-none tracking-tight text-[var(--foreground)] tabular-nums"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {animate ? (
            <CountUp to={value} decimals={decimals} prefix={prefix} suffix={suffix} />
          ) : (
            <>
              {prefix}
              {value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
              {suffix}
            </>
          )}
        </span>
        {trend && trend.length > 1 && (
          <Sparkline data={trend} width={72} height={28} fill className="shrink-0 mb-1" />
        )}
      </div>

      {delta !== undefined && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums"
          style={{ color: deltaUp ? 'var(--up)' : 'var(--down)' }}
        >
          {deltaUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {deltaUp ? '+' : ''}
          {delta.toFixed(1)}%
          <span className="text-[var(--muted-foreground)] font-normal">vs last month</span>
        </span>
      )}
    </div>
  )
}
