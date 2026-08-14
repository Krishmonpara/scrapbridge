import Link from 'next/link'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'
import { auth } from '@/lib/auth'
import { getPosition, getSymbolChoices } from '@/lib/position/queries'
import { PositionClient } from './PositionClient'
import { Briefcase } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Position — ScrapBridge',
  description: 'Mark your inventory to market against live scrap and benchmark prices.',
}

export default async function PositionPage() {
  const session = await auth()
  const companyId = (session?.user as { companyId?: string } | undefined)?.companyId

  // proxy.ts already gates this route, but a signed-in user with no company
  // reaches here legitimately and needs a real explanation rather than a crash.
  if (!companyId) {
    return (
      <>
        <Navbar />
        <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
          <div className="max-w-screen-xl mx-auto px-6 py-16">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Position</h1>
            <p className="text-sm max-w-prose" style={{ color: 'var(--text-secondary)' }}>
              Your account isn&apos;t linked to a company yet. Inventory is tracked per company, so
              add yours in{' '}
              <Link href="/settings" className="text-[var(--accent)] hover:underline">
                settings
              </Link>{' '}
              to start marking lots to market.
            </p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const [position, choices] = await Promise.all([getPosition(companyId), getSymbolChoices()])

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {position.usingSamplePrices && (
          <div
            className="px-6 py-2 text-center text-[11px] uppercase tracking-[0.1em]"
            style={{ background: 'var(--copper)', color: '#0a0a0a', fontFamily: 'var(--font-mono)' }}
          >
            Valued against sample prices — not a live market feed
          </div>
        )}

        <div className="max-w-screen-xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={20} className="text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Position</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-2xl">
            What your pile is worth today, marked against the same series that drives{' '}
            <Link href="/market" className="text-[var(--accent)] hover:underline">
              market intelligence
            </Link>
            . A valuation of your own material — not advice on whether to sell it.
          </p>

          <PositionClient initial={position} choices={choices} />
        </div>
      </div>
      <Footer />
    </>
  )
}
