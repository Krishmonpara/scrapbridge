'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, asChild = false, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none'

    const variants = {
      primary:
        'scan-sweep bg-[var(--foreground)] text-[var(--background)] hover:opacity-88 active:scale-[0.98]',
      secondary:
        'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-accent)] hover:bg-[var(--bg-secondary)]',
      outline:
        'bg-transparent text-[var(--foreground)] border border-[var(--foreground)]/40 hover:border-[var(--foreground)] hover:bg-[var(--accent-glow)]',
      ghost:
        'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
      danger:
        'bg-[var(--danger)] text-white hover:opacity-90 active:scale-[0.98]',
    }

    const sizes = {
      sm: 'h-7 px-3 text-xs rounded-sm',
      md: 'h-9 px-4 text-sm rounded',
      lg: 'h-11 px-6 text-base rounded',
    }

    const Comp = asChild ? Slot : 'button'

    // Slot requires exactly one child — don't add the spinner when delegating to a child element
    const content = asChild ? (
      children
    ) : (
      <>
        {loading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </>
    )

    return (
      <Comp
        ref={ref as any}
        disabled={!asChild && (disabled || loading)}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {content}
      </Comp>
    )
  }
)

Button.displayName = 'Button'
export { Button }
