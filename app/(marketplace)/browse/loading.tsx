import { PageShell, SkeletonBar, SkeletonGrid } from '@/components/ui/Skeletons'

export default function BrowseLoading() {
  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <SkeletonBar w={180} h={24} />
        <SkeletonBar w={120} h={32} />
      </div>
      <div className="flex gap-2 mb-6">
        {[80, 100, 90, 70].map((w, i) => (
          <SkeletonBar key={i} w={w} h={28} />
        ))}
      </div>
      <SkeletonGrid count={9} />
    </PageShell>
  )
}
