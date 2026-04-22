import { CheckCircle2, Clock, Loader2, MinusCircle, XCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/shared/status-badge";
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
import { cn } from "@/lib/utils";
import { ImportBatchSyncButton } from "./import-batch-sync-button";
import { SyncLeboncoinImportButton } from "./sync-leboncoin-import-button";

function shortRef(id: string): string {
  return id.length <= 10 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}

type StatusVisual = {
  variant: "success" | "warning" | "danger" | "info" | "neutral";
  Icon: LucideIcon;
  iconClassName?: string;
  label: string;
};

function statusVisual(status: string): StatusVisual {
  const s = status.toLowerCase();
  if (s === "completed") {
    return { variant: "success", Icon: CheckCircle2, label: "Terminé" };
  }
  if (s === "failed") {
    return { variant: "danger", Icon: XCircle, label: "Échec" };
  }
  if (s === "running") {
    return { variant: "info", Icon: Loader2, iconClassName: "animate-spin", label: "En cours" };
  }
  if (s === "pending") {
    return { variant: "warning", Icon: Clock, label: "En attente" };
  }
  if (s === "cancelled" || s === "canceled") {
    return { variant: "neutral", Icon: MinusCircle, label: "Annulé" };
  }
  return { variant: "neutral", Icon: MinusCircle, label: status };
}

type Props = {
  rows: LeadGenerationImportBatchListItem[];
};

export function LeadGenerationRecentImports({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        Aucun import récent. Lancez un scraping ci-dessus pour alimenter le stock.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Import</TableHead>
            <TableHead>État</TableHead>
            <TableHead className="hidden sm:table-cell">Côté Apify</TableHead>
            <TableHead className="text-right">Fiches</TableHead>
            <TableHead className="w-[200px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const label = row.source_label?.trim() || formatLeadGenerationSourceLabel(row.source);
            const ceeHint = formatLeadGenerationBatchCeeHint(row);
            const visual = statusVisual(row.status);
            const StatusIcon = visual.Icon;
            return (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium leading-tight">{label}</span>
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
                  <StatusBadge variant={visual.variant} className="inline-flex items-center gap-1.5">
                    <StatusIcon className={cn("size-3.5", visual.iconClassName)} aria-hidden />
                    {visual.label}
                  </StatusBadge>
                </TableCell>
                <TableCell className="hidden max-w-[120px] truncate text-sm text-muted-foreground sm:table-cell">
                  {row.external_status ?? "—"}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                  {row.imported_count} / {row.accepted_count} / {row.duplicate_count} / {row.rejected_count}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
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
      <p className="border-t border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
        Fiches : importées / acceptées / doublons / rejetées — tri du plus récent au plus ancien.
      </p>
    </div>
  );
}
