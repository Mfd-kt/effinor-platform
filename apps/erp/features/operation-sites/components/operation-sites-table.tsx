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
import { SITE_KIND_LABELS } from "@/features/operation-sites/constants";
import type { OperationSiteListRow } from "@/features/operation-sites/types";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SiteKind } from "@/types/database.types";

type OperationSitesTableProps = {
  data: OperationSiteListRow[];
};

function formatNum(n: number | null | undefined, suffix = ""): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n)}${suffix}`;
}

export function OperationSitesTable({ data }: OperationSitesTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);

  const columns = useMemo<ColumnDef<OperationSiteListRow>[]>(
    () => [
      {
        accessorKey: "label",
        header: "Libellé",
        cell: ({ getValue }) => (
          <span className="max-w-[200px] font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "operation",
        header: "Opération",
        accessorFn: (row) => row.operation_reference ?? "",
        cell: ({ row }) => (
          <span className="max-w-[160px] truncate font-mono text-xs text-muted-foreground">
            {row.original.operation_reference ?? "—"}
          </span>
        ),
      },
      {
        id: "beneficiary",
        header: "Bénéficiaire",
        accessorFn: (row) => row.beneficiary_company_name ?? "",
        cell: ({ row }) => (
          <span className="max-w-[180px] truncate text-muted-foreground text-sm">
            {row.original.beneficiary_company_name ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "site_kind",
        header: "Type",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.site_kind ? SITE_KIND_LABELS[row.original.site_kind as SiteKind] : "—"}
          </span>
        ),
      },
      {
        accessorKey: "building_type",
        header: "Bâtiment",
        cell: ({ getValue }) => (
          <span className="max-w-[120px] truncate text-muted-foreground text-sm">
            {getValue<string | null>() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "area_m2",
        header: "Surface m²",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground text-sm">
            {formatNum(getValue<number | null>())}
          </span>
        ),
      },
      {
        accessorKey: "height_m",
        header: "Hauteur m",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground text-sm">
            {formatNum(getValue<number | null>())}
          </span>
        ),
      },
      {
        accessorKey: "heating_system_type",
        header: "Chauffage",
        cell: ({ getValue }) => (
          <span className="max-w-[140px] truncate text-muted-foreground text-sm">
            {getValue<string | null>() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "is_primary",
        header: "Principal",
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<boolean>() ? "Oui" : "Non"}</span>
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
              onClick={() => router.push(`/operation-sites/${row.original.id}`)}
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
