import { PageShell, SkeletonBar } from '@/components/ui/Skeletons'

export default function MessagesLoading() {
  return (
    <PageShell>
      <div className="mb-6">
        <SkeletonBar w={160} h={26} />
      </div>
      <div
        className="grid grid-cols-1 md:grid-cols-[320px_1fr] rounded-sm overflow-hidden"
        style={{ border: '1px solid var(--border)', height: 'calc(100vh - 220px)', minHeight: 420 }}
      >
        <div style={{ borderRight: '1px solid var(--border)' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 76, borderBottom: '1px solid var(--border)' }} />
          ))}
        </div>
        <div className="hidden md:block skeleton" />
      </div>
    </PageShell>
  )
}
