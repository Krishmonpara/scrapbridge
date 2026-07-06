'use client'

import { useEffect, useRef, useState } from 'react'

interface RevealProps {
  children: React.ReactNode
  /** ms delay before the animation starts once visible */
  delay?: number
  className?: string
}

// Fades content up when it scrolls into view. SSR-safe: content renders
// visible by default and only hides after hydration confirms JS is running,
// so nothing is invisible on first paint (the framer-motion SSR lesson).
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'initial' | 'hidden' | 'shown'>('initial')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // already in the viewport at mount → leave it visible, no animation
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.92) return

    setState('hidden')
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState('shown')
          observer.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={
        state === 'hidden'
          ? { opacity: 0, transform: 'translateY(20px)' }
          : state === 'shown'
            ? {
                opacity: 1,
                transform: 'translateY(0)',
                transition: `opacity 0.55s var(--ease-out-expo) ${delay}ms, transform 0.55s var(--ease-out-expo) ${delay}ms`,
              }
            : undefined
      }
    >
      {children}
    </div>
  )
}
