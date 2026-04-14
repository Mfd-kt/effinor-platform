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
import { formatDateFr, formatEur } from "@/lib/format";
import { cn } from "@/lib/utils";

import { OperationStatusBadge } from "@/features/operations/components/operation-status-badge";
import type { OperationListRow } from "@/features/operations/types";

type OperationsTableProps = {
  data: OperationListRow[];
};

export function OperationsTable({ data }: OperationsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);

  const columns = useMemo<ColumnDef<OperationListRow>[]>(
    () => [
      {
        accessorKey: "operation_reference",
        header: "Réf.",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "title",
        header: "Désignation",
        cell: ({ getValue }) => (
          <span className="max-w-[200px] truncate font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "beneficiary",
        header: "Bénéficiaire",
        accessorFn: (row) => row.beneficiary_company_name ?? "",
        cell: ({ row }) => (
          <span className="max-w-[160px] truncate text-muted-foreground">
            {row.original.beneficiary_company_name ?? "—"}
          </span>
        ),
      },
      {
        id: "vt_ref",
        header: "VT réf.",
        accessorFn: (row) => row.reference_vt_reference ?? "",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.reference_vt_reference ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "cee_sheet_code",
        header: "Fiche CEE",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "operation_status",
        header: "Statut",
        cell: ({ row }) => <OperationStatusBadge status={row.original.operation_status} />,
      },
      {
        accessorKey: "estimated_prime_amount",
        header: "Prime est.",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground text-sm">
            {formatEur(getValue<number | null>())}
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
              onClick={() => router.push(`/operations/${row.original.id}`)}
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
