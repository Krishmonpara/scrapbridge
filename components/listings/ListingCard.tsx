'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare, Eye, Truck, Package } from 'lucide-react'
import { Listing } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PriceTag } from '@/components/ui/PriceTag'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { LocationPin } from '@/components/shared/LocationPin'
import { FreshnessTag } from '@/components/shared/FreshnessTag'
import { MaterialIcon } from '@/components/shared/MaterialIcon'
import { CATEGORY_LABELS, CONDITION_LABELS, UNIT_LABELS } from '@/types'
import { formatNumber } from '@/lib/utils'
import { getMaterialImage } from '@/lib/materialImages'
import { ImageWithShimmer } from '@/components/ui/ImageWithShimmer'

interface ListingCardProps {
  listing: Listing & {
    company: {
      name: string
      verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
      slug: string
    }
  }
}

const LISTING_TYPE_COLORS = {
  SELL: 'amber',
  BUY: 'steel',
  WANTED: 'copper',
  AUCTION: 'danger',
} as const

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="group flex flex-col w-full rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/40 hover:shadow-[0_8px_28px_-12px_rgba(255,255,255,0.35)] transition-[border-color,box-shadow] duration-200"
    >
      {/* Photo area */}
      <div className="relative h-40 overflow-hidden bg-[var(--bg-tertiary)]">
        {(() => {
          const photo = listing.photos?.[0] || getMaterialImage(listing.materialCategory, listing.id)
          return (
            <>
              <ImageWithShimmer
                src={photo}
                alt={listing.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-110"
                fallbackIcon={<MaterialIcon category={listing.materialCategory} size={48} />}
              />
              {/* readability gradient + subtle accent glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 100%, rgba(255,255,255,0.18), transparent 60%)' }} />
            </>
          )
        })()}
        <div className="absolute top-2 left-2 z-10">
          <Badge variant={LISTING_TYPE_COLORS[listing.listingType] as any}>
            {listing.listingType}
          </Badge>
        </div>
        <div className="absolute top-2 right-2 z-10">
          <Badge variant={listing.condition === 'COMPLETE' ? 'success' : listing.condition === 'DAMAGED' ? 'danger' : 'default'}>
            {CONDITION_LABELS[listing.condition]}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <div>
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">
            {CATEGORY_LABELS[listing.materialCategory]}
          </p>
          <Link href={`/listing/${listing.id}`}>
            <h3 className="font-semibold text-[var(--text-primary)] text-sm leading-tight hover:text-[var(--accent)] transition-colors duration-150 line-clamp-2">
              {listing.title}
            </h3>
          </Link>
        </div>

        {listing.grade && (
          <p className="text-xs text-[var(--text-secondary)]">Grade: {listing.grade}</p>
        )}

        {/* Quantity */}
        <div
          className="flex items-center justify-between py-1.5 px-2 rounded-sm"
          style={{ background: 'var(--bg-primary)' }}
        >
          <span className="text-xs text-[var(--text-tertiary)]">Qty Available</span>
          <span
            className="text-sm font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {formatNumber(listing.quantity)} {UNIT_LABELS[listing.unit]}
          </span>
        </div>

        {/* Price */}
        {listing.pricePerUnit ? (
          <PriceTag
            price={listing.pricePerUnit}
            unit={UNIT_LABELS[listing.unit]}
            currency={listing.currency}
            negotiable={listing.negotiable}
            size="md"
          />
        ) : (
          <span className="text-sm text-[var(--text-tertiary)] italic">Price on request</span>
        )}

        {/* Company + location */}
        <div className="flex items-center gap-1 mt-auto pt-1" style={{ borderTop: '1px solid var(--border)' }}>
          <Link
            href={`/company/${listing.company.slug}`}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors truncate flex-1"
          >
            {listing.company.name}
          </Link>
          <VerifiedBadge status={listing.company.verificationStatus} />
        </div>

        <div className="flex items-center justify-between">
          <LocationPin city={listing.city} state={listing.state} />
          <FreshnessTag date={listing.createdAt} />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <Eye size={11} /> {listing.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={11} /> {listing.inquiryCount}
          </span>
          {listing.deliveryAvailable && (
            <span className="flex items-center gap-1 text-[#22c55e]">
              <Truck size={11} /> Delivery
            </span>
          )}
          {listing.pickupAvailable && (
            <span className="flex items-center gap-1">
              <Package size={11} /> Pickup
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <Button size="sm" variant="secondary" className="flex-1 text-xs" asChild>
            <Link href={`/listing/${listing.id}`}>View Listing</Link>
          </Button>
          <Button size="sm" className="flex-1 text-xs" asChild>
            <Link href={`/listing/${listing.id}#inquiry`}>Quick Inquiry</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
