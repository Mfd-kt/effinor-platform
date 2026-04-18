export default function LeadGenerationAnalyticsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div className="h-16 animate-pulse rounded-lg bg-muted/40" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
