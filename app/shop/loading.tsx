/**
 * Scoped to /shop deliberately.
 *
 * A loading.tsx at the app root would open a Suspense boundary for every route,
 * making Next.js flush HTTP 200 before pages that call notFound() ever run — so
 * /product/<missing> would answer 200 instead of 404. /shop never calls
 * notFound(), so a boundary here is safe.
 */
export default function ShopLoading() {
  return (
    <div className="mw-container py-16">
      <div className="space-y-4">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-9 w-56 rounded" />
      </div>

      <div className="mt-12 flex gap-10">
        <div className="hidden w-60 shrink-0 space-y-6 lg:block">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2.5">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
          ))}
        </div>

        <div className="grid flex-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-3">
              <div className="skeleton aspect-3/4 w-full rounded-lg" />
              <div className="skeleton h-3.5 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading products…</span>
    </div>
  );
}
