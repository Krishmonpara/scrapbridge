import { PageShell, SkeletonBar, SkeletonRows } from '@/components/ui/Skeletons'

export default function MarketLoading() {
  return (
    <PageShell>
      <SkeletonBar w={240} h={26} />
      <div className="mt-2 mb-8">
        <SkeletonBar w={420} h={13} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-16 rounded-sm" />
        ))}
      </div>
      <SkeletonRows count={10} h={48} />
    </PageShell>
  )
}
