import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerifiedBadgeProps {
  status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export function VerifiedBadge({ status, size = 'sm', showLabel = false, className }: VerifiedBadgeProps) {
  if (status === 'UNVERIFIED') return null

  const isPending = status === 'PENDING'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm',
        isPending
          ? 'text-[var(--muted-foreground)] bg-[var(--muted)] border border-[var(--border)]'
          : 'text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/25',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm',
        className
      )}
      title={isPending ? 'Verification Pending' : 'Verified Business'}
    >
      <ShieldCheck size={size === 'sm' ? 10 : 12} />
      {showLabel && <span>{isPending ? 'Pending' : 'Verified'}</span>}
    </span>
  )
}
