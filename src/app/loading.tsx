export default function Loading() {
  return (
    <div className="flex-1 p-8 space-y-6 bg-canvas text-ink animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between pb-6 border-b border-hairline/60">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-surface-2 rounded-md" />
          <div className="h-3.5 w-80 bg-surface-2/60 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-surface-2 rounded-md" />
          <div className="h-8 w-32 bg-primary/20 rounded-md" />
        </div>
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="h-8 w-72 bg-surface-2 rounded-md" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-surface-2 rounded-md" />
          <div className="h-8 w-20 bg-surface-2 rounded-md" />
        </div>
      </div>

      {/* Content Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-surface-1 border border-hairline p-5 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-surface-2 rounded" />
              <div className="h-4 w-12 bg-surface-2 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-surface-2/60 rounded" />
              <div className="h-3 w-4/5 bg-surface-2/60 rounded" />
            </div>
            <div className="pt-3 border-t border-hairline/60 flex items-center justify-between">
              <div className="h-3 w-16 bg-surface-2/40 rounded" />
              <div className="h-3 w-20 bg-surface-2/40 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
