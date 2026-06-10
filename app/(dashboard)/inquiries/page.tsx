import Link from 'next/link'
import { Navbar } from '@/components/navigation/Navbar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { MessageSquare, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getInquiries() {
  try {
    // Demo: show inquiries for the first company. Production: filter by session.
    const company = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!company) return { received: [], sent: [] }

    const [received, sent] = await Promise.all([
      prisma.inquiry.findMany({
        where: { toCompanyId: company.id },
        include: {
          listing: { select: { id: true, title: true } },
          fromCompany: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inquiry.findMany({
        where: { fromCompanyId: company.id },
        include: {
          listing: { select: { id: true, title: true } },
          toCompany: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return { received, sent }
  } catch {
    return { received: [], sent: [] }
  }
}

export default async function InquiriesPage() {
  const { received, sent } = await getInquiries()

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-screen-lg mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-8">
            <MessageSquare size={20} className="text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Inquiries</h1>
          </div>

          <div className="flex flex-col gap-8">
            {/* Received */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Received
                </h2>
                {received.length > 0 && (
                  <span
                    className="w-5 h-5 rounded-full text-xs flex items-center justify-center text-white font-semibold"
                    style={{ background: 'var(--accent)' }}
                  >
                    {received.filter((i) => i.status === 'PENDING').length}
                  </span>
                )}
              </div>

              {received.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  size="md"
                  title="No inquiries received yet"
                  description="When buyers contact you about your listings, their messages will land here."
                />
              ) : (
                <div className="rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  {received.map((inq, i) => (
                    <div
                      key={inq.id}
                      className="flex items-start gap-4 px-4 py-4 hover:bg-[var(--bg-tertiary)] transition-colors"
                      style={{
                        background: inq.status === 'PENDING' ? 'rgba(255,255,255,0.04)' : 'var(--bg-secondary)',
                        borderBottom: i < received.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-sm flex items-center justify-center font-bold text-sm shrink-0"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--accent)' }}
                      >
                        {inq.fromCompany?.name[0] ?? '?'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <Link
                            href={`/company/${inq.fromCompany?.slug}`}
                            className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                          >
                            {inq.fromCompany?.name}
                          </Link>
                          <Badge
                            variant={
                              inq.status === 'PENDING' ? 'amber'
                              : inq.status === 'RESPONDED' ? 'success'
                              : 'default'
                            }
                          >
                            {inq.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] mb-1">
                          Re:{' '}
                          <Link href={`/listing/${inq.listing?.id}`} className="hover:text-[var(--accent)] transition-colors">
                            {inq.listing?.title}
                          </Link>
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          {inq.message}
                        </p>
                        {inq.contactEmail && (
                          <p className="text-xs text-[var(--steel-blue)] mt-1">
                            Reply to:{' '}
                            <a href={`mailto:${inq.contactEmail}`} className="hover:underline">
                              {inq.contactEmail}
                            </a>
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs text-[var(--text-tertiary)]">{formatDate(inq.createdAt)}</p>
                        {inq.contactEmail && (
                          <a
                            href={`mailto:${inq.contactEmail}?subject=Re: ${inq.listing?.title ?? 'Your inquiry'}`}
                            className="inline-flex items-center gap-1 mt-2 text-xs text-[var(--accent)] hover:underline"
                          >
                            Reply <ArrowRight size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Sent */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
                Sent
              </h2>

              {sent.length === 0 ? (
                <EmptyState
                  icon={ArrowRight}
                  size="sm"
                  title="No sent inquiries yet"
                  description="Reach out to a seller on any listing — your sent messages will be tracked here."
                />
              ) : (
                <div className="rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  {sent.map((inq, i) => (
                    <div
                      key={inq.id}
                      className="flex items-start gap-4 px-4 py-4 hover:bg-[var(--bg-tertiary)] transition-colors"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderBottom: i < sent.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-sm flex items-center justify-center font-bold text-sm shrink-0"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--steel-blue)' }}
                      >
                        {inq.toCompany?.name[0] ?? '?'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <Link
                            href={`/company/${inq.toCompany?.slug}`}
                            className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                          >
                            {inq.toCompany?.name}
                          </Link>
                          <Badge
                            variant={inq.status === 'RESPONDED' ? 'success' : 'default'}
                          >
                            {inq.status === 'PENDING' ? 'Awaiting reply' : inq.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] mb-1">
                          Re:{' '}
                          <Link href={`/listing/${inq.listing?.id}`} className="hover:text-[var(--accent)] transition-colors">
                            {inq.listing?.title}
                          </Link>
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          {inq.message}
                        </p>
                      </div>

                      <p className="text-xs text-[var(--text-tertiary)] shrink-0">{formatDate(inq.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
