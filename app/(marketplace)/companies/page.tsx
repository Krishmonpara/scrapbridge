import Link from 'next/link'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { LocationPin } from '@/components/shared/LocationPin'
import { prisma } from '@/lib/prisma'
import { BUSINESS_TYPE_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'
import { Star, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getCompanies(search?: string, type?: string, verified?: string, state?: string) {
  try {
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (type) where.businessType = type
    if (verified) where.verificationStatus = 'VERIFIED'
    if (state) where.state = state

    const companies = await prisma.company.findMany({
      where,
      orderBy: { rating: 'desc' },
      include: {
        _count: { select: { listings: true } },
      },
    })
    return companies
  } catch {
    return []
  }
}

const BUSINESS_TYPES = Object.entries(BUSINESS_TYPE_LABELS)
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

interface Props {
  searchParams: Promise<{ search?: string; type?: string; verified?: string; state?: string }>
}

export default async function CompaniesPage({ searchParams }: Props) {
  const params = await searchParams
  const companies = await getCompanies(params.search, params.type, params.verified, params.state)

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>

        {/* Header */}
        <div
          className="px-6 py-8"
          style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="max-w-screen-xl mx-auto">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={20} className="text-[var(--accent)]" />
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Companies</h1>
            </div>
            <p className="text-sm text-[var(--text-tertiary)]">
              {companies.length} verified scrap yards, demolition firms, manufacturers, and traders
            </p>
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="flex gap-6 flex-col md:flex-row">

            {/* Filters sidebar */}
            <aside className="md:w-56 shrink-0">
              <form className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    Search
                  </label>
                  <input
                    name="search"
                    defaultValue={params.search ?? ''}
                    placeholder="Company name…"
                    className="h-9 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-sm px-3 focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    Business Type
                  </label>
                  <select
                    name="type"
                    defaultValue={params.type ?? ''}
                    className="h-9 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-sm px-2 focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option value="">All types</option>
                    {BUSINESS_TYPES.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    State
                  </label>
                  <select
                    name="state"
                    defaultValue={params.state ?? ''}
                    className="h-9 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-sm px-2 focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option value="">All states</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="verified"
                    value="1"
                    defaultChecked={!!params.verified}
                    className="accent-[var(--accent)] w-4 h-4"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">Verified only</span>
                </label>

                <Button type="submit" className="w-full">
                  Apply Filters
                </Button>
              </form>
            </aside>

            {/* Company grid */}
            <div className="flex-1 min-w-0">
              {companies.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No companies found"
                  description="No companies match this filter combination. Try clearing the type filter or the verified-only toggle."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {companies.map((company) => (
                    <Link
                      key={company.id}
                      href={`/company/${company.slug}`}
                      className="group p-4 rounded flex flex-col gap-3 transition-colors hover:border-[var(--border-accent)]"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                    >
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded flex items-center justify-center font-bold text-lg text-[var(--accent)] shrink-0"
                          style={{ background: 'var(--bg-tertiary)' }}
                        >
                          {company.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                            {company.name}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <VerifiedBadge status={company.verificationStatus} />
                            <Badge variant="default" className="text-xs">
                              {BUSINESS_TYPE_LABELS[company.businessType]}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <LocationPin city={company.city} state={company.state} />

                      {/* Description */}
                      {company.description && (
                        <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 leading-relaxed">
                          {company.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div
                        className="flex items-center justify-between pt-2"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                          <Star size={11} className="text-[var(--accent)]" />
                          {company.rating.toFixed(1)} · {company.reviewCount} reviews
                        </div>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {(company as any)._count?.listings ?? 0} listings
                        </span>
                      </div>

                      <p className="text-xs text-[var(--text-tertiary)]">
                        Member since {formatDate(company.memberSince)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
