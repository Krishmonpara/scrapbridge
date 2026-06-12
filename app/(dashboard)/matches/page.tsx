import { Navbar } from '@/components/navigation/Navbar'
import { prisma } from '@/lib/prisma'
import { Sparkles } from 'lucide-react'
import { MatchesClient } from './MatchesClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'RFQ Matches — ScrapBridge' }

export default async function MatchesPage() {
  // Demo: act as the first company. Production: resolve from session.
  let companyId: string | null = null
  try {
    const company = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } })
    companyId = company?.id ?? null
  } catch {
    companyId = null
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-screen-lg mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} className="text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">RFQ Matches</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            The match agent scans active listings against your open RFQs and surfaces the strongest candidates.
          </p>

          {companyId ? (
            <MatchesClient companyId={companyId} />
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">
              Database unavailable — start PostgreSQL and seed data to see matches.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
