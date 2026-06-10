import {
  Layers,
  Cpu,
  Zap,
  Cylinder,
  Container,
  Truck,
  Anchor,
  Train,
  Plane,
  Building2,
  CircuitBoard,
  Gem,
  Factory,
  Cog,
} from 'lucide-react'
import { MaterialCategory } from '@/types'

const ICONS: Record<MaterialCategory, React.ElementType> = {
  FERROUS_METALS: Layers,
  NON_FERROUS_METALS: Gem,
  ENGINES_DRIVETRAIN: Cog,
  ELECTRIC_MOTORS: Zap,
  PIPING_FITTINGS: Cylinder,
  TANKS_VESSELS: Container,
  HEAVY_MACHINERY: Truck,
  MARINE_OFFSHORE: Anchor,
  RAIL_TRANSPORT: Train,
  AEROSPACE: Plane,
  CONSTRUCTION_DEMOLITION: Building2,
  ELECTRONIC_ELECTRICAL: CircuitBoard,
  PRECIOUS_SPECIALTY: Cpu,
  INDUSTRIAL_EQUIPMENT: Factory,
}

interface MaterialIconProps {
  category: MaterialCategory
  size?: number
  className?: string
}

export function MaterialIcon({ category, size = 20, className }: MaterialIconProps) {
  const Icon = ICONS[category] || Factory
  return <Icon size={size} className={className} />
}
