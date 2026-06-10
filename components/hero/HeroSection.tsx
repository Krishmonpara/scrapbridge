'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const QUICK_FILTERS = [
  { label: 'HMS Steel', query: 'HMS steel' },
  { label: 'Copper Wire', query: 'copper wire' },
  { label: 'Diesel Engines', query: 'diesel engine' },
  { label: 'Pressure Vessels', query: 'pressure vessel' },
  { label: 'Aluminum', query: 'aluminum' },
  { label: 'Motors', query: 'electric motor' },
  { label: 'Pipe', query: 'pipe' },
  { label: 'Tanks', query: 'tank' },
]

export function HeroSection() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (q: string) => {
    router.push(`/browse?search=${encodeURIComponent(q || query)}`)
  }

  return (
    <section className="relative w-full" style={{ minHeight: '100vh' }}>
      {/* ============================================
          EXPLOSION ANIMATION INJECTION POINT
          ============================================
          This div is reserved for the 240-frame
          industrial refinery explosion animation.
          When frames are ready, replace this div
          with the <RefineryExplosion /> component
          which will be built separately.
          The component accepts:
          - frames: string[] (array of image URLs)
          - fps: number (default 24)
          - loop: boolean (default true)
          - mode: 'explode' | 'assemble' | 'both'
          ============================================ */}
      <div
        id="hero-animation-container"
        className="absolute inset-0 w-full h-full"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div
          id="animation-frame"
          className="absolute inset-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 20% 80%, rgba(30,111,165,0.06) 0%, transparent 50%),
              linear-gradient(180deg, #0a0e14 0%, #0d1420 50%, #0a0e14 100%)
            `,
          }}
        >
          {/* Atmospheric grid lines */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(var(--border-accent) 1px, transparent 1px),
                linear-gradient(90deg, var(--border-accent) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
          {/* Pulsing ambient accent */}
          <div className="absolute inset-0 pointer-events-none ambient-pulse" />
          {/* Floating spark particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${2 + (i % 3)}px`,
                  height: `${2 + (i % 3)}px`,
                  left: `${(i * 8.3) % 100}%`,
                  top: `${(i * 13.7) % 100}%`,
                  background: 'rgba(255,255,255,0.6)',
                  opacity: 0.15,
                  animation: `float ${10 + (i % 5) * 2}s ease-in-out ${i * 0.4}s infinite`,
                  boxShadow: '0 0 6px rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dark gradient overlay at bottom for text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(10,14,20,0.5) 60%, rgba(10,14,20,0.9) 100%)',
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-16">
        <div className="animate-hero flex flex-col items-center gap-6 max-w-4xl mx-auto">
          {/* Label */}
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

          {/* Headline */}
          <h1 className="font-bold leading-tight" style={{ fontSize: 'clamp(40px, 6vw, 72px)' }}>
            <span className="text-[var(--text-primary)]">Every Part Has Value.</span>
            <br />
            <span style={{ color: 'var(--accent)' }}>Find. List. Trade.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg max-w-2xl leading-relaxed"
            style={{ color: 'var(--text-secondary)', fontSize: 'clamp(16px, 2vw, 20px)' }}
          >
            Connecting scrap yards, demolition firms, ship breakers and manufacturers
            across North America. No middlemen. No hidden fees.
          </p>

          {/* Search bar */}
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
                className="h-12 px-6 text-sm font-semibold shrink-0 cursor-pointer active:scale-[0.98] transition-all duration-150"
                style={{ background: 'var(--foreground)', color: 'var(--background)' }}
              >
                Search
              </button>
            </div>

            {/* Quick filter chips */}
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <span className="text-xs text-[var(--text-tertiary)]">Quick search:</span>
              {QUICK_FILTERS.map(({ label, query: q }) => (
                <button
                  key={label}
                  onClick={() => handleSearch(q)}
                  className="text-xs px-3 py-1.5 rounded-sm border cursor-pointer bg-[rgba(30,45,61,0.6)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-glow)] hover:-translate-y-0.5 transition-all duration-150"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/browse">
                Browse All Listings <ArrowRight size={16} />
              </Link>
            </Button>
            <Button size="lg" asChild>
              <Link href="/post-listing">Post Free Listing</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
