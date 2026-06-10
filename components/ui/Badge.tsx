import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'amber' | 'success' | 'danger' | 'steel' | 'copper' | 'iron'
}

export function Badge({ children, variant = 'default', className, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border)]',
    amber: 'bg-[var(--foreground)]/8 text-[var(--foreground)] border-[var(--foreground)]/20',
    success: 'bg-[#22c55e]/12 text-[#22c55e] border-[#22c55e]/25',
    danger: 'bg-[#ef4444]/12 text-[#ef4444] border-[#ef4444]/25',
    steel: 'bg-[#60a5fa]/12 text-[#60a5fa] border-[#60a5fa]/25',
    copper: 'bg-[#fb923c]/12 text-[#fb923c] border-[#fb923c]/25',
    iron: 'bg-[var(--muted-foreground)]/10 text-[var(--muted-foreground)] border-[var(--muted-foreground)]/20',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-sm border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
