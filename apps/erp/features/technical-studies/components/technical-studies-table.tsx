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
import { STUDY_TYPE_LABELS } from "@/features/technical-studies/constants";
import { TechnicalStudyStatusBadge } from "@/features/technical-studies/components/technical-study-status-badge";
import type { TechnicalStudyListRow } from "@/features/technical-studies/types";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StudyType } from "@/types/database.types";

type TechnicalStudiesTableProps = {
  data: TechnicalStudyListRow[];
};

export function TechnicalStudiesTable({ data }: TechnicalStudiesTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);

  const columns = useMemo<ColumnDef<TechnicalStudyListRow>[]>(
    () => [
      {
        accessorKey: "reference",
        header: "Référence",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "study_type",
        header: "Type",
        cell: ({ getValue }) => (
          <span className="max-w-[180px] text-sm text-muted-foreground">
            {STUDY_TYPE_LABELS[getValue<StudyType>()]}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => <TechnicalStudyStatusBadge status={row.original.status} />,
      },
      {
        id: "document",
        header: "Document principal",
        accessorFn: (row) => row.primary_document_label ?? "",
        cell: ({ row }) => (
          <span className="max-w-[220px] truncate text-muted-foreground text-sm">
            {row.original.primary_document_label ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "study_date",
        header: "Date étude",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground text-xs">
            {formatDateFr(getValue<string | null>())}
          </span>
        ),
      },
      {
        accessorKey: "engineering_office",
        header: "Bureau d’études",
        cell: ({ getValue }) => (
          <span className="max-w-[160px] truncate text-muted-foreground text-sm">
            {getValue<string | null>() ?? "—"}
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
              onClick={() => router.push(`/technical-studies/${row.original.id}`)}
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
