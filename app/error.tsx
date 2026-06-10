'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="text-center max-w-md">
        <AlertTriangle size={40} className="text-[var(--accent)] mx-auto mb-4" />
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          An unexpected error occurred. Please try again or go back to the homepage.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <Button variant="secondary" onClick={reset}>
            Try Again
          </Button>
          <Button asChild>
            <Link href="/home">Go Home</Link>
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-[var(--text-tertiary)] mt-4">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
