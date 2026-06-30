export function StudioLoadingState({
  count = 3,
  aspect = "4 / 5",
}: {
  count?: number;
  /** CSS aspect-ratio value e.g. "4 / 5" or "16 / 9" */
  aspect?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-line bg-surface"
        >
          <div
            className="w-full bg-surface-2"
            style={{ aspectRatio: aspect }}
          />
          <div className="space-y-2 p-3.5">
            <div className="h-2.5 w-3/4 rounded-full bg-surface-2" />
            <div className="h-2 w-1/2 rounded-full bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
