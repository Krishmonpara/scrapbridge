'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  User,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/shared/MaterialIcon'
import { CATEGORY_LABELS, MaterialCategory } from '@/types'

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [MaterialCategory, string][]

const MEGA_MENU_COLS = [
  CATEGORIES.slice(0, 4),
  CATEGORIES.slice(4, 8),
  CATEGORIES.slice(8, 11),
  CATEGORIES.slice(11, 14),
]

interface SearchResult {
  listings: { id: string; title: string; materialCategory: string; city: string; state: string }[]
  companies: { id: string; name: string; slug: string; city: string; state: string }[]
}

export function Navbar() {
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult>({ listings: [], companies: [] })
  const [searching, setSearching] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults({ listings: [], companies: [] })
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data)
    } catch {
      setSearchResults({ listings: [], companies: [] })
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 250)
    return () => clearTimeout(timer)
  }, [searchQuery, doSearch])

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/browse?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const hasResults = searchResults.listings.length > 0 || searchResults.companies.length > 0

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 gap-4 backdrop-blur-xl"
        style={{
          background: 'rgba(10,14,20,0.72)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 4px 20px -8px rgba(0,0,0,0.4)',
        }}
      >
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2.5 shrink-0">
          <span
            className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm"
            style={{ background: 'var(--foreground)', color: 'var(--background)' }}
          >
            SB
          </span>
          <span className="hidden sm:block font-semibold text-[var(--text-primary)] tracking-tight">
            ScrapBridge
          </span>
        </Link>

        {/* Center nav */}
        <div className="hidden lg:flex items-center gap-1 flex-1">
          {/* Mega menu */}
          <div
            className="relative"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
          >
            <button
              className="flex items-center gap-1.5 h-8 px-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150 rounded"
              style={{ background: megaOpen ? 'var(--bg-tertiary)' : 'transparent' }}
            >
              Browse Materials
              <ChevronDown
                size={14}
                className="transition-transform duration-150"
                style={{ transform: megaOpen ? 'rotate(180deg)' : 'rotate(0)' }}
              />
            </button>

            <AnimatePresence>
              {megaOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1 w-[720px] p-4 rounded"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  }}
                >
                  <div className="grid grid-cols-4 gap-4">
                    {MEGA_MENU_COLS.map((col, ci) => (
                      <div key={ci} className="flex flex-col gap-1">
                        {col.map(([cat, label]) => (
                          <Link
                            key={cat}
                            href={`/browse?category=${cat}`}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors duration-150"
                          >
                            <span className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">
                              <MaterialIcon category={cat} size={14} />
                            </span>
                            {label}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-3 pt-3 flex items-center justify-between"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <span className="text-xs text-[var(--text-tertiary)]">
                      50,000+ active listings across 14 categories
                    </span>
                    <Link href="/browse" className="text-xs text-[var(--accent)] hover:underline">
                      View all listings →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/browse?type=BUY"
            className="h-8 px-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150 flex items-center rounded hover:bg-[var(--bg-tertiary)]"
          >
            Buy Requests
          </Link>
          <Link
            href="/companies"
            className="h-8 px-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150 flex items-center rounded hover:bg-[var(--bg-tertiary)]"
          >
            Companies
          </Link>
          <Link
            href="/rfq"
            className="h-8 px-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150 flex items-center rounded hover:bg-[var(--bg-tertiary)]"
          >
            Post RFQ
          </Link>
        </div>

        {/* Right */}
        <div className="hidden lg:flex items-center gap-2 ml-auto">
          {/* Search */}
          <div ref={searchRef} className="relative">
            <button
              className="flex items-center gap-2 h-8 px-3 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors duration-150"
              onClick={() => setSearchOpen((o) => !o)}
              title="Search (⌘K)"
            >
              <Search size={14} />
              <span className="hidden xl:flex items-center gap-1 text-xs">
                <span>Search</span>
                <kbd
                  className="px-1.5 py-0.5 text-[10px] rounded font-medium"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                >
                  ⌘K
                </kbd>
              </span>
            </button>

            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-96 rounded overflow-hidden"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', boxShadow: '0 16px 32px rgba(0,0,0,0.4)' }}
                >
                  <form onSubmit={handleSearchSubmit}>
                    <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <Search size={14} className="text-[var(--text-tertiary)] shrink-0" />
                      <input
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search listings, companies, grades…"
                        className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
                      />
                      {searching && (
                        <div className="w-3 h-3 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin shrink-0" />
                      )}
                    </div>
                  </form>

                  {hasResults ? (
                    <div className="py-2 max-h-80 overflow-y-auto">
                      {searchResults.listings.length > 0 && (
                        <>
                          <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                            Listings
                          </p>
                          {searchResults.listings.map((l) => (
                            <Link
                              key={l.id}
                              href={`/listing/${l.id}`}
                              onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-tertiary)] transition-colors"
                            >
                              <FileText size={13} className="text-[var(--text-tertiary)] shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[var(--text-primary)] truncate">{l.title}</p>
                                <p className="text-xs text-[var(--text-tertiary)]">{l.city}, {l.state}</p>
                              </div>
                            </Link>
                          ))}
                        </>
                      )}
                      {searchResults.companies.length > 0 && (
                        <>
                          <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mt-1">
                            Companies
                          </p>
                          {searchResults.companies.map((c) => (
                            <Link
                              key={c.id}
                              href={`/company/${c.slug}`}
                              onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-tertiary)] transition-colors"
                            >
                              <Building2 size={13} className="text-[var(--text-tertiary)] shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[var(--text-primary)] truncate">{c.name}</p>
                                <p className="text-xs text-[var(--text-tertiary)]">{c.city}, {c.state}</p>
                              </div>
                            </Link>
                          ))}
                        </>
                      )}
                      <div
                        className="px-3 py-2 mt-1"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <button
                          onClick={handleSearchSubmit as any}
                          className="text-xs text-[var(--accent)] hover:underline"
                        >
                          Search all results for &ldquo;{searchQuery}&rdquo; →
                        </button>
                      </div>
                    </div>
                  ) : searchQuery.length >= 2 && !searching ? (
                    <div className="px-3 py-6 text-center text-sm text-[var(--text-tertiary)]">
                      No results for &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : searchQuery.length < 2 ? (
                    <div className="px-3 py-4">
                      <p className="text-xs text-[var(--text-tertiary)] mb-2">Quick links</p>
                      <div className="flex flex-col gap-1">
                        {[
                          { href: '/browse', label: 'All Listings' },
                          { href: '/browse?type=SELL', label: 'For Sale' },
                          { href: '/browse?type=BUY', label: 'Buy Requests' },
                          { href: '/companies', label: 'Companies' },
                        ].map(({ href, label }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setSearchOpen(false)}
                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors py-1"
                          >
                            {label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors duration-150 relative"
            title="Notifications"
          >
            <Bell size={16} />
          </button>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

          {/* User menu — shows Sign In + Post Listing since we're not hydrating session client-side */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <User size={16} />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-52 rounded overflow-hidden py-1"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', boxShadow: '0 16px 32px rgba(0,0,0,0.4)' }}
                >
                  {[
                    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { href: '/my-listings', label: 'My Listings', icon: FileText },
                    { href: '/inquiries', label: 'Inquiries', icon: MessageSquare },
                    { href: '/settings', label: 'Settings', icon: Settings },
                  ].map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <Icon size={14} className="text-[var(--text-tertiary)]" />
                      {label}
                    </Link>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                  <Link
                    href="/login"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <LogOut size={14} className="text-[var(--text-tertiary)]" />
                    Sign In
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button size="sm" asChild>
            <Link href="/post-listing">Post a Listing</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="ml-auto lg:hidden w-8 h-8 flex items-center justify-center text-[var(--text-secondary)]"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>
      </nav>

      {/* Mobile nav overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-80 p-6 overflow-y-auto"
              style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-[var(--text-primary)]">ScrapBridge</span>
                <button onClick={() => setMobileOpen(false)}>
                  <X size={20} className="text-[var(--text-tertiary)]" />
                </button>
              </div>

              {/* Mobile search */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (searchQuery.trim()) {
                    router.push(`/browse?search=${encodeURIComponent(searchQuery.trim())}`)
                    setMobileOpen(false)
                  }
                }}
                className="mb-4"
              >
                <div
                  className="flex items-center gap-2 px-3 h-9 rounded-sm"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                >
                  <Search size={14} className="text-[var(--text-tertiary)] shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search listings…"
                    className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
                  />
                </div>
              </form>

              <div className="flex flex-col gap-0.5 mb-4">
                <Link href="/browse" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors">All Listings</Link>
                <Link href="/browse?type=BUY" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors">Buy Requests</Link>
                <Link href="/companies" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors">Companies</Link>
                <Link href="/rfq" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors">Post RFQ</Link>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] px-3 mb-2">Categories</p>
              <div className="flex flex-col gap-0.5">
                {CATEGORIES.map(([cat, label]) => (
                  <Link
                    key={cat}
                    href={`/browse?category=${cat}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <span className="text-[var(--accent)]">
                      <MaterialIcon category={cat} size={14} />
                    </span>
                    {label}
                  </Link>
                ))}
              </div>

              <div className="mt-6 pt-6 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" className="w-full">Dashboard</Button>
                </Link>
                <Link href="/post-listing" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Post a Listing</Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
