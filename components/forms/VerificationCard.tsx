'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ShieldCheck, Clock } from 'lucide-react'

type Status = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | null

export function VerificationCard() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>(null)
  const [open, setOpen] = useState(false)
  const [ein, setEin] = useState('')
  const [license, setLicense] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Demo: act as the first company. Production: resolve from session.
  useEffect(() => {
    fetch('/api/companies?limit=1')
      .then((r) => r.json())
      .then((d) => {
        const c = d.companies?.[0]
        if (c) {
          setCompanyId(c.id)
          setStatus(c.verificationStatus)
        }
      })
      .catch(() => {})
  }, [])

  const submit = async () => {
    if (!companyId) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, ein, licenseNumber: license }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Submission failed')
      setStatus(data.verificationStatus)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'VERIFIED') {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded"
        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}
      >
        <ShieldCheck size={20} className="text-[#22c55e] shrink-0" />
        <p className="text-sm font-medium text-[#22c55e]">Your company is verified.</p>
      </div>
    )
  }

  if (status === 'PENDING') {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded"
        style={{ background: 'var(--accent-glow)', border: '1px solid rgba(255,255,255,0.2)' }}
      >
        <Clock size={20} className="text-[var(--accent)] shrink-0" />
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">Verification under review</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            We&apos;re reviewing your business documents. This usually takes 1–2 business days.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col gap-4 p-4 rounded"
      style={{ background: 'var(--accent-glow)', border: '1px solid rgba(255,255,255,0.2)' }}
    >
      <div className="flex items-start gap-3">
        <ShieldCheck size={20} className="text-[var(--accent)] shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--accent)]">Get Verified</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Verified companies get 3× more inquiries, priority search ranking, and the verified badge.
          </p>
        </div>
        {!open && (
          <Button size="sm" onClick={() => setOpen(true)} disabled={!companyId}>
            Apply Now
          </Button>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="EIN (required)"
              placeholder="XX-XXXXXXX"
              value={ein}
              onChange={(e) => setEin(e.target.value)}
            />
            <Input
              label="Business License # (optional)"
              placeholder="License number"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} loading={submitting} disabled={!ein.trim()}>
              Submit for Review
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
