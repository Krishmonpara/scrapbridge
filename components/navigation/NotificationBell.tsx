'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, MessageSquare, Sparkles, Mail } from 'lucide-react'

interface Item {
  id: string
  type: 'message' | 'match' | 'inquiry'
  title: string
  detail: string
  href: string
  createdAt: string
}

const TYPE_ICON = {
  message: MessageSquare,
  match: Sparkles,
  inquiry: Mail,
} as const

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Demo: notify as the first company. Production: resolve from session.
  useEffect(() => {
    fetch('/api/companies?limit=1')
      .then((r) => r.json())
      .then((d) => setCompanyId(d.companies?.[0]?.id ?? null))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    if (!companyId) return
    try {
      const res = await fetch(`/api/notifications?companyId=${companyId}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
        setTotal(data.counts.total)
      }
    } catch {}
  }, [companyId])

  // initial load + slow poll; the bell is ambient, not a websocket
  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors duration-150 relative"
        title="Notifications"
        aria-label={`Notifications${total > 0 ? ` (${total} unread)` : ''}`}
      >
        <Bell size={16} />
        {total > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center tabular-nums"
            style={{ background: 'var(--foreground)', color: 'var(--background)', fontFamily: 'var(--font-display)' }}
          >
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-80 rounded overflow-hidden"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', boxShadow: 'var(--elev-2)' }}
          >
            <div
              className="px-3 py-2 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Notifications
              </span>
              {total > 0 && (
                <span className="text-[10px] tabular-nums text-[var(--text-tertiary)]">{total} unread</span>
              )}
            </div>

            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-[var(--text-tertiary)]">
                You&apos;re all caught up.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto py-1">
                {items.map((item) => {
                  const Icon = TYPE_ICON[item.type]
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <span
                        className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                      >
                        <Icon size={12} className="text-[var(--text-secondary)]" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-medium text-[var(--text-primary)] truncate">
                          {item.title}
                        </span>
                        {item.detail && (
                          <span className="block text-[11px] text-[var(--text-tertiary)] truncate">
                            {item.detail}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] shrink-0 tabular-nums">
                        {timeAgo(item.createdAt)}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
