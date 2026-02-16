export default function DashboardLoading() {
  return (
    <div className="flex min-h-dvh bg-gray-50 dark:bg-gray-950">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 gap-4">
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="space-y-2 mt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 dark:bg-gray-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TopBar skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="size-8 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="size-8 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Hero skeleton */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 lg:p-10 space-y-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-12 w-full max-w-lg bg-gray-200 dark:bg-gray-800 rounded-xl mt-4 animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <div className="size-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="size-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                <div className="h-5 w-14 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
              </div>
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
