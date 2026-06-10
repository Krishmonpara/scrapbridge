import Link from 'next/link'
import { Star, MapPin, FileText } from 'lucide-react'
import { Company } from '@/types'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { Badge } from '@/components/ui/Badge'
import { BUSINESS_TYPE_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'

interface CompanyCardProps {
  company: Company & { _count?: { listings: number } }
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link
      href={`/company/${company.slug}`}
      className="group flex flex-col gap-3 p-4 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-tertiary)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(255,255,255,0.3)] transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-md flex items-center justify-center shrink-0 text-xl font-bold text-[var(--accent)] bg-[var(--bg-primary)] border border-[var(--border)] group-hover:border-[var(--accent)]/40 group-hover:shadow-[0_0_16px_rgba(255,255,255,0.2)] transition-all duration-200"
        >
          {company.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
              {company.name}
            </span>
            <VerifiedBadge status={company.verificationStatus} />
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <MapPin size={11} />
            {company.city}, {company.state}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="default">{BUSINESS_TYPE_LABELS[company.businessType]}</Badge>
        {company._count && (
          <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
            <FileText size={11} /> {company._count.listings} listings
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
        <span className="flex items-center gap-1">
          <Star size={11} className="text-[var(--accent)]" />
          {company.rating.toFixed(1)} ({company.reviewCount} reviews)
        </span>
        <span>Since {formatDate(company.memberSince)}</span>
      </div>
    </Link>
  )
}
