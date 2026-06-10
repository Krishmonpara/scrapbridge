import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PriceTagProps {
  price: number
  unit?: string
  currency?: string
  negotiable?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function PriceTag({
  price,
  unit,
  currency = 'USD',
  negotiable,
  size = 'md',
  className,
}: PriceTagProps) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl',
  }

  return (
    <div className={cn('flex items-baseline gap-1.5', className)}>
      <span
        className={cn('font-mono-data font-bold text-[var(--accent)]', sizes[size])}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {formatPrice(price, currency)}
      </span>
      {unit && (
        <span className="text-xs text-[var(--text-tertiary)]">
          / {unit}
        </span>
      )}
      {negotiable && (
        <span className="text-xs text-[var(--steel-blue)] border border-[var(--steel-blue)]/30 bg-[var(--steel-blue)]/10 px-1.5 py-0.5 rounded-sm">
          OBO
        </span>
      )}
    </div>
  )
}
