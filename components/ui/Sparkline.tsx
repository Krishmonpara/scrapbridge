// Dependency-free inline SVG trend line. Colors itself by net direction
// (last vs first) using the semantic --up/--down tokens.

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  strokeWidth?: number
  /** force a color instead of deriving from direction */
  color?: string
  /** fill the area under the line with a faint gradient */
  fill?: boolean
  className?: string
}

export function Sparkline({
  data,
  width = 64,
  height = 20,
  strokeWidth = 1.5,
  color,
  fill = false,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} className={className} aria-hidden />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * stepX
    // pad 1px top/bottom so the stroke isn't clipped
    const y = height - 1 - ((v - min) / range) * (height - 2)
    return [x, y] as const
  })

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`

  const direction = data[data.length - 1] >= data[0] ? 'up' : 'down'
  const stroke = color ?? (direction === 'up' ? 'var(--up)' : 'var(--down)')
  const gradId = `spark-${direction}-${width}x${height}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      fill="none"
      aria-hidden
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />
        </>
      )}
      <path
        d={linePath}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
