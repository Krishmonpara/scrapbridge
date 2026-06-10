'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageWithShimmer } from '@/components/ui/ImageWithShimmer'

interface Props {
  photos: string[]
  alt: string
}

export function ListingPhotoGallery({ photos, alt }: Props) {
  const [active, setActive] = useState(0)
  if (!photos.length) return null
  const hero = photos[active]

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full h-80 rounded-md overflow-hidden bg-[var(--bg-tertiary)] border border-[var(--border)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={hero}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <ImageWithShimmer
              src={hero}
              alt={alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-sm bg-black/60 text-xs text-white/80 font-mono">
          {active + 1} / {photos.length}
        </div>
      </div>
      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative h-20 rounded overflow-hidden bg-[var(--bg-tertiary)] transition-all duration-200 cursor-pointer ${
                i === active
                  ? 'border-2 border-[var(--accent)] ring-1 ring-[var(--accent)]/30'
                  : 'border border-[var(--border)] hover:border-[var(--border-accent)] opacity-70 hover:opacity-100'
              }`}
              aria-label={`Show photo ${i + 1}`}
            >
              <ImageWithShimmer
                src={p}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
