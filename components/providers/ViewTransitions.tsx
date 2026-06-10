'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Wires the View Transitions API into Next.js soft navigations.
 *
 * Next.js navigations happen via fetch + DOM mutation, not full document
 * navigation, so the browser's automatic `@view-transition` rule doesn't
 * fire. We intercept anchor/link clicks and the popstate event, then wrap
 * the resulting navigation in `document.startViewTransition()` so the
 * crossfade keyframes defined in globals.css run.
 *
 * No-ops on browsers without view transition support (Safari, older Firefox).
 */
export function ViewTransitions() {
  const router = useRouter()

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (typeof (document as any).startViewTransition !== 'function') return

    const onClick = (e: MouseEvent) => {
      // Only plain left clicks, no modifier keys
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const target = e.target as HTMLElement | null
      const anchor = target?.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return
      // Skip external links, hashes, mailto/tel, downloads, new-tab
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return
      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#')
      ) return

      // Same path (just hash change etc.) — skip
      const dest = new URL(href, window.location.origin)
      if (dest.pathname === window.location.pathname && dest.search === window.location.search) return

      e.preventDefault()
      ;(document as any).startViewTransition(() => {
        router.push(dest.pathname + dest.search + dest.hash)
        // Return a promise that resolves after the next paint so the
        // transition snapshot captures the new DOM, not the old one.
        return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      })
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [router])

  return null
}
