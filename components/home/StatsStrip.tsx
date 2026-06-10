'use client'

import { CountUp } from '@/components/ui/CountUp'
import { ShieldCheck, Factory, Clock, TrendingUp } from 'lucide-react'

const STATS = [
  { value: 2.4,  decimals: 1, prefix: '$',  suffix: 'B', label: 'Materials traded last 12 months' },
  { value: 1847, decimals: 0, prefix: '',   suffix: '+', label: 'Verified yards & manufacturers' },
  { value: 42,   decimals: 0, prefix: '',   suffix: 'k', label: 'Tons listed every week' },
  { value: 24,   decimals: 0, prefix: '<',  suffix: 'h', label: 'Median seller response time' },
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
          {STATS.map((s, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 border-l border-[var(--border)] pl-5 first:border-l-0 first:pl-0 md:border-l md:pl-5 md:first:border-l-0 md:first:pl-0"
            >
              <span
                className="font-display text-[40px] md:text-[56px] leading-none tracking-tight text-[var(--foreground)] tabular-nums"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <CountUp to={s.value} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                {s.label}
              </span>
            </div>
          ))}
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
