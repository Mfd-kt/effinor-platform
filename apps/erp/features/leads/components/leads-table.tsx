"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { contactSalutationLine } from "@/features/leads/lib/contact-map";
import {
  leadListFicheCeeCategoryLabel,
  leadListFicheCeeCellTitle,
  leadListFicheCeeSearchHay,
} from "@/features/leads/lib/resolve-lead-commercial-category";
import type { LeadListRow } from "@/features/leads/types";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from "@/features/leads/constants";
import { LEAD_SOURCE_VALUES, LEAD_STATUS_VALUES } from "@/features/leads/schemas/lead.schema";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { LeadStatusBadge } from "./lead-status-badge";

type LeadsTableProps = {
  data: LeadListRow[];
};

function LeadNotationCell({ score }: { score: number | null }) {
  if (score == null || !Number.isFinite(score)) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  const n = Math.round(score);
  const tone =
    n >= 71
      ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100"
      : n >= 41
        ? "bg-amber-500/15 text-amber-950 dark:text-amber-100"
        : "bg-rose-500/15 text-rose-950 dark:text-rose-100";
  return (
    <span
      className={cn(
        "inline-flex min-w-[2.75rem] justify-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
        tone,
      )}
      title="Notation IA (0 à 100)"
    >
      {n}
    </span>
  );
}

const FILTER_ALL = "__all__";

function leadMatchesSearch(lead: LeadListRow, needle: string): boolean {
  if (!needle) return true;
  const q = needle.toLowerCase();
  const hay = [
    lead.display_name,
    lead.company_name,
    lead.civility,
    lead.first_name,
    lead.last_name,
    lead.email,
    lead.phone,
    leadListFicheCeeSearchHay(lead),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function LeadsTable({ data }: LeadsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(FILTER_ALL);
  const [sourceFilter, setSourceFilter] = useState<string>(FILTER_ALL);

  const filteredData = useMemo(() => {
    return data.filter((lead) => {
      if (statusFilter !== FILTER_ALL && lead.lead_status !== statusFilter) {
        return false;
      }
      if (sourceFilter !== FILTER_ALL && lead.source !== sourceFilter) {
        return false;
      }
      if (!leadMatchesSearch(lead, search.trim())) {
        return false;
      }
      return true;
    });
  }, [data, statusFilter, sourceFilter, search]);

  const columns = useMemo<ColumnDef<LeadListRow>[]>(
    () => [
      {
        accessorKey: "display_name",
        header: "Entreprise",
        sortUndefined: "last",
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div>
              <div className="font-medium text-foreground">{lead.display_name}</div>
              {lead.lead_type === "b2b" && lead.company_name?.trim() ? (
                <div className="text-xs text-muted-foreground">{lead.company_name}</div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "contact_name",
        header: "Contact",
        accessorFn: (row) => contactSalutationLine(row) ?? "",
        sortUndefined: "last",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {contactSalutationLine(row.original) ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "E-mail",
        sortUndefined: "last",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Téléphone",
        sortUndefined: "last",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "source",
        header: "Source",
        sortUndefined: "last",
        sortingFn: (rowA, rowB) => {
          const la = LEAD_SOURCE_LABELS[rowA.original.source] ?? rowA.original.source;
          const lb = LEAD_SOURCE_LABELS[rowB.original.source] ?? rowB.original.source;
          return la.localeCompare(lb, "fr", { sensitivity: "base" });
        },
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {LEAD_SOURCE_LABELS[row.original.source]}
          </span>
        ),
      },
      {
        id: "cee_category",
        header: "Catégorie fiche CEE",
        accessorFn: (row) => leadListFicheCeeCategoryLabel(row),
        sortUndefined: "last",
        sortingFn: (rowA, rowB, columnId) => {
          const a = String(rowA.getValue(columnId) ?? "");
          const b = String(rowB.getValue(columnId) ?? "");
          return a.localeCompare(b, "fr", { sensitivity: "base" });
        },
        cell: ({ row }) => (
          <span
            className="max-w-[14rem] truncate text-muted-foreground"
            title={leadListFicheCeeCellTitle(row.original)}
          >
            {leadListFicheCeeCategoryLabel(row.original)}
          </span>
        ),
      },
      {
        accessorKey: "lead_status",
        header: "Statut",
        sortUndefined: "last",
        sortingFn: (rowA, rowB) => {
          const la = LEAD_STATUS_LABELS[rowA.original.lead_status] ?? rowA.original.lead_status;
          const lb = LEAD_STATUS_LABELS[rowB.original.lead_status] ?? rowB.original.lead_status;
          return la.localeCompare(lb, "fr", { sensitivity: "base" });
        },
        cell: ({ row }) => <LeadStatusBadge status={row.original.lead_status} />,
      },
      {
        accessorKey: "ai_lead_score",
        header: "Notation",
        sortUndefined: "last",
        sortingFn: (rowA, rowB, columnId) => {
          const av = rowA.getValue<number | null>(columnId);
          const bv = rowB.getValue<number | null>(columnId);
          const aNull = av == null || !Number.isFinite(av);
          const bNull = bv == null || !Number.isFinite(bv);
          if (aNull && bNull) return 0;
          if (aNull) return 1;
          if (bNull) return -1;
          return (av as number) - (bv as number);
        },
        cell: ({ row }) => <LeadNotationCell score={row.original.ai_lead_score} />,
      },
      {
        accessorKey: "created_at",
        header: "Créé le",
        sortDescFirst: true,
        cell: ({ getValue }) => {
          const iso = getValue<string>();
          const d = iso ? new Date(iso) : null;
          const timeLabel =
            d && !Number.isNaN(d.getTime())
              ? d
                  .toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  .replace(":", "h")
              : null;
          return (
            <div
              className="whitespace-nowrap leading-tight"
              title={iso ? new Date(iso).toLocaleString("fr-FR") : undefined}
            >
              <div className="text-sm text-foreground">{formatDateFr(iso)}</div>
              {timeLabel ? (
                <div className="text-xs text-muted-foreground">{timeLabel}</div>
              ) : null}
            </div>
          );
        },
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const filtersActive =
    search.trim() !== "" || statusFilter !== FILTER_ALL || sourceFilter !== FILTER_ALL;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="leads-search" className="text-xs text-muted-foreground">
            Recherche
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="leads-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Société, contact, e-mail, téléphone, catégorie fiche CEE…"
              className="h-9 pl-9"
              aria-label="Filtrer les leads"
            />
          </div>
        </div>
        <div className="w-full space-y-2 sm:w-[200px]">
          <Label className="text-xs text-muted-foreground">Statut</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? FILTER_ALL)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Tous les statuts</SelectItem>
              {LEAD_STATUS_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {LEAD_STATUS_LABELS[value] ?? value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full space-y-2 sm:w-[220px]">
          <Label className="text-xs text-muted-foreground">Source</Label>
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? FILTER_ALL)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Toutes les sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Toutes les sources</SelectItem>
              {LEAD_SOURCE_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {LEAD_SOURCE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
          <span>
            <span className="font-medium tabular-nums text-foreground">{filteredData.length}</span>
            {filteredData.length === data.length ? (
              <> fiche{filteredData.length > 1 ? "s" : ""}</>
            ) : (
              <>
                {" "}
                sur <span className="tabular-nums">{data.length}</span> fiche{data.length > 1 ? "s" : ""}
              </>
            )}
          </span>
          {filtersActive ? (
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => {
                setSearch("");
                setStatusFilter(FILTER_ALL);
                setSourceFilter(FILTER_ALL);
              }}
            >
              Réinitialiser les filtres
            </button>
          ) : null}
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-semibold uppercase tracking-wide">
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1.5 select-none",
                          header.column.getCanSort() && "cursor-pointer hover:text-foreground",
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() ? (
                          <span className="text-muted-foreground">
                            {header.column.getIsSorted() === "desc" ? (
                              <ArrowDown className="size-3.5 shrink-0" aria-hidden />
                            ) : header.column.getIsSorted() === "asc" ? (
                              <ArrowUp className="size-3.5 shrink-0" aria-hidden />
                            ) : (
                              <ArrowUpDown className="size-3.5 shrink-0 opacity-45" aria-hidden />
                            )}
                          </span>
                        ) : null}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  {data.length === 0
                    ? "Aucun lead."
                    : "Aucun lead ne correspond à ces critères — modifiez la recherche ou les filtres."}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/leads/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
