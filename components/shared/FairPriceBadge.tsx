import { Badge } from '@/components/ui/Badge'
import { Tooltip } from '@/components/ui/Tooltip'
import { getPriceSignal } from '@/lib/agents/price-intelligence'
import type { MaterialCategory, Unit } from '@/types'
import { TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react'

interface FairPriceBadgeProps {
  listing: {
    materialCategory: MaterialCategory
    pricePerUnit?: number | null
    unit: Unit
    currency?: string | null
  }
}

export function FairPriceBadge({ listing }: FairPriceBadgeProps) {
  const signal = getPriceSignal(listing)
  if (signal.verdict === 'UNKNOWN') return null

  const config = {
    FAIR: { variant: 'success' as const, icon: CheckCircle2, label: 'Fair Price' },
    BELOW_MARKET: { variant: 'steel' as const, icon: TrendingDown, label: 'Below Market' },
    ABOVE_MARKET: { variant: 'copper' as const, icon: TrendingUp, label: 'Above Market' },
  }[signal.verdict]

  const Icon = config.icon

  return (
    <Tooltip content={signal.note}>
      <Badge variant={config.variant}>
        <Icon size={11} />
        {config.label}
        {signal.deviationPct !== null && signal.verdict !== 'FAIR' && (
          <span className="opacity-75">
            {signal.deviationPct > 0 ? '+' : ''}{signal.deviationPct}%
          </span>
        )}
      </Badge>
    </Tooltip>
  )
}
