'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration: number
}

interface ToastContextValue {
  toast: (message: string, opts?: { variant?: ToastVariant; duration?: number }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let externalToast: ToastContextValue['toast'] | null = null

/** Imperative API for use outside React (e.g. catch blocks before re-render). */
export function toast(message: string, opts?: { variant?: ToastVariant; duration?: number }) {
  externalToast?.(message, opts)
}

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof CheckCircle2; bg: string; border: string; iconColor: string }> = {
  success: { icon: CheckCircle2, bg: 'rgba(26,140,78,0.12)', border: 'rgba(26,140,78,0.35)', iconColor: '#22c971' },
  error:   { icon: AlertCircle,  bg: 'rgba(140,26,26,0.12)', border: 'rgba(140,26,26,0.35)', iconColor: '#e36464' },
  info:    { icon: Info,         bg: 'rgba(30,111,165,0.12)', border: 'rgba(30,111,165,0.35)', iconColor: '#5fa6dd' },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, opts?: { variant?: ToastVariant; duration?: number }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const duration = opts?.duration ?? 4000
      setToasts((ts) => [...ts, { id, message, variant: opts?.variant ?? 'info', duration }])
      if (duration > 0) setTimeout(() => remove(id), duration)
    },
    [remove]
  )

  useEffect(() => {
    externalToast = push
    return () => {
      externalToast = null
    }
  }, [push])

  return (
    <ToastContext.Provider value={{ toast: push }}>
      {children}
      {/* Viewport */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const { icon: Icon, bg, border, iconColor } = VARIANT_STYLES[t.variant]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-3 px-4 py-3 rounded-md backdrop-blur-md pointer-events-auto"
                style={{
                  background: `linear-gradient(${bg}, ${bg}), rgba(17,24,32,0.85)`,
                  border: `1px solid ${border}`,
                  boxShadow: '0 12px 32px -12px rgba(0,0,0,0.6)',
                }}
              >
                <Icon size={18} style={{ color: iconColor, flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm text-[var(--text-primary)] flex-1 leading-snug">{t.message}</p>
                <button
                  onClick={() => remove(t.id)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback when no provider — use the imperative one
    return { toast: (m: string, o?: any) => toast(m, o) }
  }
  return ctx
}
