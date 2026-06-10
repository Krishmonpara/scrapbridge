'use client'

import { useState, useEffect } from 'react'
import { CommandPalette } from '@/components/ui/CommandPalette'

export function CommandPaletteProvider() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return <CommandPalette open={open} onClose={() => setOpen(false)} />
}
