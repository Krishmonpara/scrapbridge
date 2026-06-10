interface LiveDotProps {
  /** Color of the dot. Defaults to `var(--foreground)` so it inherits the theme. */
  color?: string
  /** Size in pixels. Defaults to 6. */
  size?: number
  /** Optional className for the wrapping span. */
  className?: string
  /** Optional label that sits to the right of the dot. */
  label?: string
}

/**
 * A small pulsing dot used to signal "live", "active", "now". The outer ring
 * radiates outward continuously while the inner dot stays solid.
 */
export function LiveDot({ color = 'var(--foreground)', size = 6, className, label }: LiveDotProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`} aria-live="polite">
      <span
        className="relative inline-block shrink-0"
        style={{ width: size, height: size }}
      >
        <span
          className="absolute inset-0 rounded-full live-dot-ring"
          style={{ background: color }}
        />
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: color }}
        />
      </span>
      {label && (
        <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          {label}
        </span>
      )}
      <style>{`
        @keyframes live-dot-pulse {
          0%   { transform: scale(1);   opacity: 0.55; }
          80%  { transform: scale(2.6); opacity: 0; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        .live-dot-ring {
          animation: live-dot-pulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          transform-origin: center;
        }
      `}</style>
    </span>
  )
}
