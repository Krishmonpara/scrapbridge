'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { LayoutGrid, List, SlidersHorizontal, X, PackageSearch } from 'lucide-react'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { ListingFilters } from '@/components/listings/ListingFilters'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { LiveDot } from '@/components/ui/LiveDot'
import { ListingFilters as Filters, CATEGORY_LABELS, CONDITION_LABELS } from '@/types'

const POSTED_WITHIN_LABELS: Record<string, string> = {
  '24h': 'Last 24 hours',
  '7d':  'Last 7 days',
  '30d': 'Last 30 days',
}

export function BrowseClient() {
  const params = useSearchParams()
  const [listings, setListings] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [filters, setFilters] = useState<Filters>(() => ({
    search: params.get('search') ?? undefined,
    materialCategory: (params.get('category') as any) ?? undefined,
    listingType: (params.get('type') as any) ?? undefined,
    sortBy: 'newest',
  }))

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (filters.search) qs.set('search', filters.search)
      if (filters.materialCategory) qs.set('category', filters.materialCategory)
      if (filters.listingType) qs.set('type', filters.listingType)
      if (filters.state) qs.set('state', filters.state)
      if (filters.verifiedOnly) qs.set('verified', '1')
      if (filters.postedWithin) qs.set('within', filters.postedWithin)
      if (filters.sortBy) qs.set('sort', filters.sortBy)
      if (filters.condition?.length) qs.set('condition', filters.condition.join(','))

      const res = await fetch(`/api/listings?${qs}`)
      const data = await res.json()
      setListings(data.listings ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setListings([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const activeFilterCount =
    (filters.listingType ? 1 : 0) +
    (filters.materialCategory ? 1 : 0) +
    (filters.state ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.postedWithin ? 1 : 0) +
    (filters.condition?.length ?? 0)

  return (
    <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div
        className="sticky top-16 z-30 flex items-center gap-4 px-6 py-3"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-1.5 h-8 px-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded border border-[var(--border)] hover:border-[var(--border-accent)] transition-colors"
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span
              className="w-4 h-4 rounded-full text-xs flex items-center justify-center text-white"
              style={{ background: 'var(--accent)' }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        <span className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          {!loading && <LiveDot size={5} />}
          <span className="tabular-nums">{loading ? '…' : `${total.toLocaleString()} live`}</span>
        </span>

        {/* Active filter chips */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {filters.listingType && (
            <Badge
              variant="amber"
              className="shrink-0 cursor-pointer"
              onClick={() => setFilters((f) => ({ ...f, listingType: undefined }))}
            >
              {filters.listingType} <X size={10} />
            </Badge>
          )}
          {filters.materialCategory && (
            <Badge
              variant="amber"
              className="shrink-0 cursor-pointer"
              onClick={() => setFilters((f) => ({ ...f, materialCategory: undefined }))}
            >
              {CATEGORY_LABELS[filters.materialCategory]} <X size={10} />
            </Badge>
          )}
          {filters.state && (
            <Badge
              variant="amber"
              className="shrink-0 cursor-pointer"
              onClick={() => setFilters((f) => ({ ...f, state: undefined }))}
            >
              {filters.state} <X size={10} />
            </Badge>
          )}
          {filters.verifiedOnly && (
            <Badge
              variant="success"
              className="shrink-0 cursor-pointer"
              onClick={() => setFilters((f) => ({ ...f, verifiedOnly: undefined }))}
            >
              Verified Only <X size={10} />
            </Badge>
          )}
          {filters.condition?.map((cond) => (
            <Badge
              key={cond}
              variant="default"
              className="shrink-0 cursor-pointer"
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  condition: f.condition?.filter((c) => c !== cond) || undefined,
                }))
              }
            >
              {CONDITION_LABELS[cond as keyof typeof CONDITION_LABELS]} <X size={10} />
            </Badge>
          ))}
          {filters.postedWithin && (
            <Badge
              variant="iron"
              className="shrink-0 cursor-pointer"
              onClick={() => setFilters((f) => ({ ...f, postedWithin: undefined }))}
            >
              {POSTED_WITHIN_LABELS[filters.postedWithin] ?? filters.postedWithin} <X size={10} />
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <select
            value={filters.sortBy ?? 'newest'}
            onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as any }))}
            className="h-8 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs rounded-sm px-2 focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="most_inquiries">Most Inquiries</option>
            <option value="expiring_soon">Expiring Soon</option>
          </select>

          <button
            onClick={() => setViewMode('grid')}
            className="w-8 h-8 flex items-center justify-center rounded border transition-colors"
            style={{
              borderColor: viewMode === 'grid' ? 'var(--accent)' : 'var(--border)',
              color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="w-8 h-8 flex items-center justify-center rounded border transition-colors"
            style={{
              borderColor: viewMode === 'list' ? 'var(--accent)' : 'var(--border)',
              color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-0 px-6 py-6 max-w-screen-2xl mx-auto">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="mr-6 shrink-0" style={{ width: 280 }}>
            <ListingFilters filters={filters} onChange={setFilters} resultCount={total} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-80 rounded skeleton" />
              ))}
            </div>
          ) : viewMode === 'list' ? (
            <ListingListView listings={listings} />
          ) : (
            <ListingGrid listings={listings} />
          )}
        </div>
      </div>
    </div>
  )
}

function ListingListView({ listings }: { listings: any[] }) {
  if (listings.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No listings found"
        description="Nothing matched these filters. Try clearing a filter or broadening the search term."
      />
    )
  }

  return (
    <div className="rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div
        className="grid text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] px-4 py-2"
        style={{
          gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span>Title / Company</span>
        <span>Category</span>
        <span>Quantity</span>
        <span>Price</span>
        <span>Location</span>
      </div>
      {listings.map((l, i) => (
        <div
          key={l.id}
          className="grid items-center px-4 py-3 text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
          style={{
            gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr',
            background: i % 2 === 0 ? 'var(--bg-secondary)' : 'rgba(26,35,50,0.4)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <a
              href={`/listing/${l.id}`}
              className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors font-medium"
            >
              {l.title}
            </a>
            <p className="text-xs text-[var(--text-tertiary)]">{l.company?.name}</p>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">
            {CATEGORY_LABELS[l.materialCategory as keyof typeof CATEGORY_LABELS]}
          </span>
          <span
            className="text-xs"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            {l.quantity} {l.unit}
          </span>
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}
          >
            {l.pricePerUnit ? `$${l.pricePerUnit}` : 'RFQ'}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {l.city}, {l.state}
          </span>
        </div>
      ))}
    </div>
  )
}
