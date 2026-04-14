"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CrmQueueTabButton,
  CrmSortableHead,
  crmFormatEur,
  crmFormatOptionalDate,
  crmFormatUpdated,
  workflowStatusBadgeVariant,
  workflowStatusLabel,
} from "@/features/cee-workflows/components/workflow-crm-queue-tools";
import type { CrmSortKey } from "@/features/cee-workflows/components/workflow-crm-queue-tools";
import type { CloserQueueBuckets, CloserQueueItem } from "@/features/cee-workflows/lib/closer-workflow-activity";
import type { CloserQueueTab } from "@/features/cee-workflows/lib/closer-paths";

type QueueTab = CloserQueueTab;

const TABS: { id: QueueTab; label: string; count: (q: CloserQueueBuckets) => number }[] = [
  { id: "pending", label: "À closer", count: (q) => q.pending.length },
  { id: "waitingSignature", label: "Signature", count: (q) => q.waitingSignature.length },
  { id: "followUps", label: "Relances", count: (q) => q.followUps.length },
  { id: "signed", label: "Signés", count: (q) => q.signed.length },
  { id: "lost", label: "Perdus", count: (q) => q.lost.length },
];

const TAB_IDS = new Set<QueueTab>(["pending", "waitingSignature", "followUps", "signed", "lost"]);

function itemsForTab(queue: CloserQueueBuckets, tab: QueueTab): CloserQueueItem[] {
  switch (tab) {
    case "pending":
      return queue.pending;
    case "waitingSignature":
      return queue.waitingSignature;
    case "followUps":
      return queue.followUps;
    case "signed":
      return queue.signed;
    default:
      return queue.lost;
  }
}

function filterItems(items: CloserQueueItem[], q: string): CloserQueueItem[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => {
    const hay = [
      item.companyName,
      item.contactName,
      item.phone,
      item.email,
      item.sheetCode,
      item.sheetLabel,
      item.workflowStatus,
      workflowStatusLabel(item.workflowStatus),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(needle);
  });
}

function compareFollowUp(a: string | null, b: string | null, dir: "asc" | "desc"): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const c = a.localeCompare(b);
  return dir === "desc" ? -c : c;
}

function sortItems(items: CloserQueueItem[], key: CrmSortKey, dir: "asc" | "desc"): CloserQueueItem[] {
  const d = dir === "desc" ? -1 : 1;
  return [...items].sort((a, b) => {
    if (key === "followUp") {
      return compareFollowUp(a.nextFollowUpAt, b.nextFollowUpAt, dir);
    }
    if (key === "updated") {
      return d * a.updatedAt.localeCompare(b.updatedAt);
    }
    if (key === "company") {
      return d * a.companyName.localeCompare(b.companyName, "fr", { sensitivity: "base" });
    }
    if (key === "saving") {
      const av = a.savingEuro ?? -Infinity;
      const bv = b.savingEuro ?? -Infinity;
      if (av === bv) return 0;
      return d * (av < bv ? -1 : 1);
    }
    const av = a.score ?? -Infinity;
    const bv = b.score ?? -Infinity;
    if (av === bv) return 0;
    return d * (av < bv ? -1 : 1);
  });
}

export function CloserWorkflowQueue({
  queue,
  onOpen,
  initialQueueTab,
}: {
  queue: CloserQueueBuckets;
  onOpen: (item: CloserQueueItem) => void;
  initialQueueTab?: CloserQueueTab | null;
}) {
  const [tab, setTab] = useState<QueueTab>(() =>
    initialQueueTab && TAB_IDS.has(initialQueueTab) ? initialQueueTab : "pending",
  );
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: CrmSortKey; dir: "asc" | "desc" }>({ key: "updated", dir: "desc" });

  const rawItems = useMemo(() => itemsForTab(queue, tab), [queue, tab]);
  const filtered = useMemo(() => filterItems(rawItems, search), [rawItems, search]);
  const rows = useMemo(() => sortItems(filtered, sort.key, sort.dir), [filtered, sort]);

  function toggleSort(key: CrmSortKey) {
    setSort((s) =>
      s.key !== key
        ? {
            key,
            dir: key === "company" || key === "followUp" ? "asc" : "desc",
          }
        : { key, dir: s.dir === "desc" ? "asc" : "desc" },
    );
  }

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <CardTitle className="text-lg">Dossiers</CardTitle>
        <CardDescription>
          Pipeline closer en tableau. Cliquez une ligne ou <strong>Ouvrir</strong> pour la fiche lead complète
          (relances, envoi d&apos;accord, signature).
        </CardDescription>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Étapes closer">
          {TABS.map((t) => (
            <CrmQueueTabButton
              key={t.id}
              label={t.label}
              count={t.count(queue)}
              active={tab === t.id}
              onClick={() => setTab(t.id)}
            />
          ))}
        </div>
        <div className="relative mt-4 max-w-md">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher société, contact, téléphone, fiche…"
            className="h-9 pl-9"
            aria-label="Filtrer les dossiers"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[min(70vh,720px)] overflow-auto">
          <Table className="min-w-[1080px]">
            <TableHeader className="sticky top-0 z-10 shadow-[0_1px_0_hsl(var(--border))]">
              <TableRow className="border-0 hover:bg-transparent">
                <CrmSortableHead
                  label="Société"
                  active={sort.key === "company"}
                  dir={sort.dir}
                  onToggle={() => toggleSort("company")}
                  className="w-[180px] pl-4"
                />
                <TableHead className="bg-muted/80 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fiche
                </TableHead>
                <TableHead className="bg-muted/80 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Statut
                </TableHead>
                <CrmSortableHead
                  label="Score"
                  active={sort.key === "score"}
                  dir={sort.dir}
                  onToggle={() => toggleSort("score")}
                />
                <TableHead className="min-w-[150px] bg-muted/80 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contact
                </TableHead>
                <CrmSortableHead
                  label="Économie / an"
                  active={sort.key === "saving"}
                  dir={sort.dir}
                  onToggle={() => toggleSort("saving")}
                  className="text-right"
                />
                <TableHead className="bg-muted/80 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reste à charge
                </TableHead>
                <CrmSortableHead
                  label="Relance"
                  active={sort.key === "followUp"}
                  dir={sort.dir}
                  onToggle={() => toggleSort("followUp")}
                />
                <CrmSortableHead
                  label="Mise à jour"
                  active={sort.key === "updated"}
                  dir={sort.dir}
                  onToggle={() => toggleSort("updated")}
                />
                <TableHead className="bg-muted/80 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={10} className="h-24 text-center text-sm text-muted-foreground">
                    {rawItems.length === 0
                      ? "Aucun dossier dans cette vue."
                      : "Aucun résultat pour votre recherche — modifiez le filtre."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((item) => (
                  <TableRow
                    key={`${tab}-${item.workflowId}`}
                    className="group cursor-pointer hover:bg-muted/40"
                    onClick={() => onOpen(item)}
                  >
                    <TableCell className="max-w-[180px] pl-4 font-medium" title={item.companyName}>
                      <div className="truncate">{item.companyName}</div>
                      {item.recommendedModel ? (
                        <div
                          className="truncate text-[11px] font-normal text-muted-foreground"
                          title={item.recommendedModel}
                        >
                          {item.recommendedModel}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {item.sheetCode ? (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {item.sheetCode}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={workflowStatusBadgeVariant(item.workflowStatus)}
                        className="whitespace-nowrap text-[10px]"
                      >
                        {workflowStatusLabel(item.workflowStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {typeof item.score === "number" ? Math.round(item.score) : "—"}
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      <div className="truncate text-sm" title={item.contactName ?? ""}>
                        {item.contactName || "—"}
                      </div>
                      {item.phone ? (
                        <div className="truncate text-xs text-muted-foreground tabular-nums">{item.phone}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-emerald-700">
                      {crmFormatEur(item.savingEuro)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {crmFormatEur(item.restToCharge)}
                    </TableCell>
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {crmFormatOptionalDate(item.nextFollowUpAt)}
                    </TableCell>
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {crmFormatUpdated(item.updatedAt)}
                    </TableCell>
                    <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="opacity-90 group-hover:opacity-100"
                        onClick={() => onOpen(item)}
                      >
                        Ouvrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {rows.length > 0 ? (
          <div className="border-t bg-muted/15 px-4 py-2 text-xs text-muted-foreground">
            <span className="tabular-nums">{rows.length}</span> dossier{rows.length > 1 ? "s" : ""}
            {search.trim() && rawItems.length !== rows.length ? (
              <span>
                {" "}
                (filtrés sur <span className="tabular-nums">{rawItems.length}</span>)
              </span>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
