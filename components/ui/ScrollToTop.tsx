'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.92 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/60 cursor-pointer backdrop-blur-md transition-colors duration-200"
          style={{
            background: 'rgba(17,24,32,0.75)',
            border: '1px solid var(--border-accent)',
            boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5)',
          }}
          aria-label="Scroll to top"
        >
          <ArrowUp size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
