'use client'

import { LiveDot } from '@/components/ui/LiveDot'
import { formatTimeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface FreshnessTagProps {
  date: Date | string
  className?: string
}

export function FreshnessTag({ date, className }: FreshnessTagProps) {
  const d = new Date(date)
  const now = new Date()
  const hoursAgo = (now.getTime() - d.getTime()) / (1000 * 60 * 60)

  const isNew = hoursAgo < 24
  const isRecent = hoursAgo < 72

  if (isNew) {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <LiveDot size={5} color="#22c55e" />
        <span className="text-xs text-[#22c55e] font-medium">{formatTimeAgo(date)}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'text-xs',
        isRecent ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]',
        className
      )}
    >
      {formatTimeAgo(date)}
    </span>
  )
}
