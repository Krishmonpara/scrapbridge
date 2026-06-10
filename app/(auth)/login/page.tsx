'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [error, setError] = useState('')
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    }) as { error?: string } | undefined
    if (result?.error) {
      setError('Invalid email or password. Please try again.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleGoogle = () => signIn('google', { callbackUrl: '/dashboard' })

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Ambient backdrop */}
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

      <div className="animate-hero w-full max-w-sm relative z-10" style={{ animationDuration: '0.3s' }}>
        {/* Logo */}
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
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">Sign in</h1>
          <p className="text-sm text-[var(--text-tertiary)] mb-6">
            Access your ScrapBridge account
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
              label="Email"
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-[var(--steel-blue)] hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" loading={isSubmitting} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs text-[var(--text-tertiary)]">or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <Button variant="secondary" className="w-full" onClick={handleGoogle}>
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-sm text-[var(--text-tertiary)] mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[var(--accent)] hover:underline">
            Register free
          </Link>
        </p>
      </div>
    </div>
  )
}
