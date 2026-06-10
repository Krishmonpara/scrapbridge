import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full h-9 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm rounded-sm px-3 transition-colors duration-150',
              'hover:border-[var(--border-accent)] focus:border-[var(--accent)] focus:outline-none',
              error && 'border-[var(--danger)] focus:border-[var(--danger)]',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-[#c43a3a]">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export { Input }
