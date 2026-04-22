import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatLeadGenerationBatchCeeHint,
  formatLeadGenerationSourceLabel,
} from "@/features/lead-generation/lib/lead-generation-display";
import type { LeadGenerationImportBatchListItem } from "@/features/lead-generation/queries/get-lead-generation-import-batches";
import { formatDateTimeFr } from "@/lib/format";

import { ImportBatchSyncButton } from "./import-batch-sync-button";
import { SyncLeboncoinImportButton } from "./sync-leboncoin-import-button";

function shortRef(id: string): string {
  return id.length <= 10 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  if (status === "running") return "secondary";
  return "outline";
}

type ImportBatchesTableProps = {
  rows: LeadGenerationImportBatchListItem[];
};

export function ImportBatchesTable({ rows }: ImportBatchesTableProps) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Import</TableHead>
            <TableHead>État</TableHead>
            <TableHead className="hidden sm:table-cell">Côté Apify</TableHead>
            <TableHead className="text-right">Fiches</TableHead>
            <TableHead className="hidden md:table-cell">Créé le</TableHead>
            <TableHead className="w-[200px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const title = row.source_label?.trim() || formatLeadGenerationSourceLabel(row.source);
            const ceeHint = formatLeadGenerationBatchCeeHint(row);
            return (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium leading-tight">{title}</span>
                    {ceeHint ? (
                      <span className="text-[11px] text-muted-foreground" title="Rattachement CEE / équipe">
                        {ceeHint}
                      </span>
                    ) : null}
                    <span className="text-[11px] text-muted-foreground" title={row.id}>
                      Réf. {shortRef(row.id)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(row.status)} className="text-xs capitalize">
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden max-w-[120px] truncate text-sm text-muted-foreground sm:table-cell">
                  {row.external_status ?? "—"}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                  {row.imported_count} / {row.accepted_count} / {row.duplicate_count} / {row.rejected_count}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                  {formatDateTimeFr(row.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Link
                      href={`/lead-generation/imports/${row.id}`}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Détail
                    </Link>
                    {row.source === "leboncoin_immobilier" &&
                    row.status !== "completed" &&
                    row.status !== "failed" ? (
                      <SyncLeboncoinImportButton batchId={row.id} />
                    ) : (
                      <ImportBatchSyncButton batchId={row.id} compact />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        Fiches : importées / acceptées / doublons / rejetées — du plus récent au plus ancien.
      </p>
    </div>
  );
}
