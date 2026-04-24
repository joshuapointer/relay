/**
 * SkeletonCard — loading placeholder for a shipment list item.
 * a11y: aria-busy=true, role=status so assistive tech knows content is loading.
 */
export function SkeletonCard() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading shipment"
      className="animate-pulse rounded-lg bg-surface p-4 shadow-card"
    >
      {/* Top row: status pill + timestamp */}
      <div className="mb-3 flex items-center gap-3">
        <div className="h-6 w-24 rounded-pill bg-neutral" />
        <div className="h-4 w-32 rounded bg-neutral" />
      </div>

      {/* Middle row: tracking number */}
      <div className="mb-2 h-4 w-48 rounded bg-neutral" />

      {/* Bottom row: carrier badge */}
      <div className="h-4 w-20 rounded bg-neutral" />
    </div>
  );
}

/** Renders N skeleton cards while a list is loading */
export function SkeletonList({ count = 3 }: { count?: number }) {
  // Key by index is intentional — skeletons have no stable id
  return (
    <div className="flex flex-col gap-3" aria-label="Loading shipments">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
