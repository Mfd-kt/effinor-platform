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
import type { InstalledProductListRow } from "@/features/installed-products/types";
import { formatDateFr, formatEur } from "@/lib/format";
import { cn } from "@/lib/utils";

type InstalledProductsTableProps = {
  data: InstalledProductListRow[];
};

export function InstalledProductsTable({ data }: InstalledProductsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);

  const columns = useMemo<ColumnDef<InstalledProductListRow>[]>(
    () => [
      {
        id: "product",
        header: "Produit",
        accessorFn: (row) => row.product_label ?? "",
        cell: ({ row }) => (
          <span className="max-w-[220px] truncate font-medium text-sm text-foreground">
            {row.original.product_label ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Qté",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{String(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "unit_price_ht",
        header: "PU HT",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-muted-foreground">
            {formatEur(getValue<number | null>())}
          </span>
        ),
      },
      {
        accessorKey: "total_price_ht",
        header: "Total HT",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{formatEur(getValue<number | null>())}</span>
        ),
      },
      {
        accessorKey: "unit_power_w",
        header: "Puiss. unit. (W)",
        cell: ({ getValue }) => {
          const v = getValue<number | null>();
          return (
            <span className="tabular-nums text-muted-foreground text-sm">
              {v != null ? String(v) : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "cee_sheet_code",
        header: "Fiche CEE",
        cell: ({ getValue }) => (
          <span className="max-w-[100px] truncate font-mono text-xs text-muted-foreground">
            {getValue<string | null>() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "valuation_amount",
        header: "Valorisation",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-muted-foreground">
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
              onClick={() => router.push(`/installed-products/${row.original.id}`)}
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
