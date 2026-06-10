'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  /** The final value to count up to. */
  to: number
  /** Animation duration in ms (default 1800). */
  duration?: number
  /** Decimal places (default 0). */
  decimals?: number
  /** Optional prefix, e.g. "$". */
  prefix?: string
  /** Optional suffix, e.g. "B", "+", "%". */
  suffix?: string
  /** className passed through to the wrapping span. */
  className?: string
  /** If true, count up every time the element re-enters the viewport. Default: once. */
  repeat?: boolean
}

/**
 * Counts up from 0 to `to` once the element scrolls into view.
 * Uses requestAnimationFrame + an easeOutExpo curve so the count
 * decelerates dramatically at the end — feels premium, not robotic.
 */
export function CountUp({
  to,
  duration = 1800,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  repeat = false,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [value, setValue] = useState(0)
  const hasRunRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const startAnimation = () => {
      const start = performance.now()
      const from = 0
      const delta = to - from

      const tick = (now: number) => {
        const elapsed = now - start
        const t = Math.min(elapsed / duration, 1)
        // easeOutExpo
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
        setValue(from + delta * eased)
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!hasRunRef.current || repeat) {
              hasRunRef.current = true
              startAnimation()
              if (!repeat) observer.disconnect()
            }
          }
        })
      },
      { threshold: 0.4 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [to, duration, repeat])

  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
