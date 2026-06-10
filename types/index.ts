export type BusinessType = 'SCRAP_YARD' | 'DEMOLITION' | 'SHIP_BREAKER' | 'MANUFACTURER' | 'RECYCLER' | 'TRADER' | 'BROKER'
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
export type ListingType = 'SELL' | 'BUY' | 'WANTED' | 'AUCTION'
export type MaterialCategory =
  | 'FERROUS_METALS'
  | 'NON_FERROUS_METALS'
  | 'ENGINES_DRIVETRAIN'
  | 'ELECTRIC_MOTORS'
  | 'PIPING_FITTINGS'
  | 'TANKS_VESSELS'
  | 'HEAVY_MACHINERY'
  | 'MARINE_OFFSHORE'
  | 'RAIL_TRANSPORT'
  | 'AEROSPACE'
  | 'CONSTRUCTION_DEMOLITION'
  | 'ELECTRONIC_ELECTRICAL'
  | 'PRECIOUS_SPECIALTY'
  | 'INDUSTRIAL_EQUIPMENT'
export type Condition = 'COMPLETE' | 'PARTIAL' | 'DAMAGED' | 'AS_IS' | 'SCRAP_ONLY'
export type Unit = 'TONS' | 'LBS' | 'KG' | 'PIECES' | 'LOT'
export type ListingStatus = 'ACTIVE' | 'EXPIRED' | 'SOLD' | 'DRAFT'

export interface Company {
  id: string
  name: string
  slug: string
  businessType: BusinessType
  verificationStatus: VerificationStatus
  city: string
  state: string
  country: string
  phone?: string | null
  email: string
  website?: string | null
  description?: string | null
  logoUrl?: string | null
  memberSince: Date
  rating: number
  reviewCount: number
  createdAt: Date
}

export interface Listing {
  id: string
  companyId: string
  company?: Company
  listingType: ListingType
  title: string
  materialCategory: MaterialCategory
  materialSubcategory?: string | null
  grade?: string | null
  condition: Condition
  quantity: number
  unit: Unit
  pricePerUnit?: number | null
  currency: string
  negotiable: boolean
  minOrder?: number | null
  description?: string | null
  specs?: string | null
  city: string
  state: string
  country: string
  pickupAvailable: boolean
  deliveryAvailable: boolean
  expiresAt?: Date | null
  status: ListingStatus
  viewCount: number
  inquiryCount: number
  photos: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ListingFilters {
  listingType?: ListingType
  materialCategory?: MaterialCategory
  condition?: Condition[]
  state?: string
  minPrice?: number
  maxPrice?: number
  minQuantity?: number
  maxQuantity?: number
  verifiedOnly?: boolean
  postedWithin?: '24h' | '7d' | '30d' | 'all'
  search?: string
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'most_inquiries' | 'expiring_soon'
}

export const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  FERROUS_METALS: 'Ferrous Metals',
  NON_FERROUS_METALS: 'Non-Ferrous Metals',
  ENGINES_DRIVETRAIN: 'Engines & Drivetrain',
  ELECTRIC_MOTORS: 'Electric Motors & Power',
  PIPING_FITTINGS: 'Piping & Fittings',
  TANKS_VESSELS: 'Tanks & Vessels',
  HEAVY_MACHINERY: 'Heavy Machinery',
  MARINE_OFFSHORE: 'Marine & Offshore',
  RAIL_TRANSPORT: 'Rail & Transport',
  AEROSPACE: 'Aerospace',
  CONSTRUCTION_DEMOLITION: 'Construction & Demolition',
  ELECTRONIC_ELECTRICAL: 'Electronic & Electrical',
  PRECIOUS_SPECIALTY: 'Precious & Specialty',
  INDUSTRIAL_EQUIPMENT: 'Industrial Equipment',
}

export const UNIT_LABELS: Record<Unit, string> = {
  TONS: 'tons',
  LBS: 'lbs',
  KG: 'kg',
  PIECES: 'pcs',
  LOT: 'lot',
}

export const CONDITION_LABELS: Record<Condition, string> = {
  COMPLETE: 'Complete',
  PARTIAL: 'Partial',
  DAMAGED: 'Damaged',
  AS_IS: 'As-Is',
  SCRAP_ONLY: 'Scrap Only',
}

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  SCRAP_YARD: 'Scrap Yard',
  DEMOLITION: 'Demolition',
  SHIP_BREAKER: 'Ship Breaker',
  MANUFACTURER: 'Manufacturer',
  RECYCLER: 'Recycler',
  TRADER: 'Trader',
  BROKER: 'Broker',
}
