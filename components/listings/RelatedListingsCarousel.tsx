'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { FreshnessTag } from '@/components/shared/FreshnessTag'
import { MaterialIcon } from '@/components/shared/MaterialIcon'
import { CATEGORY_LABELS, UNIT_LABELS } from '@/types'
import { getMaterialImage } from '@/lib/materialImages'
import { ImageWithShimmer } from '@/components/ui/ImageWithShimmer'

type RelatedListing = {
  id: string
  title: string
  materialCategory: string
  listingType: 'SELL' | 'BUY' | 'WANTED' | 'AUCTION'
  pricePerUnit?: number | null
  unit: string
  city: string
  state: string
  createdAt: Date
  company: {
    name: string
    verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
    slug: string
  }
}

const TYPE_VARIANT: Record<string, 'amber' | 'steel' | 'copper' | 'danger'> = {
  SELL: 'amber',
  BUY: 'steel',
  WANTED: 'copper',
  AUCTION: 'danger',
}

interface RelatedListingsCarouselProps {
  listings: RelatedListing[]
  title?: string
}

const CARD_W = 220
const GAP = 12

export function RelatedListingsCarousel({
  listings,
  title = 'Similar Listings',
}: RelatedListingsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const syncScrollState = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    syncScrollState()
    el.addEventListener('scroll', syncScrollState, { passive: true })
    const ro = new ResizeObserver(syncScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', syncScrollState)
      ro.disconnect()
    }
  }, [syncScrollState])

  const scroll = (dir: 'left' | 'right') => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'right' ? CARD_W + GAP : -(CARD_W + GAP), behavior: 'smooth' })
  }

  if (listings.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          {title}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-7 h-7 flex items-center justify-center rounded border transition-all duration-150"
            style={{
              borderColor: canScrollLeft ? 'var(--border-accent)' : 'var(--border)',
              color: canScrollLeft ? 'var(--text-primary)' : 'var(--text-tertiary)',
              background: 'var(--bg-secondary)',
              opacity: canScrollLeft ? 1 : 0.4,
            }}
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-7 h-7 flex items-center justify-center rounded border transition-all duration-150"
            style={{
              borderColor: canScrollRight ? 'var(--border-accent)' : 'var(--border)',
              color: canScrollRight ? 'var(--text-primary)' : 'var(--text-tertiary)',
              background: 'var(--bg-secondary)',
              opacity: canScrollRight ? 1 : 0.4,
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Fade mask on right edge when scrollable */}
      <div className="relative">
        {canScrollRight && (
          <div
            className="absolute right-0 top-0 bottom-2 w-16 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, transparent, var(--bg-primary))' }}
          />
        )}
        {canScrollLeft && (
          <div
            className="absolute left-0 top-0 bottom-2 w-10 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, transparent, var(--bg-primary))' }}
          />
        )}

        <div
          ref={trackRef}
          className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
          style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {listings.map((rel) => (
            <Link
              key={rel.id}
              href={`/listing/${rel.id}`}
              className="group shrink-0 flex flex-col rounded overflow-hidden border border-[var(--border)] hover:border-[var(--accent)]/40 transition-[border-color,box-shadow] duration-200 hover:shadow-[0_6px_20px_-8px_rgba(255,255,255,0.2)]"
              style={{ width: CARD_W, scrollSnapAlign: 'start', background: 'var(--bg-secondary)' }}
            >
              {/* Image strip */}
              <div className="relative h-24 overflow-hidden bg-[var(--bg-tertiary)]">
                <ImageWithShimmer
                  src={getMaterialImage(rel.materialCategory, rel.id)}
                  alt={rel.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  fallbackIcon={<MaterialIcon category={rel.materialCategory as any} size={32} />}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute top-1.5 left-1.5">
                  <Badge variant={TYPE_VARIANT[rel.listingType] ?? 'default'}>
                    {rel.listingType}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1.5 p-2.5 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] leading-none">
                  {CATEGORY_LABELS[rel.materialCategory as keyof typeof CATEGORY_LABELS]}
                </p>
                <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-tight group-hover:text-[var(--accent)] transition-colors duration-150">
                  {rel.title}
                </p>

                {rel.pricePerUnit ? (
                  <p
                    className="text-sm font-bold mt-auto"
                    style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
                  >
                    ${rel.pricePerUnit}
                    <span className="text-xs font-normal text-[var(--text-tertiary)]">
                      /{UNIT_LABELS[rel.unit as keyof typeof UNIT_LABELS]}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-[var(--text-tertiary)] italic mt-auto">Price on request</p>
                )}

                <div
                  className="flex items-center justify-between pt-1.5"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[120px]">
                    {rel.city}, {rel.state}
                  </span>
                  <FreshnessTag date={rel.createdAt} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
