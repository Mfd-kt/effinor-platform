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
import { DOCUMENT_TYPE_LABELS } from "@/features/documents/constants";
import {
  DocumentComplianceIndicator,
  DocumentSignIndicator,
  DocumentStatusBadge,
} from "@/features/documents/components/document-status-badge";
import type { DocumentListRow } from "@/features/documents/types";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DocumentType } from "@/types/database.types";

type DocumentsTableProps = {
  data: DocumentListRow[];
};

export function DocumentsTable({ data }: DocumentsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);

  const columns = useMemo<ColumnDef<DocumentListRow>[]>(
    () => [
      {
        accessorKey: "document_type",
        header: "Type",
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-foreground">
            {DOCUMENT_TYPE_LABELS[getValue<DocumentType>()]}
          </span>
        ),
      },
      {
        accessorKey: "document_subtype",
        header: "Sous-type",
        cell: ({ getValue }) => (
          <span className="max-w-[140px] truncate text-muted-foreground text-sm">
            {getValue<string | null>() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "document_status",
        header: "Statut",
        cell: ({ row }) => <DocumentStatusBadge status={row.original.document_status} />,
      },
      {
        accessorKey: "issued_at",
        header: "Émis le",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground text-xs">
            {formatDateFr(getValue<string | null>())}
          </span>
        ),
      },
      {
        accessorKey: "signed_at",
        header: "Signé le",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground text-xs">
            {formatDateFr(getValue<string | null>())}
          </span>
        ),
      },
      {
        id: "sign_client",
        header: "S. client",
        cell: ({ row }) => (
          <DocumentSignIndicator label="Signé client" value={row.original.is_signed_by_client} />
        ),
      },
      {
        id: "sign_company",
        header: "S. EFFINOR",
        cell: ({ row }) => (
          <DocumentSignIndicator label="Signé entreprise" value={row.original.is_signed_by_company} />
        ),
      },
      {
        id: "compliant",
        header: "Conformité",
        cell: ({ row }) => <DocumentComplianceIndicator value={row.original.is_compliant} />,
      },
      {
        accessorKey: "version",
        header: "V.",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground text-sm">{getValue<number>()}</span>
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
              onClick={() => router.push(`/documents/${row.original.id}`)}
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
