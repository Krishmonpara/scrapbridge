import Link from 'next/link'
import { Navbar } from '@/components/navigation/Navbar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { runFraudAgent } from '@/lib/agents/fraud-agent'
import { ShieldAlert, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Flagged Listings — ScrapBridge Admin' }

export default async function FlaggedPage() {
  let flags: Awaited<ReturnType<typeof runFraudAgent>> = []
  let scanFailed = false
  try {
    flags = await runFraudAgent()
  } catch {
    scanFailed = true
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-screen-lg mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={20} className="text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Flagged Listings</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            The fraud agent scans every active listing for risk signals — price anomalies, unverified
            high-value lots, duplicates, and implausible quantities. Review before taking action.
          </p>

          {scanFailed ? (
            <p className="text-sm text-[var(--text-tertiary)]">Scan failed — check database connection.</p>
          ) : flags.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              size="md"
              title="No flagged listings"
              description="Every active listing passed the current risk checks."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {flags.map((f) => (
                <div
                  key={f.listingId}
                  className="rounded p-4"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <Link
                        href={`/listing/${f.listingId}`}
                        className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors block truncate"
                      >
                        {f.title}
                      </Link>
                      <p className="text-xs text-[var(--text-tertiary)]">{f.companyName}</p>
                    </div>
                    <Badge
                      variant={f.risk === 'HIGH' ? 'danger' : f.risk === 'MEDIUM' ? 'copper' : 'default'}
                    >
                      {f.risk} RISK
                    </Badge>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {f.signals.map((s) => (
                      <li key={s} className="text-xs text-[var(--text-secondary)] flex gap-2">
                        <span className="text-[var(--text-tertiary)]">⚑</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
