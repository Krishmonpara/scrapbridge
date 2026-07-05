'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { Star } from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string | null
  transactionType: string | null
  createdAt: string
  fromCompany: { name: string; slug: string; verificationStatus: string }
}

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= value ? 'text-[var(--foreground)]' : 'text-[var(--border)]'}
          fill={n <= value ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  )
}

export function ReviewSection({ companyId }: { companyId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loaded, setLoaded] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [reviewerId, setReviewerId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?companyId=${companyId}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews)
      }
    } finally {
      setLoaded(true)
    }
  }, [companyId])

  useEffect(() => {
    load()
    // Demo: review as the first company. Production: resolve from session.
    fetch('/api/companies?limit=1')
      .then((r) => r.json())
      .then((d) => setReviewerId(d.companies?.[0]?.id ?? null))
      .catch(() => {})
  }, [load])

  const submit = async () => {
    if (!reviewerId || rating === 0) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromCompanyId: reviewerId, toCompanyId: companyId, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed to submit review')
      setFormOpen(false)
      setRating(0)
      setComment('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const canReview = reviewerId && reviewerId !== companyId

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-[var(--text-tertiary)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reviews</h2>
          <span className="text-sm text-[var(--text-tertiary)]">({reviews.length})</span>
        </div>
        {canReview && !formOpen && (
          <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {formOpen && (
        <div
          className="rounded-sm p-4 mb-6 flex flex-col gap-3"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Your rating</span>
            <span className="inline-flex" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  className="p-0.5 cursor-pointer"
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  <Star
                    size={18}
                    className={n <= (hoverRating || rating) ? 'text-[var(--foreground)]' : 'text-[var(--border)]'}
                    fill={n <= (hoverRating || rating) ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="How was the transaction? Material quality, communication, logistics…"
            className="text-sm px-3 py-2 rounded-sm resize-none bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--foreground)]/40"
            style={{ border: '1px solid var(--border)' }}
          />
          {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submit} loading={submitting} disabled={rating === 0}>
              Submit Review
            </Button>
          </div>
        </div>
      )}

      {!loaded ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-20 rounded-sm" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] py-8 text-center rounded-sm" style={{ border: '1px dashed var(--border)' }}>
          No reviews yet — completed a deal with this company? Be the first to review.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-sm p-4"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Link
                    href={`/company/${r.fromCompany.slug}`}
                    className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors truncate"
                  >
                    {r.fromCompany.name}
                  </Link>
                  <VerifiedBadge status={r.fromCompany.verificationStatus as any} />
                </div>
                <Stars value={r.rating} />
              </div>
              {r.comment && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{r.comment}</p>
              )}
              <p className="text-[11px] text-[var(--text-tertiary)] mt-2 tabular-nums">
                {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {r.transactionType ? ` · ${r.transactionType}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
