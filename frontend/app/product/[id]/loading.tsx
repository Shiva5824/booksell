export default function Loading() {
  return (
    <div className="bg-gradient-to-b from-surface-secondary via-surface-bg to-surface-secondary min-h-screen pb-nav">
      <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
        {/* Back Link Skeleton */}
        <div className="mb-6">
          <div className="h-10 w-36 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
        </div>

        {/* Layout Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Left Column Skeleton */}
          <div className="lg:col-span-7 space-y-6">
            {/* Gallery Wrapper Skeleton */}
            <div className="relative overflow-hidden rounded-[32px] bg-slate-200 dark:bg-slate-800/60 aspect-[4/3] shadow-soft" />

            {/* Thumbnail Skeleton */}
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square h-20 w-20 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
              ))}
            </div>

            {/* Mobile-only Header Skeleton */}
            <div className="block lg:hidden rounded-[32px] bg-white dark:bg-white/5 border border-border/10 p-5 sm:p-6 shadow-soft space-y-4">
              <div className="flex gap-2">
                <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800/60" />
                <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800/60" />
              </div>
              <div className="h-8 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800/60" />
              <div className="h-10 w-1/3 rounded-lg bg-slate-200 dark:bg-slate-800/60" />
              <div className="h-12 w-full rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
              <div className="h-24 w-full rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
            </div>

            {/* Description Skeleton */}
            <div className="rounded-[32px] border border-border/10 bg-white dark:bg-white/5 p-6 sm:p-8 shadow-soft space-y-4">
              <div className="h-6 w-40 rounded-lg bg-slate-200 dark:bg-slate-800/60" />
              <div className="h-px bg-border/5" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800/60" />
                <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800/60" />
                <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-800/60" />
              </div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="hidden lg:block lg:col-span-5 space-y-6">
            {/* Info Card Skeleton */}
            <div className="rounded-[32px] border border-border/10 bg-white dark:bg-white/5 p-6 sm:p-8 shadow-soft space-y-6">
              <div className="flex gap-2">
                <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800/60" />
                <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800/60" />
              </div>
              <div className="h-10 w-5/6 rounded-lg bg-slate-200 dark:bg-slate-800/60" />
              <div className="h-12 w-1/2 rounded-lg bg-slate-200 dark:bg-slate-800/60" />
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
                ))}
              </div>
            </div>

            {/* Pickup Location Skeleton */}
            <div className="rounded-[32px] border border-border/10 bg-white dark:bg-white/5 p-6 sm:p-8 shadow-soft space-y-4">
              <div className="h-6 w-36 rounded-lg bg-slate-200 dark:bg-slate-800/60" />
              <div className="h-20 w-full rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
              <div className="h-12 w-full rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
            </div>

            {/* Seller Info Skeleton */}
            <div className="rounded-[32px] border border-border/10 bg-white dark:bg-white/5 p-6 sm:p-8 shadow-soft space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-800/60 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-1/2 rounded bg-slate-200 dark:bg-slate-800/60" />
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800/60" />
                </div>
              </div>
              <div className="h-24 w-full rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
