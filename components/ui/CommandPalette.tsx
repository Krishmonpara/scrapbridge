'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search,
  ArrowRight,
  FileText,
  Building2,
  LayoutGrid,
  Star,
  TrendingUp,
  Package,
  Truck,
  Zap,
  Settings,
  MessageSquare,
  LayoutDashboard,
  PlusCircle,
  Hash,
} from 'lucide-react'
import { CATEGORY_LABELS, MaterialCategory } from '@/types'

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [MaterialCategory, string][]

interface SearchResult {
  listings: { id: string; title: string; materialCategory: string; city: string; state: string }[]
  companies: { id: string; name: string; slug: string; city: string; state: string }[]
}

interface QuickAction {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  href?: string
  action?: () => void
  group: string
  keywords?: string[]
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'browse-all',
    label: 'Browse All Listings',
    description: 'See everything on the marketplace',
    icon: LayoutGrid,
    href: '/browse',
    group: 'Navigate',
    keywords: ['listings', 'marketplace', 'all'],
  },
  {
    id: 'post-listing',
    label: 'Post a Listing',
    description: 'Sell or request scrap materials',
    icon: PlusCircle,
    href: '/post-listing',
    group: 'Actions',
    keywords: ['sell', 'create', 'new', 'add'],
  },
  {
    id: 'buy-requests',
    label: 'Buy Requests',
    description: 'Companies actively looking to buy',
    icon: TrendingUp,
    href: '/browse?type=BUY',
    group: 'Navigate',
    keywords: ['buy', 'wanted', 'request'],
  },
  {
    id: 'sell-listings',
    label: 'For Sale',
    description: 'Available scrap and surplus',
    icon: Package,
    href: '/browse?type=SELL',
    group: 'Navigate',
    keywords: ['sell', 'available', 'sale'],
  },
  {
    id: 'companies',
    label: 'Companies Directory',
    description: 'Browse verified scrap yards and traders',
    icon: Building2,
    href: '/companies',
    group: 'Navigate',
    keywords: ['companies', 'directory', 'yards'],
  },
  {
    id: 'rfq',
    label: 'Post an RFQ',
    description: 'Request a quote from multiple vendors',
    icon: FileText,
    href: '/rfq',
    group: 'Actions',
    keywords: ['rfq', 'quote', 'request'],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Your activity overview',
    icon: LayoutDashboard,
    href: '/dashboard',
    group: 'Account',
    keywords: ['dashboard', 'overview', 'home'],
  },
  {
    id: 'inquiries',
    label: 'Inquiries',
    description: 'Messages from buyers and sellers',
    icon: MessageSquare,
    href: '/inquiries',
    group: 'Account',
    keywords: ['messages', 'inbox', 'inquiries'],
  },
  {
    id: 'my-listings',
    label: 'My Listings',
    description: 'Manage your active listings',
    icon: FileText,
    href: '/my-listings',
    group: 'Account',
    keywords: ['my', 'listings', 'manage'],
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Account and company settings',
    icon: Settings,
    href: '/settings',
    group: 'Account',
    keywords: ['settings', 'account', 'profile'],
  },
]

// Category quick-navigations
const CATEGORY_ACTIONS: QuickAction[] = CATEGORIES.map(([cat, label]) => ({
  id: `cat-${cat}`,
  label: `${label}`,
  description: 'Browse category',
  icon: Hash,
  href: `/browse?category=${cat}`,
  group: 'Categories',
  keywords: [label.toLowerCase(), cat.toLowerCase()],
}))

const ALL_ACTIONS = [...QUICK_ACTIONS, ...CATEGORY_ACTIONS]

function filterActions(query: string): QuickAction[] {
  if (!query) return QUICK_ACTIONS.slice(0, 6)
  const q = query.toLowerCase()
  return ALL_ACTIONS.filter(
    (a) =>
      a.label.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.keywords?.some((k) => k.includes(q))
  ).slice(0, 8)
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = key(item)
      if (!acc[k]) acc[k] = []
      acc[k].push(item)
      return acc
    },
    {} as Record<string, T[]>
  )
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setSearchResults(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSearchResults(data)
      } catch {
        setSearchResults(null)
      } finally {
        setSearching(false)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const filteredActions = filterActions(query)

  // Build flat list of all selectable items for keyboard nav
  const allItems = [
    ...filteredActions,
    ...(searchResults?.listings.map((l) => ({
      id: `l-${l.id}`,
      label: l.title,
      description: `${l.city}, ${l.state}`,
      icon: FileText,
      href: `/listing/${l.id}`,
      group: 'Listings',
    })) ?? []),
    ...(searchResults?.companies.map((c) => ({
      id: `c-${c.id}`,
      label: c.name,
      description: `${c.city}, ${c.state}`,
      icon: Building2,
      href: `/company/${c.slug}`,
      group: 'Companies',
    })) ?? []),
  ]

  const handleSelect = useCallback(
    (item: (typeof allItems)[0]) => {
      if (item.href) {
        router.push(item.href)
        onClose()
      } else if ('action' in item && (item as any).action) {
        ;(item as any).action()
        onClose()
      }
    },
    [router, onClose]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, allItems.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const item = allItems[activeIndex]
        if (item) handleSelect(item)
      }
    },
    [allItems, activeIndex, handleSelect, onClose]
  )

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // Reset index when results change
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const actionGroups = groupBy(filteredActions, (a) => a.group)
  const hasLiveResults =
    searchResults && (searchResults.listings.length > 0 || searchResults.companies.length > 0)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-[12%] z-[101] mx-auto w-full max-w-xl px-4"
            onKeyDown={handleKeyDown}
          >
            <div
              className="overflow-hidden rounded-lg"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {/* Search input */}
              <div
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                {searching ? (
                  <div
                    className="w-4 h-4 rounded-full border-2 shrink-0 animate-spin"
                    style={{ borderColor: 'var(--foreground)', borderTopColor: 'transparent' }}
                  />
                ) : (
                  <Search size={16} className="text-[var(--muted-foreground)] shrink-0" />
                )}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search listings, companies, or navigate…"
                  className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
                  style={{ fontFamily: 'var(--font-sans)' }}
                />
                <kbd
                  className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded font-medium text-[var(--muted-foreground)]"
                  style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                >
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[420px] overflow-y-auto py-2">
                {/* Quick actions grouped */}
                {!hasLiveResults &&
                  Object.entries(actionGroups).map(([group, items]) => (
                    <div key={group} className="mb-1">
                      <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                        {group}
                      </p>
                      {items.map((item) => {
                        const idx = allItems.findIndex((a) => a.id === item.id)
                        const isActive = idx === activeIndex
                        const Icon = item.icon
                        return (
                          <button
                            key={item.id}
                            data-index={idx}
                            onClick={() => handleSelect(item as any)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                            style={{
                              background: isActive ? 'var(--muted)' : 'transparent',
                            }}
                          >
                            <div
                              className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                              style={{
                                background: isActive ? 'var(--foreground)' : 'var(--muted)',
                              }}
                            >
                              <Icon
                                size={13}
                                style={{ color: isActive ? 'var(--background)' : 'var(--muted-foreground)' }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium truncate"
                                style={{ color: isActive ? 'var(--foreground)' : 'var(--foreground)' }}
                              >
                                {item.label}
                              </p>
                              {item.description && (
                                <p className="text-xs truncate text-[var(--muted-foreground)]">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {isActive && (
                              <ArrowRight size={13} className="shrink-0 text-[var(--muted-foreground)]" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))}

                {/* Live search results */}
                {hasLiveResults && (
                  <>
                    {searchResults!.listings.length > 0 && (
                      <div className="mb-1">
                        <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                          Listings
                        </p>
                        {searchResults!.listings.map((l) => {
                          const idx = allItems.findIndex((a) => a.id === `l-${l.id}`)
                          const isActive = idx === activeIndex
                          return (
                            <button
                              key={l.id}
                              data-index={idx}
                              onClick={() => {
                                router.push(`/listing/${l.id}`)
                                onClose()
                              }}
                              onMouseEnter={() => setActiveIndex(idx)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                              style={{ background: isActive ? 'var(--muted)' : 'transparent' }}
                            >
                              <div
                                className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                                style={{ background: isActive ? 'var(--foreground)' : 'var(--muted)' }}
                              >
                                <FileText
                                  size={13}
                                  style={{ color: isActive ? 'var(--background)' : 'var(--muted-foreground)' }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--foreground)] truncate">
                                  {l.title}
                                </p>
                                <p className="text-xs text-[var(--muted-foreground)]">
                                  {l.materialCategory} · {l.city}, {l.state}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {searchResults!.companies.length > 0 && (
                      <div className="mb-1">
                        <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                          Companies
                        </p>
                        {searchResults!.companies.map((c) => {
                          const idx = allItems.findIndex((a) => a.id === `c-${c.id}`)
                          const isActive = idx === activeIndex
                          return (
                            <button
                              key={c.id}
                              data-index={idx}
                              onClick={() => {
                                router.push(`/company/${c.slug}`)
                                onClose()
                              }}
                              onMouseEnter={() => setActiveIndex(idx)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                              style={{ background: isActive ? 'var(--muted)' : 'transparent' }}
                            >
                              <div
                                className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                                style={{ background: isActive ? 'var(--foreground)' : 'var(--muted)' }}
                              >
                                <Building2
                                  size={13}
                                  style={{ color: isActive ? 'var(--background)' : 'var(--muted-foreground)' }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--foreground)] truncate">
                                  {c.name}
                                </p>
                                <p className="text-xs text-[var(--muted-foreground)]">
                                  {c.city}, {c.state}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Browse all results */}
                    <div style={{ borderTop: '1px solid var(--border)' }} className="px-4 py-2.5">
                      <button
                        onClick={() => {
                          router.push(`/browse?search=${encodeURIComponent(query)}`)
                          onClose()
                        }}
                        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <Search size={13} />
                        Browse all results for <span className="font-medium text-[var(--foreground)]">&ldquo;{query}&rdquo;</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </>
                )}

                {/* No results */}
                {query.length >= 2 && !searching && !hasLiveResults && filteredActions.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                    No results for &ldquo;{query}&rdquo;
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div
                className="flex items-center gap-4 px-4 py-2 text-[10px] text-[var(--muted-foreground)]"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <span className="flex items-center gap-1">
                  <kbd
                    className="px-1 py-0.5 rounded text-[9px]"
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    ↑↓
                  </kbd>{' '}
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd
                    className="px-1 py-0.5 rounded text-[9px]"
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    ↵
                  </kbd>{' '}
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd
                    className="px-1 py-0.5 rounded text-[9px]"
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    esc
                  </kbd>{' '}
                  close
                </span>
                <span className="ml-auto opacity-60">ScrapBridge Command</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
