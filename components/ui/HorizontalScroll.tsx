'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HorizontalScrollProps {
  /** Width of each card in pixels (used to calculate scroll step). */
  cardWidth?: number
  /** Gap between cards in pixels. Defaults to 16. */
  gap?: number
  children: React.ReactNode
}

export function HorizontalScroll({ cardWidth = 288, gap = 16, children }: HorizontalScrollProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const sync = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', sync)
      ro.disconnect()
    }
  }, [sync])

  const scroll = (dir: 'left' | 'right') => {
    trackRef.current?.scrollBy({
      left: dir === 'right' ? cardWidth + gap : -(cardWidth + gap),
      behavior: 'smooth',
    })
  }

  const showButtons = canScrollLeft || canScrollRight

  return (
    <div className="relative group/hs">
      {/* Left arrow */}
      {showButtons && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 w-8 h-8 flex items-center justify-center rounded-full shadow-lg border transition-all duration-150"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: canScrollLeft ? 'var(--border-accent)' : 'var(--border)',
            opacity: canScrollLeft ? 1 : 0.25,
            pointerEvents: canScrollLeft ? 'auto' : 'none',
          }}
        >
          <ChevronLeft size={14} style={{ color: 'var(--text-primary)' }} />
        </button>
      )}

      {/* Right arrow */}
      {showButtons && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 w-8 h-8 flex items-center justify-center rounded-full shadow-lg border transition-all duration-150"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: canScrollRight ? 'var(--border-accent)' : 'var(--border)',
            opacity: canScrollRight ? 1 : 0.25,
            pointerEvents: canScrollRight ? 'auto' : 'none',
          }}
        >
          <ChevronRight size={14} style={{ color: 'var(--text-primary)' }} />
        </button>
      )}

      {/* Right fade */}
      {canScrollRight && (
        <div
          className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent, var(--bg-secondary))' }}
        />
      )}

      {/* Left fade */}
      {canScrollLeft && (
        <div
          className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, transparent, var(--bg-secondary))' }}
        />
      )}

      <div
        ref={trackRef}
        className="flex overflow-x-auto pb-2 scroll-smooth"
        style={{
          gap,
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}
