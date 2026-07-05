import Link from 'next/link'
import { Navbar } from '@/components/navigation/Navbar'
import { Button } from '@/components/ui/Button'
import { Home, Search } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <>
      <Navbar />
      <div
        className="pt-16 min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center max-w-md">
          <p
            className="text-8xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', opacity: 0.3 }}
          >
            404
          </p>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
            Page Not Found
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mb-8 leading-relaxed">
            The listing, company, or page you&apos;re looking for doesn&apos;t exist
            or may have been removed.
          </p>
          <div className="flex items-center gap-3 justify-center">
            <Button variant="secondary" asChild>
              <Link href="/home">
                <Home size={16} /> Go Home
              </Link>
            </Button>
            <Button asChild>
              <Link href="/browse">
                <Search size={16} /> Browse Listings
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
