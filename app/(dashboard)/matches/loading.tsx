import { PageShell, SkeletonBar } from '@/components/ui/Skeletons'

export default function MatchesLoading() {
  return (
    <PageShell>
      <SkeletonBar w={180} h={26} />
      <div className="mt-2 mb-8">
        <SkeletonBar w={380} h={13} />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28 rounded-sm" />
        ))}
      </div>
    </PageShell>
  )
}
