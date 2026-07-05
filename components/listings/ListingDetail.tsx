import Link from 'next/link'
import { Listing, Company } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { PriceTag } from '@/components/ui/PriceTag'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { LocationPin } from '@/components/shared/LocationPin'
import { FreshnessTag } from '@/components/shared/FreshnessTag'
import { MaterialIcon } from '@/components/shared/MaterialIcon'
import { FairPriceBadge } from '@/components/shared/FairPriceBadge'
import { ImageWithShimmer } from '@/components/ui/ImageWithShimmer'
import { getMaterialImage } from '@/lib/materialImages'
import { InquiryForm } from '@/components/forms/InquiryForm'
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  UNIT_LABELS,
  BUSINESS_TYPE_LABELS,
} from '@/types'
import { formatNumber, formatDate } from '@/lib/utils'
import { Package, Truck, Phone, Star, Eye, MessageSquare } from 'lucide-react'

interface ListingDetailProps {
  listing: Listing & { company: Company }
  relatedListings?: (Listing & { company: Pick<Company, 'name' | 'verificationStatus' | 'slug'> })[]
}

export function ListingDetail({ listing, relatedListings = [] }: ListingDetailProps) {
  const specs: { label: string; value: string | null | undefined }[] = [
    { label: 'Material Category', value: CATEGORY_LABELS[listing.materialCategory] },
    { label: 'Subcategory', value: listing.materialSubcategory },
    { label: 'Grade', value: listing.grade },
    { label: 'Condition', value: CONDITION_LABELS[listing.condition] },
    { label: 'Quantity', value: `${formatNumber(listing.quantity)} ${UNIT_LABELS[listing.unit]}` },
    { label: 'Min Order', value: listing.minOrder ? `${formatNumber(listing.minOrder)} ${UNIT_LABELS[listing.unit]}` : null },
    { label: 'Price / Unit', value: listing.pricePerUnit ? `$${listing.pricePerUnit}` : 'RFQ' },
    { label: 'Negotiable', value: listing.negotiable ? 'Yes' : 'No' },
    { label: 'Pickup', value: listing.pickupAvailable ? 'Available' : 'No' },
    { label: 'Delivery', value: listing.deliveryAvailable ? 'Available' : 'No' },
    { label: 'Listed', value: formatDate(listing.createdAt) },
    { label: 'Expires', value: listing.expiresAt ? formatDate(listing.expiresAt) : 'No expiry' },
  ]

  return (
    <div className="flex gap-8 flex-col lg:flex-row">
      {/* Left column */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant={listing.listingType === 'SELL' ? 'amber' : 'steel'}>{listing.listingType}</Badge>
            <Badge variant={listing.condition === 'COMPLETE' ? 'success' : 'default'}>
              {CONDITION_LABELS[listing.condition]}
            </Badge>
            <FreshnessTag date={listing.createdAt} />
            <FairPriceBadge listing={listing} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{listing.title}</h1>
          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
            <LocationPin city={listing.city} state={listing.state} />
            <span>·</span>
            <span className="flex items-center gap-1"><Eye size={13} /> {listing.viewCount}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><MessageSquare size={13} /> {listing.inquiryCount}</span>
          </div>
        </div>

        {/* Photo hero — same image as the ListingCard so the shared-element
            view transition can morph card → detail */}
        <div
          className="relative h-64 rounded-sm overflow-hidden"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            viewTransitionName: `listing-photo-${listing.id}`,
          }}
        >
          <ImageWithShimmer
            src={listing.photos?.[0] || getMaterialImage(listing.materialCategory, listing.id)}
            alt={listing.title}
            className="absolute inset-0 w-full h-full object-cover"
            fallbackIcon={<MaterialIcon category={listing.materialCategory} size={96} />}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Specs table */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Specifications</h2>
          <div className="rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {specs.filter(s => s.value != null).map(({ label, value }, i) => (
              <div
                key={label}
                className="flex items-center px-4 py-2.5 text-sm"
                style={{
                  background: i % 2 === 0 ? 'var(--bg-secondary)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span className="w-40 shrink-0 text-[var(--text-tertiary)]">{label}</span>
                <span className="text-[var(--text-primary)] font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {listing.description && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Description</h2>
            <div
              className="p-4 rounded text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              {listing.description}
            </div>
          </div>
        )}
      </div>

      {/* Right column */}
      <div className="w-full lg:w-80 shrink-0">
        <div className="sticky top-24 flex flex-col gap-4">
          {/* Company card */}
          <div
            className="p-4 rounded flex flex-col gap-3"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded flex items-center justify-center font-bold text-[var(--accent)]"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                {listing.company.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/company/${listing.company.slug}`}
                    className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors truncate"
                  >
                    {listing.company.name}
                  </Link>
                  <VerifiedBadge status={listing.company.verificationStatus} />
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {BUSINESS_TYPE_LABELS[listing.company.businessType]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Star size={11} className="text-[var(--accent)]" />
              {listing.company.rating.toFixed(1)} · {listing.company.city}, {listing.company.state}
            </div>
            {listing.company.phone && (
              <a href={`tel:${listing.company.phone}`} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                <Phone size={13} /> {listing.company.phone}
              </a>
            )}
          </div>

          {/* Price + inquiry */}
          <div
            id="inquiry"
            className="p-4 rounded flex flex-col gap-4"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            {listing.pricePerUnit ? (
              <PriceTag
                price={listing.pricePerUnit}
                unit={UNIT_LABELS[listing.unit]}
                currency={listing.currency}
                negotiable={listing.negotiable}
                size="lg"
              />
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] italic">Price on request</p>
            )}
            <div className="flex gap-3 text-xs text-[var(--text-tertiary)]">
              {listing.pickupAvailable && <span className="flex items-center gap-1"><Package size={12} /> Pickup</span>}
              {listing.deliveryAvailable && <span className="flex items-center gap-1 text-[#2dba6e]"><Truck size={12} /> Delivery</span>}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <InquiryForm listingId={listing.id} toCompanyId={listing.companyId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
