import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  /** Lucide icon component, rendered inside a bordered circle. */
  icon: LucideIcon
  /** One-line headline. */
  title: string
  /** Supporting description. */
  description?: string
  /** Optional CTA — typically a <Button asChild><Link href=…/></Button>. */
  action?: ReactNode
  /** Optional secondary CTA. */
  secondaryAction?: ReactNode
  /** Pads the inner content; default 'lg'. */
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { padding: 'py-12', iconBox: 'w-12 h-12', iconSize: 22, title: 'text-base', desc: 'text-xs' },
  md: { padding: 'py-16', iconBox: 'w-14 h-14', iconSize: 26, title: 'text-lg',  desc: 'text-sm' },
  lg: { padding: 'py-24', iconBox: 'w-16 h-16', iconSize: 28, title: 'text-xl',  desc: 'text-sm' },
} as const

/**
 * Consistent empty state used across the app. Icon-in-a-circle on a dashed
 * card with a headline, supporting copy, and optional CTAs. Replaces the
 * previous "No items found" plain-text placeholders.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'lg',
}: EmptyStateProps) {
  const s = SIZES[size]
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 ${s.padding} rounded-md bg-[var(--card)] border border-dashed border-[var(--border)]`}
    >
      <div
        className={`${s.iconBox} rounded-full flex items-center justify-center mb-4 bg-[var(--muted)] border border-[var(--border)]`}
      >
        <Icon size={s.iconSize} strokeWidth={1.5} className="text-[var(--muted-foreground)]" />
      </div>
      <p className={`${s.title} font-semibold text-[var(--foreground)] mb-1.5`}>{title}</p>
      {description && (
        <p className={`${s.desc} text-[var(--muted-foreground)] max-w-sm leading-relaxed`}>{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 mt-5">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}
