import Link from 'next/link'
import { Navbar } from '@/components/navigation/Navbar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { prisma } from '@/lib/prisma'
import { CATEGORY_LABELS, UNIT_LABELS } from '@/types'
import { formatDate, formatNumber } from '@/lib/utils'
import {
  LayoutDashboard,
  Plus,
  Eye,
  MessageSquare,
  TrendingUp,
  FileText,
  Bell,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Star,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// Demo: show the first company's data. In production, filter by auth session.
async function getDashboardData() {
  try {
    const company = await prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
    })
    if (!company) return null

    const [listings, inquiries, rfqs] = await Promise.all([
      prisma.listing.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.inquiry.findMany({
        where: { toCompanyId: company.id },
        include: {
          listing: { select: { title: true } },
          fromCompany: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.rFQ.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { company: { select: { name: true, verificationStatus: true } } },
      }),
    ])

    const totalViews = listings.reduce((s, l) => s + l.viewCount, 0)
    const totalInquiries = listings.reduce((s, l) => s + l.inquiryCount, 0)
    const activeListings = listings.filter((l) => l.status === 'ACTIVE').length

    return { company, listings, inquiries, rfqs, totalViews, totalInquiries, activeListings }
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (!data) {
    return (
      <>
        <Navbar />
        <div className="pt-16 min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
          <div className="text-center">
            <LayoutDashboard size={40} className="text-[var(--text-tertiary)] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Start Your Journey</h2>
            <p className="text-sm text-[var(--text-tertiary)] mb-6">Create your first listing to unlock your dashboard.</p>
            <Button asChild>
              <Link href="/post-listing"><Plus size={16} /> Post a Listing</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  const { company, listings, inquiries, rfqs, totalViews, totalInquiries, activeListings } = data

  const stats = [
    { label: 'Active Listings', value: activeListings, icon: FileText, color: 'var(--accent)', href: '/my-listings' },
    { label: 'Total Views', value: formatNumber(totalViews), icon: Eye, color: 'var(--steel-blue)', href: '/my-listings' },
    { label: 'Inquiries Received', value: totalInquiries, icon: MessageSquare, color: '#2dba6e', href: '/inquiries' },
    { label: 'Avg. Rating', value: company.rating.toFixed(1), icon: Star, color: 'var(--accent)', href: `/company/${company.slug}` },
  ]

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-screen-xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <LayoutDashboard size={22} className="text-[var(--accent)]" />
                Dashboard
              </h1>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                {company.name} · {company.city || 'Location not set'}{company.state ? `, ${company.state}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" asChild>
                <Link href="/rfq">Post RFQ</Link>
              </Button>
              <Button asChild>
                <Link href="/post-listing"><Plus size={16} /> New Listing</Link>
              </Button>
            </div>
          </div>

          {/* Verification Banner */}
          {company.verificationStatus !== 'VERIFIED' && (
            <div
              className="flex items-center gap-3 p-4 rounded mb-6"
              style={{ background: 'var(--accent-glow)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <ShieldCheck size={18} className="text-[var(--accent)] shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--accent)]">Get Verified to unlock 3× more inquiries</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Submit your business license and EIN — verification takes 24–48h.
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="/settings#company">Apply Now</Link>
              </Button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map(({ label, value, icon: Icon, color, href }) => (
              <Link
                key={label}
                href={href}
                className="p-4 rounded flex flex-col gap-2 transition-colors hover:border-[var(--border-accent)] group"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <Icon size={16} style={{ color }} />
                  <ArrowUpRight size={12} className="text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors" />
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color }}
                >
                  {value}
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
              </Link>
            ))}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left / Main — 2 cols */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Listings */}
              <div
                className="rounded overflow-hidden"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Listings</h2>
                  <Link href="/my-listings" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                    View all <ArrowRight size={10} />
                  </Link>
                </div>
                {listings.length === 0 ? (
                  <div className="py-12 text-center text-[var(--text-tertiary)] text-sm">
                    No listings yet.{' '}
                    <Link href="/post-listing" className="text-[var(--accent)] hover:underline">Post your first →</Link>
                  </div>
                ) : (
                  listings.map((l, i) => (
                    <div
                      key={l.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors"
                      style={{ borderBottom: i < listings.length - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/listing/${l.id}`}
                          className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors truncate block"
                        >
                          {l.title}
                        </Link>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {CATEGORY_LABELS[l.materialCategory]} · {formatNumber(l.quantity)} {UNIT_LABELS[l.unit]}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                          <Eye size={11} /> {l.viewCount}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                          <MessageSquare size={11} /> {l.inquiryCount}
                        </span>
                        {l.pricePerUnit ? (
                          <span
                            className="text-sm font-semibold"
                            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)' }}
                          >
                            ${l.pricePerUnit}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-tertiary)]">RFQ</span>
                        )}
                        <Badge variant={l.status === 'ACTIVE' ? 'success' : l.status === 'SOLD' ? 'steel' : 'default'}>
                          {l.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Recent Inquiries */}
              <div
                className="rounded overflow-hidden"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Inquiries</h2>
                  <Link href="/inquiries" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                    View all <ArrowRight size={10} />
                  </Link>
                </div>
                {inquiries.length === 0 ? (
                  <div className="py-10 text-center text-[var(--text-tertiary)] text-sm">
                    No inquiries yet — they&apos;ll appear here when buyers contact you.
                  </div>
                ) : (
                  inquiries.map((inq, i) => (
                    <div
                      key={inq.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors"
                      style={{ borderBottom: i < inquiries.length - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                      <div
                        className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--accent)' }}
                      >
                        {inq.fromCompany?.name[0] ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {inq.fromCompany?.name ?? 'Unknown'}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] truncate">
                          Re: {inq.listing?.title ?? 'Listing'}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                          {inq.message}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-[var(--text-tertiary)]">{formatDate(inq.createdAt)}</p>
                        <Badge
                          variant={inq.status === 'PENDING' ? 'amber' : inq.status === 'RESPONDED' ? 'success' : 'default'}
                          className="mt-1"
                        >
                          {inq.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="flex flex-col gap-6">

              {/* Quick Actions */}
              <div
                className="p-4 rounded flex flex-col gap-2"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Quick Actions</h2>
                {[
                  { label: 'Post New Listing', href: '/post-listing', icon: Plus },
                  { label: 'Post a RFQ', href: '/rfq', icon: Bell },
                  { label: 'Browse Listings', href: '/browse', icon: TrendingUp },
                  { label: 'Edit Company Profile', href: '/settings#company', icon: ShieldCheck },
                ].map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-2 p-2.5 rounded-sm text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <Icon size={14} className="text-[var(--accent)]" />
                    {label}
                  </Link>
                ))}
              </div>

              {/* Open RFQs */}
              <div
                className="rounded overflow-hidden"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Open RFQs</h2>
                  <Link href="/rfq" className="text-xs text-[var(--accent)] hover:underline">Browse all →</Link>
                </div>
                {rfqs.length === 0 ? (
                  <div className="py-8 text-center text-[var(--text-tertiary)] text-sm">No open RFQs</div>
                ) : (
                  rfqs.map((rfq, i) => (
                    <div
                      key={rfq.id}
                      className="p-3 hover:bg-[var(--bg-tertiary)] transition-colors"
                      style={{ borderBottom: i < rfqs.length - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                      <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 mb-1">
                        {rfq.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {rfq.company?.name ?? 'Unknown'}
                        </span>
                        <span
                          className="text-xs text-[var(--accent)]"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {rfq.quantityNeeded} {rfq.unit}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Company card */}
              <div
                className="p-4 rounded flex flex-col gap-3"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center font-bold text-[var(--accent)]"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    {company.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{company.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {company.verificationStatus === 'VERIFIED'
                        ? '✓ Verified'
                        : company.verificationStatus === 'PENDING'
                        ? 'Pending verification'
                        : 'Unverified'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1"><Star size={10} className="text-[var(--accent)]" /> {company.rating.toFixed(1)}</span>
                  <span>{company.reviewCount} reviews</span>
                </div>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/company/${company.slug}`}>View Public Profile</Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
