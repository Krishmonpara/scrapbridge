export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PriceTag } from '@/components/ui/PriceTag'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { LocationPin } from '@/components/shared/LocationPin'
import { FreshnessTag } from '@/components/shared/FreshnessTag'
import { FairPriceBadge } from '@/components/shared/FairPriceBadge'
import { MaterialIcon } from '@/components/shared/MaterialIcon'
import { InquiryForm } from '@/components/forms/InquiryForm'
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  UNIT_LABELS,
  BUSINESS_TYPE_LABELS,
} from '@/types'
import { formatNumber, formatDate } from '@/lib/utils'
import { getMaterialImages } from '@/lib/materialImages'
import { ListingPhotoGallery } from '@/components/listings/ListingPhotoGallery'
import { RelatedListingsCarousel } from '@/components/listings/RelatedListingsCarousel'
import { Package, Truck, Phone, Globe, Star, MessageSquare } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const listing = await prisma.listing.findUnique({ where: { id }, select: { title: true } })
    return { title: listing ? `${listing.title} — ScrapBridge` : 'Listing Not Found' }
  } catch {
    return { title: 'Listing — ScrapBridge' }
  }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let listing: Awaited<ReturnType<typeof prisma.listing.findUnique>> & { company: any } | null = null
  try {
    listing = await prisma.listing.findUnique({
      where: { id },
      include: { company: true },
    }) as any
  } catch {
    notFound()
  }

  if (!listing) notFound()

  let relatedListings: any[] = []
  let companyOtherListings: any[] = []
  try {
    ;[relatedListings, companyOtherListings] = await Promise.all([
      prisma.listing.findMany({
        where: {
          materialCategory: listing!.materialCategory,
          status: 'ACTIVE',
          id: { not: listing!.id },
        },
        include: { company: { select: { name: true, verificationStatus: true, slug: true } } },
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.listing.findMany({
        where: { companyId: listing!.companyId, status: 'ACTIVE', id: { not: listing!.id } },
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
    ])
  } catch {
    // DB unavailable — skip related listings, render page with empty sets
  }

  const specs = [
    { label: 'Material Category', value: CATEGORY_LABELS[listing.materialCategory] },
    { label: 'Subcategory', value: listing.materialSubcategory },
    { label: 'Grade', value: listing.grade },
    { label: 'Condition', value: CONDITION_LABELS[listing.condition] },
    { label: 'Quantity Available', value: `${formatNumber(listing.quantity)} ${UNIT_LABELS[listing.unit]}` },
    { label: 'Minimum Order', value: listing.minOrder ? `${formatNumber(listing.minOrder)} ${UNIT_LABELS[listing.unit]}` : null },
    { label: 'Price Per Unit', value: listing.pricePerUnit ? `$${listing.pricePerUnit} / ${UNIT_LABELS[listing.unit]}` : 'Price on Request' },
    { label: 'Negotiable', value: listing.negotiable ? 'Yes' : 'No' },
    { label: 'Pickup Available', value: listing.pickupAvailable ? 'Yes' : 'No' },
    { label: 'Delivery Available', value: listing.deliveryAvailable ? 'Yes' : 'No' },
    { label: 'Listed Date', value: formatDate(listing.createdAt) },
    { label: 'Expires', value: listing.expiresAt ? formatDate(listing.expiresAt) : 'No expiry' },
    { label: 'Listing ID', value: listing.id },
  ]

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {/* Breadcrumb */}
        <div
          className="px-6 py-3 text-xs flex items-center gap-2"
          style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
        >
          <Link href="/home" className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors">Home</Link>
          <span className="text-[var(--border-accent)]">/</span>
          <Link href="/browse" className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors">Browse</Link>
          <span className="text-[var(--border-accent)]">/</span>
          <Link href={`/browse?category=${listing.materialCategory}`} className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors">
            {CATEGORY_LABELS[listing.materialCategory]}
          </Link>
          <span className="text-[var(--border-accent)]">/</span>
          <span className="text-[var(--text-secondary)] truncate max-w-xs">{listing.title}</span>
        </div>

        <div className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="flex gap-8 flex-col lg:flex-row">
            {/* Left column — 2/3 */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={listing.listingType === 'SELL' ? 'amber' : listing.listingType === 'BUY' ? 'steel' : 'default'}>
                    {listing.listingType}
                  </Badge>
                  <Badge variant={listing.condition === 'COMPLETE' ? 'success' : listing.condition === 'DAMAGED' ? 'danger' : 'default'}>
                    {CONDITION_LABELS[listing.condition]}
                  </Badge>
                  <FreshnessTag date={listing.createdAt} />
                  <FairPriceBadge listing={listing} />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{listing.title}</h1>
                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                  <LocationPin city={listing.city} state={listing.state} />
                  <span>·</span>
                  <span>{listing.viewCount} views</span>
                  <span>·</span>
                  <span>{listing.inquiryCount} inquiries</span>
                </div>
              </div>

              {/* Photo gallery */}
              <ListingPhotoGallery
                photos={
                  listing.photos?.length
                    ? listing.photos
                    : getMaterialImages(listing.materialCategory, listing.id, 4)
                }
                alt={listing.title}
              />


              {/* Specifications table */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                  Material Specifications
                </h2>
                <div className="rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  {specs.filter(s => s.value != null).map(({ label, value }, i) => (
                    <div
                      key={label}
                      className="flex items-center px-4 py-2.5 text-sm"
                      style={{
                        background: i % 2 === 0 ? 'var(--bg-secondary)' : 'transparent',
                        borderBottom: i < specs.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <span className="w-48 shrink-0 text-[var(--text-tertiary)]">{label}</span>
                      <span className="text-[var(--text-primary)] font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              {listing.description && (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                    Description
                  </h2>
                  <div
                    className="p-4 rounded text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                  >
                    {listing.description}
                  </div>
                </div>
              )}

              {/* Specs */}
              {listing.specs && (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                    Technical Specs
                  </h2>
                  <div
                    className="p-4 rounded text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-mono"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {listing.specs}
                  </div>
                </div>
              )}

              {/* Related listings carousel */}
              <RelatedListingsCarousel listings={relatedListings} />
            </div>

            {/* Right column — 1/3, sticky */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="sticky top-24 flex flex-col gap-4">
                {/* Company card */}
                <div
                  className="p-4 rounded flex flex-col gap-3"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded flex items-center justify-center shrink-0 text-[var(--accent)] font-bold text-lg"
                      style={{ background: 'var(--bg-tertiary)' }}
                    >
                      {listing.company.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/company/${listing.company.slug}`}
                          className="font-semibold text-sm text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                        >
                          {listing.company.name}
                        </Link>
                        <VerifiedBadge status={listing.company.verificationStatus} showLabel />
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">{BUSINESS_TYPE_LABELS[listing.company.businessType as keyof typeof BUSINESS_TYPE_LABELS]}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2">
                      <Star size={11} className="text-[var(--accent)]" />
                      <span>{listing.company.rating.toFixed(1)} ({listing.company.reviewCount} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LocationPin city={listing.company.city} state={listing.company.state} />
                    </div>
                    <div className="text-[var(--text-tertiary)]">
                      Member since {formatDate(listing.company.memberSince)}
                    </div>
                  </div>

                  {listing.company.phone && (
                    <a
                      href={`tel:${listing.company.phone}`}
                      className="flex items-center gap-2 text-sm text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                    >
                      <Phone size={14} />
                      {listing.company.phone}
                    </a>
                  )}

                  {listing.company.website && (
                    <a
                      href={listing.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[var(--steel-blue)] hover:underline"
                    >
                      <Globe size={12} />
                      {listing.company.website}
                    </a>
                  )}
                </div>

                {/* Price + Inquiry */}
                <div
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

                  <div className="flex items-center gap-2">
                    {listing.pickupAvailable && (
                      <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                        <Package size={12} /> Pickup
                      </span>
                    )}
                    {listing.deliveryAvailable && (
                      <span className="flex items-center gap-1 text-xs text-[#2dba6e]">
                        <Truck size={12} /> Delivery avail.
                      </span>
                    )}
                  </div>

                  {/* Inquiry form */}
                  <div id="inquiry" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3 flex items-center gap-1.5">
                      <MessageSquare size={12} /> Send Inquiry
                    </p>
                    <InquiryForm listingId={listing.id} toCompanyId={listing.companyId} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
