'use client'

import { useState } from 'react'

interface ImageWithShimmerProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Shown briefly while the image is loading. */
  fallbackIcon?: React.ReactNode
}

/**
 * Drop-in <img> replacement that shows a shimmer skeleton until the source loads.
 * Falls back to the provided icon if loading errors out.
 */
export function ImageWithShimmer({
  src,
  alt,
  className,
  fallbackIcon,
  onLoad,
  onError,
  ...rest
}: ImageWithShimmerProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading')

  return (
    <>
      {state !== 'loaded' && (
        <div
          aria-hidden
          className="absolute inset-0 skeleton flex items-center justify-center"
        >
          {state === 'error' && fallbackIcon && (
            <span className="text-[var(--accent)] opacity-40">{fallbackIcon}</span>
          )}
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={className}
        style={{
          opacity: state === 'loaded' ? 1 : 0,
          transition: 'opacity 400ms ease',
          ...(rest.style || {}),
        }}
        onLoad={(e) => {
          setState('loaded')
          onLoad?.(e)
        }}
        onError={(e) => {
          setState('error')
          onError?.(e)
        }}
        {...rest}
      />
    </>
  )
}
