'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  company: z.string().min(2, 'Company name required'),
  password: z.string().min(8, 'At least 8 characters'),
})

type FormData = z.infer<typeof schema>

const BUSINESS_TYPES = [
  { value: 'SCRAP_YARD', label: 'Scrap Yard' },
  { value: 'DEMOLITION', label: 'Demolition' },
  { value: 'SHIP_BREAKER', label: 'Ship Breaker' },
  { value: 'MANUFACTURER', label: 'Manufacturer' },
  { value: 'RECYCLER', label: 'Recycler' },
  { value: 'TRADER', label: 'Trader' },
  { value: 'BROKER', label: 'Broker' },
]

export default function RegisterPage() {
  const [businessType, setBusinessType] = useState('TRADER')
  const [error, setError] = useState('')
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, businessType }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Registration failed')
      return
    }
    // Auto sign-in after registration
    await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.10) 0%, transparent 55%),
            radial-gradient(ellipse at 20% 70%, rgba(30,111,165,0.06) 0%, transparent 50%)
          `,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--border-accent) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-accent) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="animate-hero w-full max-w-md relative z-10" style={{ animationDuration: '0.3s' }}>
        <Link href="/home" className="flex items-center gap-2 mb-8">
          <span
            className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'var(--accent)' }}
          >
            SB
          </span>
          <span className="font-semibold text-[var(--text-primary)]">ScrapBridge</span>
        </Link>

        <div
          className="p-6 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)]"
          style={{ boxShadow: '0 20px 60px -20px rgba(0,0,0,0.6), 0 0 40px -20px rgba(255,255,255,0.15)' }}
        >
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">Create account</h1>
          <p className="text-sm text-[var(--text-tertiary)] mb-6">
            Free forever for basic listings. No credit card required.
          </p>

          {error && (
            <div
              className="p-3 rounded-sm text-sm mb-4"
              style={{ background: 'rgba(140,26,26,0.15)', border: '1px solid rgba(140,26,26,0.3)', color: '#c43a3a' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Your Name"
              placeholder="John Smith"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Company Name"
              placeholder="Acme Scrap Metals LLC"
              error={errors.company?.message}
              {...register('company')}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Business Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => setBusinessType(bt.value)}
                    className="flex items-center gap-2 p-2 rounded-sm border text-left transition-colors"
                    style={{
                      borderColor: businessType === bt.value ? 'var(--accent)' : 'var(--border)',
                      background: businessType === bt.value ? 'var(--accent-glow)' : 'transparent',
                    }}
                  >
                    <span
                      className="text-xs"
                      style={{ color: businessType === bt.value ? 'var(--accent)' : 'var(--text-secondary)' }}
                    >
                      {bt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" loading={isSubmitting} className="w-full mt-2">
              Create Account
            </Button>

            <p className="text-xs text-[var(--text-tertiary)] text-center">
              By registering you agree to our{' '}
              <Link href="/terms-of-service" className="text-[var(--accent)] hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="text-[var(--accent)] hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-tertiary)] mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
