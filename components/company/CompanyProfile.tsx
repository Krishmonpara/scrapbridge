import Link from 'next/link'
import { Globe, Phone, Mail, Star, ShieldCheck, Calendar, MapPin } from 'lucide-react'
import { Company } from '@/types'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { Badge } from '@/components/ui/Badge'
import { BUSINESS_TYPE_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'

interface CompanyProfileProps {
  company: Company
  listingCount?: number
}

export function CompanyProfile({ company, listingCount = 0 }: CompanyProfileProps) {
  return (
    <div
      className="p-6 rounded flex flex-col gap-5"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="w-16 h-16 rounded flex items-center justify-center text-2xl font-bold text-[var(--accent)] shrink-0"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
        >
          {company.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link
              href={`/company/${company.slug}`}
              className="text-xl font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
            >
              {company.name}
            </Link>
            <VerifiedBadge status={company.verificationStatus} showLabel />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default">{BUSINESS_TYPE_LABELS[company.businessType]}</Badge>
            <span className="text-xs text-[var(--text-tertiary)]">{listingCount} active listings</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-3 gap-0 rounded overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        {[
          { label: 'Rating', value: company.rating.toFixed(1), icon: <Star size={12} className="text-[var(--accent)]" /> },
          { label: 'Reviews', value: String(company.reviewCount), icon: null },
          { label: 'Since', value: String(new Date(company.memberSince).getFullYear()), icon: <Calendar size={12} /> },
        ].map(({ label, value, icon }, i) => (
          <div
            key={label}
            className="flex flex-col items-center gap-0.5 py-3"
            style={{ borderRight: i < 2 ? '1px solid var(--border)' : 'none', background: 'var(--bg-primary)' }}
          >
            <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
              {icon}
              <span className="text-xs">{label}</span>
            </div>
            <span
              className="text-lg font-bold text-[var(--text-primary)]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <MapPin size={14} className="text-[var(--text-tertiary)] shrink-0" />
          {company.city}, {company.state}, {company.country}
        </div>
        {company.phone && (
          <a href={`tel:${company.phone}`} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
            <Phone size={14} className="text-[var(--text-tertiary)] shrink-0" />
            {company.phone}
          </a>
        )}
        {company.email && (
          <a href={`mailto:${company.email}`} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
            <Mail size={14} className="text-[var(--text-tertiary)] shrink-0" />
            {company.email}
          </a>
        )}
        {company.website && (
          <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--steel-blue)] hover:underline">
            <Globe size={14} className="shrink-0" />
            {company.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>

      {company.description && (
        <p className="text-sm text-[var(--text-tertiary)] leading-relaxed border-t border-[var(--border)] pt-4">
          {company.description}
        </p>
      )}
    </div>
  )
}
