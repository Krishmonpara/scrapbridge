'use client'

import { CountUp } from '@/components/ui/CountUp'
import { Sparkline } from '@/components/ui/Sparkline'
import { ShieldCheck, Factory, Clock, TrendingUp, TrendingDown } from 'lucide-react'

const STATS = [
  { value: 2.4,  decimals: 1, prefix: '$',  suffix: 'B', label: 'Materials traded last 12 months', delta: 12.4, trend: [1.6, 1.7, 1.9, 1.8, 2.0, 2.2, 2.1, 2.4] },
  { value: 1847, decimals: 0, prefix: '',   suffix: '+', label: 'Verified yards & manufacturers',   delta: 8.1,  trend: [1400, 1480, 1560, 1610, 1680, 1740, 1790, 1847] },
  { value: 42,   decimals: 0, prefix: '',   suffix: 'k', label: 'Tons listed every week',           delta: 5.3,  trend: [33, 35, 34, 37, 39, 38, 40, 42] },
  { value: 24,   decimals: 0, prefix: '<',  suffix: 'h', label: 'Median seller response time',      delta: -14.2, trend: [34, 32, 31, 29, 28, 27, 25, 24] },
] as const

const TRUST = [
  { Icon: ShieldCheck, label: 'D&B Verified' },
  { Icon: Factory,     label: 'ISRI Member' },
  { Icon: TrendingUp,  label: 'SOC 2 Type II' },
  { Icon: Clock,       label: '24/7 Marketplace' },
] as const

export function StatsStrip() {
  return (
    <section
      className="border-y border-[var(--border)]"
      style={{ background: 'var(--background)' }}
    >
      <div className="max-w-screen-xl mx-auto px-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 py-12">
          {STATS.map((s, i) => {
            // "response time" going down is good — invert the color semantics
            const isTimeMetric = s.suffix === 'h'
            const deltaGood = isTimeMetric ? s.delta < 0 : s.delta >= 0
            const DeltaIcon = s.delta >= 0 ? TrendingUp : TrendingDown
            return (
              <div
                key={i}
                className="flex flex-col gap-2 border-l border-[var(--border)] pl-5 first:border-l-0 first:pl-0 md:border-l md:pl-5 md:first:border-l-0 md:first:pl-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="font-display text-[40px] md:text-[56px] leading-none tracking-tight text-[var(--foreground)] tabular-nums"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <CountUp to={s.value} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
                  </span>
                  <Sparkline
                    data={[...s.trend]}
                    width={68}
                    height={30}
                    fill
                    color={deltaGood ? 'var(--up)' : 'var(--down)'}
                    className="shrink-0 mt-1 hidden sm:block"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                    style={{ color: deltaGood ? 'var(--up)' : 'var(--down)' }}
                  >
                    <DeltaIcon size={12} />
                    {s.delta >= 0 ? '+' : ''}{s.delta}%
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    {s.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center md:justify-between gap-x-8 gap-y-3 py-5 border-t border-[var(--border)]">
          <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
            Trusted by the industry
          </span>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
            {TRUST.map(({ Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <Icon size={13} strokeWidth={1.5} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
