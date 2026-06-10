export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Navbar } from '@/components/navigation/Navbar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { Plus, Eye, MessageSquare } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { CATEGORY_LABELS, UNIT_LABELS } from '@/types'
import { formatDate, formatNumber } from '@/lib/utils'

export default async function MyListingsPage() {
  // In production, filter by auth session. For now, show all as demo.
  let listings: any[] = []
  try {
    listings = await prisma.listing.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { company: { select: { name: true } } },
    })
  } catch {
    listings = []
  }

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (row: any) => (
        <Link href={`/listing/${row.id}`} className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors font-medium line-clamp-1">
          {row.title}
        </Link>
      ),
    },
    {
      key: 'materialCategory',
      header: 'Category',
      render: (row: any) => (
        <span className="text-xs text-[var(--text-secondary)]">
          {CATEGORY_LABELS[row.materialCategory as keyof typeof CATEGORY_LABELS]}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      mono: true,
      render: (row: any) => `${formatNumber(row.quantity)} ${UNIT_LABELS[row.unit as keyof typeof UNIT_LABELS]}`,
    },
    {
      key: 'pricePerUnit',
      header: 'Price',
      mono: true,
      align: 'right' as const,
      render: (row: any) => row.pricePerUnit
        ? <span style={{ color: 'var(--accent)' }}>${row.pricePerUnit}</span>
        : <span className="text-[var(--text-tertiary)]">RFQ</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'SOLD' ? 'steel' : 'default'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'viewCount',
      header: 'Views',
      mono: true,
      align: 'right' as const,
      render: (row: any) => (
        <span className="flex items-center gap-1 justify-end text-[var(--text-tertiary)]">
          <Eye size={11} /> {row.viewCount}
        </span>
      ),
    },
    {
      key: 'inquiryCount',
      header: 'Inquiries',
      mono: true,
      align: 'right' as const,
      render: (row: any) => (
        <span className="flex items-center gap-1 justify-end text-[var(--text-tertiary)]">
          <MessageSquare size={11} /> {row.inquiryCount}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Posted',
      render: (row: any) => (
        <span className="text-xs text-[var(--text-tertiary)]">{formatDate(row.createdAt)}</span>
      ),
    },
  ]

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Listings</h1>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">{listings.length} total listings</p>
            </div>
            <Button asChild>
              <Link href="/post-listing"><Plus size={16} /> New Listing</Link>
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={listings}
            keyField="id"
            emptyMessage="No listings yet. Post your first listing to get started."
          />
        </div>
      </div>
    </>
  )
}
