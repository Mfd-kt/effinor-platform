"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { TechnicalVisitAdminDeleteButton } from "@/features/technical-visits/components/technical-visit-admin-delete-button";
import { TechnicalVisitStatusBadge } from "@/features/technical-visits/components/technical-visit-status-badge";
import { isTechnicalVisitInProgress } from "@/features/technical-visits/lib/visit-in-progress";
import type { TechnicalVisitListRow } from "@/features/technical-visits/types";

type TechnicalVisitsTableProps = {
  data: TechnicalVisitListRow[];
  canAdminDelete?: boolean;
  /**
   * Quand true (ex. onglet « À faire »), conserve l’ordre renvoyé par le serveur (créneau / priorité).
   * Sinon tri par défaut sur la date de création.
   */
  preserveDataOrder?: boolean;
  distanceHeaderLabel?: string;
  className?: string;
};

export function TechnicalVisitsTable({
  data,
  canAdminDelete = false,
  preserveDataOrder = false,
  distanceHeaderLabel = "Distance siège",
  className,
}: TechnicalVisitsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>(() =>
    preserveDataOrder ? [] : [{ id: "created_at", desc: true }],
  );

  const columns = useMemo<ColumnDef<TechnicalVisitListRow>[]>(
    () => [
      ...(canAdminDelete
        ? [
            {
              id: "admin_actions",
              header: () => <span className="sr-only">Supprimer (admin)</span>,
              enableSorting: false,
              cell: ({ row }) => (
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <TechnicalVisitAdminDeleteButton
                    visitId={row.original.id}
                    vtReference={row.original.vt_reference}
                    stopRowNavigation
                  />
                </div>
              ),
            } as ColumnDef<TechnicalVisitListRow>,
          ]
        : []),
      {
        accessorKey: "vt_reference",
        header: "Réf.",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "lead",
        header: "Lead",
        accessorFn: (row) => row.lead_company_name ?? "",
        cell: ({ row }) => (
          <span className="max-w-[180px] truncate font-medium text-foreground">
            {row.original.lead_company_name ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <TechnicalVisitStatusBadge status={row.original.status} />
            {isTechnicalVisitInProgress(row.original) ? (
              <Badge
                variant="outline"
                className="rounded-md border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100"
              >
                En cours
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "scheduled_at",
        header: "Planifiée",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground text-sm">
            {formatDateFr(getValue<string | null>())}
          </span>
        ),
      },
      {
        accessorKey: "performed_at",
        header: "Effectuée",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground text-sm">
            {formatDateFr(getValue<string | null>())}
          </span>
        ),
      },
      {
        id: "technician",
        header: "Technicien",
        accessorFn: (row) => row.technician_label ?? "",
        cell: ({ row }) => (
          <span className="max-w-[140px] truncate text-muted-foreground text-sm">
            {row.original.technician_label ?? "—"}
          </span>
        ),
      },
      {
        id: "zone",
        header: "Région",
        accessorFn: (row) => row.region ?? "",
        cell: ({ row }) => (
          <span className="max-w-[210px] truncate text-muted-foreground text-sm">
            {row.original.region || "—"}
            {row.original.worksite_postal_code ? ` (${row.original.worksite_postal_code})` : ""}
          </span>
        ),
      },
      {
        id: "distance",
        header: distanceHeaderLabel,
        accessorFn: (row) => row.distance_km ?? Number.POSITIVE_INFINITY,
        sortingFn: "basic",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="whitespace-nowrap text-muted-foreground text-sm">
              {row.original.formatted_distance ?? "Distance indisponible"}
            </span>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
              {row.original.visit_location_quality ?? "inconnu"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Créé le",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground text-xs">
            {formatDateFr(getValue<string>())}
          </span>
        ),
      },
    ],
    [canAdminDelete, distanceHeaderLabel],
  );

  useEffect(() => {
    setSorting(preserveDataOrder ? [] : [{ id: "created_at", desc: true }]);
  }, [preserveDataOrder]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]",
        className,
      )}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                >
                  {header.isPlaceholder ? null : (
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1 select-none",
                        header.column.getCanSort() && "cursor-pointer hover:text-foreground",
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc"
                        ? " ↑"
                        : header.column.getIsSorted() === "desc"
                          ? " ↓"
                          : null}
                    </button>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer transition-colors hover:bg-muted/35"
              onClick={() => router.push(`/technical-visits/${row.original.id}`)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
