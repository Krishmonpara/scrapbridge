// Shared skeleton shapes for route-level loading.tsx files.
// All use the .skeleton shimmer class from globals.css.

import { Navbar } from '@/components/navigation/Navbar'

export function SkeletonBar({ w = '100%', h = 14 }: { w?: number | string; h?: number }) {
  return <div className="skeleton rounded-sm" style={{ width: w, height: h }} />
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-sm overflow-hidden flex flex-col"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
    >
      <div className="skeleton h-40" />
      <div className="flex flex-col gap-2.5 p-3">
        <SkeletonBar w="40%" h={10} />
        <SkeletonBar w="85%" h={14} />
        <SkeletonBar w="60%" h={12} />
        <div className="skeleton h-8 rounded-sm mt-1" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonRows({ count = 8, h = 44 }: { count?: number; h?: number }) {
  return (
    <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: h, borderBottom: i < count - 1 ? '1px solid var(--border)' : 'none' }}
        />
      ))}
    </div>
  )
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-screen-xl mx-auto px-6 py-8">{children}</div>
      </div>
    </>
  )
}
