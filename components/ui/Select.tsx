import { forwardRef, SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full h-9 appearance-none bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-sm pl-3 pr-8 transition-colors duration-150',
              'hover:border-[var(--border-accent)] focus:border-[var(--accent)] focus:outline-none',
              error && 'border-[var(--danger)]',
              className
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]"
          />
        </div>
        {error && <p className="text-xs text-[#c43a3a]">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
export { Select }
