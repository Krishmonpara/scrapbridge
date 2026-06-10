import { Suspense } from 'react'
import { BrowseClient } from './BrowseClient'
import { Navbar } from '@/components/navigation/Navbar'

export default function BrowsePage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            <div className="px-6 py-8 max-w-screen-2xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-80 rounded skeleton" />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <BrowseClient />
      </Suspense>
    </>
  )
}
