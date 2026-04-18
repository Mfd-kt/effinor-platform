type Item = { key: string; count: number };

export function LeadGenerationStatusBreakdown({
  title,
  items,
}: {
  title: string;
  items: Item[];
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Aucune donnée.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-foreground">{item.key}</span>
              <span className="text-muted-foreground">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
