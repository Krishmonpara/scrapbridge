'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

interface Props {
  /** Where to send the user when they click "Start Scraping". */
  ctaHref: string
  /** Key written to sessionStorage so the splash is skipped on subsequent loads. */
  storageKey: string
}

const TOTAL_FRAMES = 240
const FPS = 24
const FRAME_MS = 1000 / FPS
const IMG_W = 1280
const IMG_H = 720
const CONCURRENCY = 8

export function FrameAnimationHero({ ctaHref, storageKey }: Props) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const framesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES))
  const currentRef = useRef(0)
  const lastTimeRef = useRef(0)
  const playingRef = useRef(true)
  const startedRef = useRef(false)

  const [loadedCount, setLoadedCount] = useState(0)
  const [ready, setReady] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [showHud, setShowHud] = useState(false)
  const [paused, setPaused] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(1)
  // null = still checking sessionStorage (don't render or preload yet)
  // true = skipping (already seen) — show black screen while redirecting
  // false = show splash and preload
  const [skip, setSkip] = useState<boolean | null>(null)

  // Decide on mount: skip if user already saw the splash this session.
  // This runs BEFORE preload, so returning visitors don't waste bandwidth.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const seen = sessionStorage.getItem(storageKey) === '1'
      if (seen) {
        setSkip(true)
        router.replace(ctaHref)
      } else {
        setSkip(false)
      }
    } catch {
      setSkip(false)
    }
  }, [router, ctaHref, storageKey])

  // ---------- canvas sizing ----------
  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    const img = framesRef.current[currentRef.current]
    if (img) draw(img)
  }, [])

  const draw = (img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return
    const cw = window.innerWidth
    const ch = window.innerHeight
    const scale = Math.max(cw / IMG_W, ch / IMG_H)
    const w = IMG_W * scale
    const h = IMG_H * scale
    const x = (cw - w) / 2
    const y = (ch - h) / 2
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, cw, ch)
    ctx.drawImage(img, x, y, w, h)
  }

  // ---------- preload + playback (gated on skip decision) ----------
  useEffect(() => {
    if (skip !== false) return // either still checking, or we're redirecting away
    let cancelled = false
    resize()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('orientationchange', resize, { passive: true })

    function loadFrame(i: number): Promise<void> {
      return new Promise((resolve) => {
        const img = new Image()
        const num = String(i + 1).padStart(3, '0')
        img.src = `/frames/ezgif-frame-${num}.jpg`
        img.onload = () => {
          const finish = () => {
            if (cancelled) return resolve()
            framesRef.current[i] = img
            setLoadedCount((c) => c + 1)
            if (i === 0) draw(img)
            resolve()
          }
          if ((img as any).decode) (img as any).decode().then(finish, finish)
          else finish()
        }
        img.onerror = () => {
          framesRef.current[i] = null
          setLoadedCount((c) => c + 1)
          resolve()
        }
      })
    }

    let next = 0
    const worker = async () => {
      while (next < TOTAL_FRAMES && !cancelled) {
        const i = next++
        await loadFrame(i)
      }
    }
    const workers = Array.from({ length: CONCURRENCY }, worker)
    Promise.all(workers).then(() => {
      if (cancelled) return
      startedRef.current = true
      setReady(true)
      setShowHud(true)
      // tiny delay then start
      requestAnimationFrame(tick)
      window.setTimeout(() => !cancelled && setShowContent(true), 1000)
    })

    let rafId = 0
    function tick(now: number) {
      if (cancelled) return
      if (!playingRef.current) {
        lastTimeRef.current = now
        rafId = requestAnimationFrame(tick)
        return
      }
      if (!lastTimeRef.current) lastTimeRef.current = now
      const elapsed = now - lastTimeRef.current
      if (elapsed >= FRAME_MS) {
        const advance = Math.floor(elapsed / FRAME_MS)
        currentRef.current = (currentRef.current + advance) % TOTAL_FRAMES
        lastTimeRef.current += advance * FRAME_MS
        const img = framesRef.current[currentRef.current]
        if (img) {
          draw(img)
          setCurrentFrame(currentRef.current + 1)
        }
      }
      rafId = requestAnimationFrame(tick)
    }

    return () => {
      cancelled = true
      window.removeEventListener('resize', resize)
      window.removeEventListener('orientationchange', resize)
      cancelAnimationFrame(rafId)
    }
  }, [resize, skip])

  // ---------- click to toggle play/pause ----------
  const onHeroClick = (e: React.MouseEvent) => {
    if (!startedRef.current) return
    const t = e.target as HTMLElement
    if (t.closest('button, a')) return
    playingRef.current = !playingRef.current
    setPaused(!playingRef.current)
    lastTimeRef.current = 0
  }

  // Spacebar = toggle, Esc/Enter = enter site
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && startedRef.current) {
        e.preventDefault()
        playingRef.current = !playingRef.current
        setPaused(!playingRef.current)
        lastTimeRef.current = 0
      } else if (e.code === 'Enter' && ready) {
        enterSite()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ready])

  const enterSite = () => {
    try {
      sessionStorage.setItem(storageKey, '1')
    } catch {}
    router.push(ctaHref)
  }

  const skipSplash = () => {
    try {
      sessionStorage.setItem(storageKey, '1')
    } catch {}
    router.replace(ctaHref)
  }

  const pct = (loadedCount / TOTAL_FRAMES) * 100

  // While we're still deciding whether to skip, or actively redirecting, show a
  // plain black screen — no loader, no preloading. Avoids a flash of splash UI
  // and saves the 9MB preload for returning visitors.
  if (skip !== false) {
    return <div className="fixed inset-0" style={{ background: '#0a0a0a' }} aria-hidden />
  }

  return (
    <section
      onClick={onHeroClick}
      className="relative w-screen h-screen overflow-hidden cursor-pointer select-none"
      style={{ background: '#0a0a0a' }}
      aria-label="ScrapBridge intro"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" aria-hidden />

      {/* vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, transparent 35%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.92) 100%), linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 22%, transparent 72%, rgba(0,0,0,0.7) 100%)',
        }}
      />
      {/* scan-line grain */}
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          opacity: 0.4,
          mixBlendMode: 'overlay',
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* loader */}
      {!ready && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
          style={{ background: '#0a0a0a' }}
        >
          <div
            className="text-[22px] font-bebas tracking-[0.4em] text-white/60"
            style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}
          >
            SCRAP<span style={{ color: 'var(--foreground)' }}>·</span>BRIDGE
          </div>
          <div className="w-[min(380px,72vw)] h-[2px] bg-white/10 overflow-hidden">
            <div
              className="h-full transition-[width] duration-150 ease-out"
              style={{
                width: `${pct}%`,
                background: 'var(--foreground)',
                boxShadow: '0 0 14px color-mix(in srgb, var(--foreground) 50%, transparent)',
              }}
            />
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/45 tabular-nums">
            Loading sequence{' '}
            <strong className="text-white/85 font-semibold tabular-nums">
              {String(loadedCount).padStart(3, '0')} / 240
            </strong>
          </div>
          {/* always-available skip on the loader too */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              skipSplash()
            }}
            className="absolute top-6 right-6 text-[10px] tracking-[0.28em] uppercase text-white/50 hover:text-[var(--foreground)] cursor-pointer transition-colors"
          >
            Skip intro →
          </button>
        </div>
      )}

      {/* top HUD */}
      <div
        className="absolute top-0 left-0 right-0 z-[6] flex items-center justify-between px-8 py-5 pointer-events-none transition-opacity duration-700"
        style={{ opacity: showHud ? 1 : 0 }}
      >
        <div
          className="text-[20px] tracking-[0.32em] text-white/90"
          style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}
        >
          SB<span style={{ color: 'var(--foreground)' }}>·</span>240
        </div>
        <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-white/60">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--foreground)', boxShadow: '0 0 8px var(--foreground)', animation: 'pulse 1.6s ease-in-out infinite' }}
          />
          System Online
        </div>
      </div>

      {/* center content — fades in 1s after start */}
      <div
        className="absolute inset-0 z-[5] flex flex-col items-center justify-center text-center px-6 transition-all duration-[1200ms]"
        style={{
          gap: 24,
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(24px)',
          pointerEvents: showContent ? 'auto' : 'none',
        }}
      >
        <span
          className="text-[11px] tracking-[0.4em] uppercase font-semibold inline-flex items-center gap-3.5"
          style={{ color: 'var(--foreground)' }}
        >
          <span className="inline-block w-8 h-px" style={{ background: 'var(--foreground)', opacity: 0.6 }} />
          The Industrial Marketplace
          <span className="inline-block w-8 h-px" style={{ background: 'var(--foreground)', opacity: 0.6 }} />
        </span>

        <h1
          className="font-normal text-white"
          style={{
            fontFamily: "'Bebas Neue', Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(64px, 12vw, 192px)',
            lineHeight: 0.9,
            letterSpacing: '0.015em',
            textShadow: '0 6px 40px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          Every Part
          <br />
          <span style={{ color: 'var(--foreground)' }}>Has Value.</span>
        </h1>

        <p
          className="uppercase font-medium text-white/80"
          style={{
            fontSize: 'clamp(13px, 1.6vw, 18px)',
            letterSpacing: '0.18em',
            textShadow: '0 2px 12px rgba(0,0,0,0.6)',
          }}
        >
          <span>Find.</span>
          <span className="mx-3.5" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            /
          </span>
          <span>List.</span>
          <span className="mx-3.5" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            /
          </span>
          <span>Trade.</span>
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation()
            enterSite()
          }}
          className="inline-flex items-center gap-3 px-9 py-[18px] mt-3.5 font-bold uppercase cursor-pointer border-none transition-all duration-200"
          style={{
            background: 'var(--foreground)',
            color: 'var(--background)',
            fontSize: 13,
            letterSpacing: '0.24em',
            boxShadow: '0 10px 28px -10px color-mix(in srgb, var(--foreground) 35%, transparent)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'color-mix(in srgb, var(--foreground) 88%, var(--background))'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow =
              '0 16px 36px -10px color-mix(in srgb, var(--foreground) 45%, transparent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--foreground)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow =
              '0 10px 28px -10px color-mix(in srgb, var(--foreground) 35%, transparent)'
          }}
        >
          Start Scraping
          <ArrowRight size={14} strokeWidth={2.5} />
        </button>

        <div className="text-[10px] tracking-[0.24em] uppercase text-white/35 mt-2">
          Press <kbd className="px-1.5 py-0.5 mx-1 border border-white/15 rounded text-white/60">Enter</kbd> to continue
        </div>
      </div>

      {/* bottom HUD */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[6] flex items-center justify-between px-8 py-5 pointer-events-none text-[10px] tracking-[0.28em] uppercase text-white/45 tabular-nums transition-opacity duration-700"
        style={{ opacity: showHud ? 1 : 0 }}
      >
        <div className="hidden sm:block">
          Frame <strong className="text-white/85 font-semibold tabular-nums">{String(currentFrame).padStart(3, '0')}</strong> / 240
        </div>
        <div>24 FPS · {paused ? 'PAUSED' : 'LIVE'}</div>
      </div>

      {/* Skip intro — always visible top-right after load */}
      {ready && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            skipSplash()
          }}
          className="absolute top-6 right-32 z-[7] text-[10px] tracking-[0.28em] uppercase text-white/50 hover:text-[var(--foreground)] cursor-pointer transition-colors hidden md:block"
        >
          Skip intro →
        </button>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </section>
  )
}
