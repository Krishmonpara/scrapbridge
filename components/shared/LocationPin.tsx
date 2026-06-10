import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LocationPinProps {
  city: string
  state: string
  className?: string
  iconSize?: number
}

export function LocationPin({ city, state, className, iconSize = 12 }: LocationPinProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[var(--text-tertiary)]', className)}>
      <MapPin size={iconSize} />
      <span className="text-xs">
        {city}, {state}
      </span>
    </span>
  )
}
