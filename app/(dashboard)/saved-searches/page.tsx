'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navigation/Navbar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Bookmark, Bell, Trash2, Plus, Search } from 'lucide-react'
import { CATEGORY_LABELS, MaterialCategory } from '@/types'

interface SavedSearch {
  id: string
  name: string
  category?: MaterialCategory
  search?: string
  state?: string
  alertEnabled: boolean
  createdAt: string
}

// Demo saved searches — in production these come from the DB
const DEMO_SEARCHES: SavedSearch[] = [
  { id: '1', name: 'HMS Steel in Midwest', category: 'FERROUS_METALS', search: 'HMS', state: 'IL', alertEnabled: true, createdAt: '2025-06-01' },
  { id: '2', name: 'Copper Wire — Any Location', category: 'NON_FERROUS_METALS', search: 'copper wire', alertEnabled: true, createdAt: '2025-05-28' },
  { id: '3', name: 'Diesel Engines', category: 'ENGINES_DRIVETRAIN', alertEnabled: false, createdAt: '2025-05-20' },
]

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>(DEMO_SEARCHES)

  const toggleAlert = (id: string) => {
    setSearches((s) => s.map((search) =>
      search.id === id ? { ...search, alertEnabled: !search.alertEnabled } : search
    ))
  }

  const remove = (id: string) => {
    setSearches((s) => s.filter((search) => search.id !== id))
  }

  const buildSearchUrl = (s: SavedSearch) => {
    const params = new URLSearchParams()
    if (s.search) params.set('search', s.search)
    if (s.category) params.set('category', s.category)
    if (s.state) params.set('state', s.state)
    return `/browse?${params.toString()}`
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-screen-md mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Bookmark size={20} className="text-[var(--accent)]" />
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Saved Searches</h1>
            </div>
            <Button asChild variant="secondary">
              <Link href="/browse">
                <Search size={14} /> Browse to Save
              </Link>
            </Button>
          </div>

          {searches.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No saved searches yet"
              description="When you save a search from the browse page, it lives here. Enable alerts to get notified the moment new matches go live."
              action={
                <Button asChild>
                  <Link href="/browse"><Plus size={14} /> Browse Listings</Link>
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {searches.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 p-4 rounded"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link
                        href={buildSearchUrl(s)}
                        className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                      >
                        {s.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.category && (
                        <Badge variant="default">{CATEGORY_LABELS[s.category]}</Badge>
                      )}
                      {s.search && (
                        <Badge variant="default">
                          <Search size={9} /> &ldquo;{s.search}&rdquo;
                        </Badge>
                      )}
                      {s.state && (
                        <Badge variant="default">{s.state}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleAlert(s.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors"
                      style={{
                        background: s.alertEnabled ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                        color: s.alertEnabled ? 'var(--accent)' : 'var(--text-tertiary)',
                        border: `1px solid ${s.alertEnabled ? 'var(--accent)' : 'var(--border)'}`,
                      }}
                    >
                      <Bell size={11} />
                      {s.alertEnabled ? 'Alerts on' : 'Alerts off'}
                    </button>
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={buildSearchUrl(s)}>View</Link>
                    </Button>
                    <button
                      onClick={() => remove(s.id)}
                      className="w-7 h-7 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[#c43a3a] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
