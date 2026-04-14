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
import { beneficiaryContactLabel } from "@/features/beneficiaries/lib/contact-display";
import type { BeneficiaryRow } from "@/features/beneficiaries/types";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { BeneficiaryStatusBadge } from "./beneficiary-status-badge";

type BeneficiariesTableProps = {
  data: BeneficiaryRow[];
};

export function BeneficiariesTable({ data }: BeneficiariesTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const columns = useMemo<ColumnDef<BeneficiaryRow>[]>(
    () => [
      {
        accessorKey: "company_name",
        header: "Raison sociale",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.company_name}</span>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        accessorFn: (row) => beneficiaryContactLabel(row) ?? "",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {beneficiaryContactLabel(row.original) ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "E-mail",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Téléphone",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "region",
        header: "Région",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => <BeneficiaryStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "created_at",
        header: "Créé le",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground text-sm">
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
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-xs font-semibold uppercase tracking-wide"
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
              onClick={() => router.push(`/beneficiaries/${row.original.id}`)}
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
