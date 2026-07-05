'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, RefreshCw, Archive } from 'lucide-react'

// Row-level lifecycle actions for My Listings. Optimistic-free by design:
// we refresh the server-rendered table after each mutation so the badge,
// counts, and ordering stay truthful.
export function ListingActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  const mutate = async (action: string, run: () => Promise<Response>) => {
    setBusy(action)
    try {
      const res = await run()
      if (res.ok) router.refresh()
    } finally {
      setBusy(null)
    }
  }

  const patch = (body: Record<string, unknown>) =>
    fetch(`/api/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  const actionBtn =
    'inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-sm border cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {status === 'ACTIVE' && (
        <>
          <button
            className={actionBtn}
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            disabled={busy !== null}
            onClick={() => mutate('sold', () => patch({ status: 'SOLD' }))}
            title="Mark as sold"
          >
            <CheckCircle2 size={11} className={busy === 'sold' ? 'animate-spin' : ''} />
            Sold
          </button>
          <button
            className={actionBtn}
            style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
            disabled={busy !== null}
            onClick={() => mutate('archive', () => fetch(`/api/listings/${id}`, { method: 'DELETE' }))}
            title="Remove from marketplace (kept in history)"
          >
            <Archive size={11} className={busy === 'archive' ? 'animate-spin' : ''} />
            Archive
          </button>
        </>
      )}
      {(status === 'EXPIRED' || status === 'SOLD' || status === 'DRAFT') && (
        <button
          className={actionBtn}
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          disabled={busy !== null}
          onClick={() => mutate('renew', () => patch({ status: 'ACTIVE' }))}
          title="Relist for 30 days"
        >
          <RefreshCw size={11} className={busy === 'renew' ? 'animate-spin' : ''} />
          Relist
        </button>
      )}
    </div>
  )
}
