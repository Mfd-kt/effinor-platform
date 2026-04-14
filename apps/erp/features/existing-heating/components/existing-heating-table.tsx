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
import type { ExistingHeatingListRow } from "@/features/existing-heating/types";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

type ExistingHeatingTableProps = {
  data: ExistingHeatingListRow[];
};

function formatKw(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n)} kW`;
}

function formatQty(n: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n);
}

export function ExistingHeatingTable({ data }: ExistingHeatingTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);

  const columns = useMemo<ColumnDef<ExistingHeatingListRow>[]>(
    () => [
      {
        id: "model",
        header: "Modèle",
        accessorFn: (row) => row.heating_model_label,
        cell: ({ row }) => (
          <span className="max-w-[280px] text-sm font-medium text-foreground">
            {row.original.heating_model_label}
          </span>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Qté",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{formatQty(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "unit_power_kw",
        header: "Pu. unit.",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground text-sm">
            {formatKw(getValue<number | null>())}
          </span>
        ),
      },
      {
        accessorKey: "total_power_kw",
        header: "Pu. totale",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground text-sm">
            {formatKw(getValue<number | null>())}
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
              onClick={() => router.push(`/existing-heating/${row.original.id}`)}
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
