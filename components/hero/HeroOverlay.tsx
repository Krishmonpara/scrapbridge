'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'

const QUICK_FILTERS = [
  'HMS Steel', 'Copper Wire', 'Diesel Engines', 'Pressure Vessels',
  'Aluminum', 'Motors', 'Pipe', 'Tanks',
]

/**
 * HeroOverlay — the search + headline layer rendered over the animation frame.
 * Used by HeroSection. Can also be composed independently over any full-bleed
 * background (e.g. the RefineryExplosion canvas component when that ships).
 */
export function HeroOverlay() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (q: string) => {
    router.push(`/browse?search=${encodeURIComponent(q || query)}`)
  }

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center gap-6 max-w-4xl mx-auto"
      >
        <span
          className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm"
          style={{
            color: 'var(--accent)',
            background: 'var(--accent-glow)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          The World&apos;s Industrial Scrap Marketplace
        </span>

        <h1 className="font-bold leading-tight" style={{ fontSize: 'clamp(40px, 6vw, 72px)' }}>
          <span className="text-[var(--text-primary)]">Every Part Has Value.</span>
          <br />
          <span style={{ color: 'var(--accent)' }}>Find. List. Trade.</span>
        </h1>

        <p
          className="max-w-2xl leading-relaxed"
          style={{ color: 'var(--text-secondary)', fontSize: 'clamp(16px, 2vw, 20px)' }}
        >
          Connecting scrap yards, demolition firms, ship breakers and manufacturers
          across North America. No middlemen. No hidden fees.
        </p>

        {/* Search */}
        <div className="w-full max-w-2xl flex flex-col gap-3">
          <div
            className="flex items-center w-full overflow-hidden"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-accent)',
              borderRadius: 4,
              boxShadow: '0 0 40px rgba(255,255,255,0.08)',
            }}
          >
            <Search size={18} className="ml-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Search by material, grade, equipment type or location..."
              className="flex-1 h-12 px-3 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none"
            />
            <button
              onClick={() => handleSearch(query)}
              className="h-12 px-6 text-sm font-semibold text-white shrink-0 transition-colors"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-center">
            <span className="text-xs text-[var(--text-tertiary)]">Quick search:</span>
            {QUICK_FILTERS.map((label) => (
              <button
                key={label}
                onClick={() => handleSearch(label.toLowerCase())}
                className="text-xs px-3 py-1.5 rounded-sm border transition-all duration-150"
                style={{ background: 'rgba(30,45,61,0.6)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/browse">Browse All Listings <ArrowRight size={16} /></Link>
          </Button>
          <Button size="lg" asChild>
            <Link href="/post-listing">Post Free Listing</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
