import { PageShell, SkeletonBar, SkeletonRows } from '@/components/ui/Skeletons'

export default function DashboardLoading() {
  return (
    <PageShell>
      <div className="flex items-center justify-between mb-8">
        <SkeletonBar w={200} h={26} />
        <SkeletonBar w={130} h={36} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 rounded-sm" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonRows count={5} h={52} />
        <SkeletonRows count={5} h={52} />
      </div>
    </PageShell>
  )
}
