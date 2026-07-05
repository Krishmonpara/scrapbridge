import Link from 'next/link'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'
import { HeroSection } from '@/components/hero/HeroSection'
import { StatsStrip } from '@/components/home/StatsStrip'
import { MarketTicker } from '@/components/ui/MarketTicker'
import { MaterialIcon } from '@/components/shared/MaterialIcon'
import { ListingCard } from '@/components/listings/ListingCard'
import { FreshnessTag } from '@/components/shared/FreshnessTag'
import { CATEGORY_LABELS, UNIT_LABELS, MaterialCategory } from '@/types'
import { prisma } from '@/lib/prisma'
import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
import { ArrowRight, Package, TrendingUp } from 'lucide-react'

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [MaterialCategory, string][]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'List Your Materials',
    desc: 'Post your scrap, surplus, or salvage in minutes. Add photos, specs, and pricing. Free forever for basic listings.',
  },
  {
    step: '02',
    title: 'Browse Verified Companies',
    desc: 'Search thousands of listings from verified scrap yards, demolition firms, ship breakers, and manufacturers.',
  },
  {
    step: '03',
    title: 'Contact Directly',
    desc: 'Connect directly with buyers and sellers. No middlemen. No hidden fees. Your contact info, your deal.',
  },
]

async function getFeaturedListings() {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      include: { company: { select: { name: true, verificationStatus: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    })
    return listings
  } catch {
    return []
  }
}

async function getRecentListings() {
  try {
    const sell = await prisma.listing.findMany({
      where: { status: 'ACTIVE', listingType: 'SELL' },
      include: { company: { select: { name: true, city: true, state: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    const buy = await prisma.listing.findMany({
      where: { status: 'ACTIVE', listingType: { in: ['BUY', 'WANTED'] } },
      include: { company: { select: { name: true, city: true, state: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    return { sell, buy }
  } catch {
    return { sell: [], buy: [] }
  }
}

export default async function HomePage() {
  const [featured, { sell: recentSell, buy: recentBuy }] = await Promise.all([
    getFeaturedListings(),
    getRecentListings(),
  ])

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <HeroSection />

        {/* Market Ticker — live marketplace activity from /api/public/prices */}
        <MarketTicker />

        {/* Stats + trust strip — animated counters & verification badges */}
        <StatsStrip />

        {/* Category Grid */}
        <section className="px-6 py-16 max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Browse by Category</h2>
            <Link href="/browse" className="text-sm text-[var(--accent)] hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {CATEGORIES.map(([cat, label]) => (
              <Link
                key={cat}
                href={`/browse?category=${cat}`}
                className="group flex flex-col items-center gap-2 p-4 rounded text-center transition-all duration-150 bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent)]"
              >
                <span className="text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors duration-150">
                  <MaterialIcon category={cat} size={28} />
                </span>
                <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors duration-150 leading-tight">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Listings */}
        {featured.length > 0 && (
          <section
            className="py-16"
            style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="px-6 max-w-screen-xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Featured Listings</h2>
                <Link href="/browse" className="text-sm text-[var(--accent)] hover:underline">
                  View all →
                </Link>
              </div>
              <HorizontalScroll cardWidth={288} gap={16}>
                {featured.map((listing) => (
                  <div key={listing.id} className="shrink-0 w-72" style={{ scrollSnapAlign: 'start' }}>
                    <ListingCard listing={listing as any} />
                  </div>
                ))}
              </HorizontalScroll>
            </div>
          </section>
        )}

        {/* How it Works */}
        <section className="px-6 py-20 max-w-screen-xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">How ScrapBridge Works</h2>
            <p className="text-[var(--text-secondary)]">Simple, direct, industrial-grade</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-4">
                <span
                  className="text-4xl font-bold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', opacity: 0.4 }}
                >
                  {step}
                </span>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="px-6 py-16 max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Recent Activity</h2>
            <Link
              href="/browse"
              className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Sell */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package size={13} className="text-[var(--text-tertiary)]" />
                <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  For Sale
                </h3>
              </div>
              <div
                className="rounded overflow-hidden"
                style={{ border: '1px solid var(--border)' }}
              >
                {recentSell.length === 0 ? (
                  <p className="text-sm text-[var(--text-tertiary)] py-6 text-center">No listings yet</p>
                ) : (
                  recentSell.map((l, i) => (
                    <Link
                      key={l.id}
                      href={`/listing/${l.id}`}
                      className="flex items-center justify-between px-4 py-3 transition-colors duration-150 group hover:bg-[var(--bg-tertiary)]"
                      style={{
                        background: i % 2 === 0 ? 'var(--bg-secondary)' : 'transparent',
                        borderBottom: i < recentSell.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] group-hover:text-[var(--foreground)] transition-colors truncate font-medium">
                          {l.title}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          {l.company.name} · {l.city}, {l.state}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4 flex flex-col items-end gap-0.5">
                        {l.pricePerUnit && (
                          <p
                            className="text-sm font-semibold text-[var(--foreground)]"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            ${l.pricePerUnit}/{UNIT_LABELS[l.unit]?.toLowerCase() ?? l.unit}
                          </p>
                        )}
                        <FreshnessTag date={l.createdAt} />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Recent Buy */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={13} className="text-[var(--text-tertiary)]" />
                <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  Buy Requests
                </h3>
              </div>
              <div
                className="rounded overflow-hidden"
                style={{ border: '1px solid var(--border)' }}
              >
                {recentBuy.length === 0 ? (
                  <p className="text-sm text-[var(--text-tertiary)] py-6 text-center">No requests yet</p>
                ) : (
                  recentBuy.map((l, i) => (
                    <Link
                      key={l.id}
                      href={`/listing/${l.id}`}
                      className="flex items-center justify-between px-4 py-3 transition-colors duration-150 group hover:bg-[var(--bg-tertiary)]"
                      style={{
                        background: i % 2 === 0 ? 'var(--bg-secondary)' : 'transparent',
                        borderBottom: i < recentBuy.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] group-hover:text-[var(--foreground)] transition-colors truncate font-medium">
                          {l.title}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          {l.company.name} · {l.city}, {l.state}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4 flex flex-col items-end gap-0.5">
                        {l.pricePerUnit && (
                          <p
                            className="text-sm font-semibold text-[var(--steel-blue)]"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            ${l.pricePerUnit}/{UNIT_LABELS[l.unit]?.toLowerCase() ?? l.unit}
                          </p>
                        )}
                        <FreshnessTag date={l.createdAt} />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section
          className="py-20"
          style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}
        >
          <div className="px-6 max-w-screen-xl mx-auto text-center flex flex-col items-center gap-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Free to list · No middlemen · Direct contact
            </p>
            <h2
              className="font-bold leading-tight text-[var(--foreground)]"
              style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontFamily: 'var(--font-display)' }}
            >
              Ready to trade industrial materials?
            </h2>
            <p className="text-[var(--muted-foreground)] max-w-lg text-base">
              Join 12,000+ verified companies already using ScrapBridge to buy and sell scrap metals, industrial equipment, and surplus materials.
            </p>
            <div className="flex flex-wrap items-center gap-4 justify-center">
              <Link
                href="/post-listing"
                className="h-11 px-8 flex items-center gap-2 rounded text-sm font-semibold transition-all duration-150 hover:opacity-88 active:scale-[0.98]"
                style={{ background: 'var(--foreground)', color: 'var(--background)' }}
              >
                Post Free Listing <ArrowRight size={15} />
              </Link>
              <Link
                href="/browse"
                className="h-11 px-8 flex items-center gap-2 rounded text-sm font-semibold transition-all duration-150 hover:bg-[var(--bg-tertiary)] border border-[var(--border)]"
                style={{ color: 'var(--foreground)' }}
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
