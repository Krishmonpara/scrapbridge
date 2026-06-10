export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/navigation/Navbar'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { LocationPin } from '@/components/shared/LocationPin'
import { ListingCard } from '@/components/listings/ListingCard'
import { Badge } from '@/components/ui/Badge'
import { BUSINESS_TYPE_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'
import { Star, Globe, Phone, Mail, FileText } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = await prisma.company.findUnique({ where: { slug: id }, select: { name: true } })
  return { title: company ? `${company.name} — ScrapBridge` : 'Company Not Found' }
}

export default async function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const company = await prisma.company.findUnique({ where: { slug: id } })
  if (!company) notFound()

  const listings = await prisma.listing.findMany({
    where: { companyId: company.id, status: 'ACTIVE' },
    include: { company: { select: { name: true, verificationStatus: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {/* Company header */}
        <div
          className="px-6 py-8"
          style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="max-w-screen-xl mx-auto flex items-start gap-6">
            <div
              className="w-20 h-20 rounded flex items-center justify-center text-3xl font-bold text-[var(--accent)] shrink-0"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
            >
              {company.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{company.name}</h1>
                <VerifiedBadge status={company.verificationStatus} showLabel />
                <Badge variant="default">{BUSINESS_TYPE_LABELS[company.businessType]}</Badge>
              </div>
              <div className="flex items-center gap-4 flex-wrap text-sm text-[var(--text-secondary)] mb-3">
                <LocationPin city={company.city} state={company.state} />
                <span className="flex items-center gap-1">
                  <Star size={12} className="text-[var(--accent)]" />
                  {company.rating.toFixed(1)} ({company.reviewCount} reviews)
                </span>
                <span>Member since {formatDate(company.memberSince)}</span>
                <span>{listings.length} active listings</span>
              </div>
              {company.description && (
                <p className="text-sm text-[var(--text-tertiary)] max-w-2xl">{company.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {company.phone && (
                  <a href={`tel:${company.phone}`} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                    <Phone size={14} /> {company.phone}
                  </a>
                )}
                {company.email && (
                  <a href={`mailto:${company.email}`} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                    <Mail size={14} /> {company.email}
                  </a>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-[var(--steel-blue)] hover:underline">
                    <Globe size={14} /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-6">
            <FileText size={16} className="text-[var(--text-tertiary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Active Listings</h2>
            <span className="text-sm text-[var(--text-tertiary)]">({listings.length})</span>
          </div>

          {listings.length === 0 ? (
            <div className="py-20 text-center text-[var(--text-tertiary)]">
              No active listings at this time.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l as any} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
