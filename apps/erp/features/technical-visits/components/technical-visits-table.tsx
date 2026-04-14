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
import { useMemo, useState } from "react";

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

import { TechnicalVisitStatusBadge } from "@/features/technical-visits/components/technical-visit-status-badge";
import type { TechnicalVisitListRow } from "@/features/technical-visits/types";

type TechnicalVisitsTableProps = {
  data: TechnicalVisitListRow[];
};

export function TechnicalVisitsTable({ data }: TechnicalVisitsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const columns = useMemo<ColumnDef<TechnicalVisitListRow>[]>(
    () => [
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
        cell: ({ row }) => <TechnicalVisitStatusBadge status={row.original.status} />,
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
        accessorKey: "created_at",
        header: "Créé le",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground text-xs">
            {formatDateFr(getValue<string>())}
          </span>
        ),
      },
    ],
    [],
  );

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
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
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
              className="cursor-pointer"
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
