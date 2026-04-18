type SourceRow = {
  source: string;
  imported: number;
  accepted: number;
  duplicates: number;
  rejected: number;
  convertedToLead?: number;
};

export function LeadGenerationSourceMetricsTable({ rows }: { rows: SourceRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune donnée source.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/40 text-left">
          <tr>
            <th className="px-3 py-2">Source</th>
            <th className="px-3 py-2">Imported</th>
            <th className="px-3 py-2">Accepted</th>
            <th className="px-3 py-2">Duplicates</th>
            <th className="px-3 py-2">Rejected</th>
            <th className="px-3 py-2">Converted to lead</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.source} className="border-t border-border">
              <td className="px-3 py-2 font-mono text-xs">{row.source}</td>
              <td className="px-3 py-2">{row.imported}</td>
              <td className="px-3 py-2">{row.accepted}</td>
              <td className="px-3 py-2">{row.duplicates}</td>
              <td className="px-3 py-2">{row.rejected}</td>
              <td className="px-3 py-2">{row.convertedToLead ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
