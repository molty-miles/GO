export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-zinc-900 p-4">
      <div className="mb-3 h-4 w-3/4 rounded bg-zinc-800" />
      <div className="mb-4 h-3 w-full rounded bg-zinc-800" />
      <div className="flex items-center justify-between">
        <div className="h-8 w-16 rounded bg-zinc-800" />
        <div className="h-8 w-24 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

export function MarketGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
