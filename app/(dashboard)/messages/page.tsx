import { Navbar } from '@/components/navigation/Navbar'
import { prisma } from '@/lib/prisma'
import { MessageSquare } from 'lucide-react'
import { MessagesClient } from './MessagesClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Messages — ScrapBridge' }

export default async function MessagesPage() {
  // Demo: act as the first company. Production: resolve from session.
  let companyId: string | null = null
  try {
    const company = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } })
    companyId = company?.id ?? null
  } catch {
    companyId = null
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-screen-lg mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare size={20} className="text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Messages</h1>
          </div>

          {companyId ? (
            <MessagesClient companyId={companyId} />
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">
              Database unavailable — start PostgreSQL and seed a company to use messaging.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
