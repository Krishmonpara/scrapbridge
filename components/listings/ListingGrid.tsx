'use client'

import { motion } from 'framer-motion'
import { PackageSearch } from 'lucide-react'
import { ListingCard } from './ListingCard'
import { Listing } from '@/types'

interface ListingGridProps {
  listings: (Listing & {
    company: {
      name: string
      verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
      slug: string
    }
  })[]
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.045, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const } },
}

export function ListingGrid({ listings }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-24 rounded-md bg-[var(--bg-secondary)] border border-dashed border-[var(--border)]"
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-[var(--bg-tertiary)] border border-[var(--border)]">
          <PackageSearch size={26} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="text-[var(--text-secondary)] text-base mb-1.5 font-medium">No listings found</p>
        <p className="text-[var(--text-tertiary)] text-sm">Try removing a filter or broadening your search</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      // Reset the animation when the listings array identity changes so subsequent
      // filter changes also animate in.
      key={listings.map((l) => l.id).join(',').slice(0, 200)}
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      {listings.map((listing) => (
        <motion.div key={listing.id} variants={item}>
          <ListingCard listing={listing} />
        </motion.div>
      ))}
    </motion.div>
  )
}
