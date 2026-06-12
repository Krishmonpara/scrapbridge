'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { Sparkles, RefreshCw, X, ArrowRight } from 'lucide-react'

interface MatchAlert {
  id: string
  score: number
  reasons: string[]
  status: 'NEW' | 'SEEN' | 'DISMISSED' | 'CONTACTED'
  listing: {
    id: string
    title: string
    pricePerUnit: number | null
    unit: string
    quantity: number
    city: string
    state: string
    company: { name: string; slug: string; verificationStatus: string }
  } | null
  rfq: { id: string; title: string; quantityNeeded: number; unit: string } | null
}

export function MatchesClient({ companyId }: { companyId: string }) {
  const [alerts, setAlerts] = useState<MatchAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/match?companyId=${companyId}`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts)
      }
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { load() }, [load])

  const runAgent = async () => {
    setRunning(true)
    try {
      const res = await fetch('/api/agents/match', { method: 'POST' })
      if (res.ok) {
        const result = await res.json()
        setLastRun(
          `Evaluated ${result.evaluated} listing-RFQ pairs across ${result.rfqs} open RFQs — ${result.matches} matches.`
        )
        await load()
      }
    } finally {
      setRunning(false)
    }
  }

  const dismiss = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    fetch('/api/agents/match', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'DISMISSED' }),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-[var(--text-tertiary)]">
          {lastRun ?? 'Runs automatically when new listings are posted. Trigger a manual scan any time.'}
        </p>
        <Button variant="outline" size="sm" onClick={runAgent} loading={running}>
          <RefreshCw size={13} />
          Run match agent
        </Button>
      </div>

      {!loading && alerts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          size="md"
          title="No matches yet"
          description="Post an RFQ describing what you need, then run the match agent — strong listing matches will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="rounded p-4 flex flex-col gap-3"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-12 h-12 rounded-sm flex flex-col items-center justify-center shrink-0 font-bold"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                  >
                    <span className="text-base text-[var(--text-primary)] leading-none">{Math.round(a.score)}</span>
                    <span className="text-[9px] text-[var(--text-tertiary)] uppercase">score</span>
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/listing/${a.listing?.id}`}
                      className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors block truncate"
                    >
                      {a.listing?.title ?? 'Listing removed'}
                    </Link>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">
                      Matches your RFQ: <span className="text-[var(--text-secondary)]">{a.rfq?.title}</span>
                    </p>
                    {a.listing && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-secondary)]">
                        <span>{a.listing.company.name}</span>
                        <VerifiedBadge status={a.listing.company.verificationStatus as any} />
                        <span>·</span>
                        <span>{a.listing.city}, {a.listing.state}</span>
                        {a.listing.pricePerUnit && (
                          <>
                            <span>·</span>
                            <span className="font-medium text-[var(--text-primary)]">
                              ${a.listing.pricePerUnit}/{a.listing.unit.toLowerCase()}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.status === 'NEW' && <Badge variant="amber">NEW</Badge>}
                  <button
                    onClick={() => dismiss(a.id)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    aria-label="Dismiss match"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {a.reasons.map((r) => (
                  <Badge key={r} variant="default">{r}</Badge>
                ))}
              </div>

              {a.listing && (
                <div>
                  <Link
                    href={`/listing/${a.listing.id}`}
                    className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                  >
                    View listing &amp; contact seller <ArrowRight size={11} />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
