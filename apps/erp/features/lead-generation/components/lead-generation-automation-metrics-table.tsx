type RunRow = {
  id: string;
  automation_type: string;
  status: string;
  created_at: string;
  error_summary: string | null;
};

export function LeadGenerationAutomationMetricsTable({ rows }: { rows: RunRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun run d’automatisation.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted/40 text-left">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Erreur</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border">
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {new Date(row.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
              </td>
              <td className="px-3 py-2 font-mono text-xs">{row.automation_type}</td>
              <td className="px-3 py-2">{row.status}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{row.error_summary ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
