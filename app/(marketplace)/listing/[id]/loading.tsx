import { PageShell, SkeletonBar, SkeletonRows } from '@/components/ui/Skeletons'

export default function ListingLoading() {
  return (
    <PageShell>
      <div className="flex gap-8 flex-col lg:flex-row">
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="flex gap-2">
            <SkeletonBar w={60} h={22} />
            <SkeletonBar w={90} h={22} />
          </div>
          <SkeletonBar w="70%" h={28} />
          <div className="skeleton h-64 rounded-sm" />
          <SkeletonRows count={6} h={40} />
        </div>
        <div className="lg:w-96 shrink-0 flex flex-col gap-4">
          <div className="skeleton h-40 rounded-sm" />
          <div className="skeleton h-72 rounded-sm" />
        </div>
      </div>
    </PageShell>
  )
}
