export function AdminSkeleton() {
  return (
    <div aria-busy className="space-y-6">
      <div className="h-24 w-2/3 animate-pulse rounded-2xl bg-ink-2" />
      <div className="h-12 animate-pulse rounded-2xl bg-ink-2" />
      <div className="h-64 animate-pulse rounded-2xl bg-ink-2" />
    </div>
  );
}
