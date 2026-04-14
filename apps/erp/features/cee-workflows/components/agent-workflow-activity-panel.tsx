"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  crmFormatUpdated,
  workflowStatusBadgeVariant,
  workflowStatusLabel,
} from "@/features/cee-workflows/components/workflow-crm-queue-tools";
import type { CrmSortKey } from "@/features/cee-workflows/components/workflow-crm-queue-tools";
import type { AgentActivityBuckets, AgentActivityItem } from "@/features/cee-workflows/lib/agent-workflow-activity";
import { cn } from "@/lib/utils";

const AGENT_RESUMABLE_STATUSES = new Set(["draft", "simulation_done"]);

function canResumeInSimulator(status: string): boolean {
  return AGENT_RESUMABLE_STATUSES.has(status);
}

type QueueTab = "drafts" | "validatedToday" | "sentToConfirmateur" | "recent";
type SortKey = Exclude<CrmSortKey, "followUp">;

const TABS: { id: QueueTab; label: string; count: (a: AgentActivityBuckets) => number }[] = [
  { id: "drafts", label: "Brouillons", count: (q) => q.drafts.length },
  { id: "validatedToday", label: "Validés aujourd’hui", count: (q) => q.validatedToday.length },
  { id: "sentToConfirmateur", label: "Chez confirmateur", count: (q) => q.sentToConfirmateur.length },
  { id: "recent", label: "Récents", count: (q) => q.recent.length },
];

function itemsForTab(activity: AgentActivityBuckets, tab: QueueTab): AgentActivityItem[] {
  switch (tab) {
    case "drafts":
      return activity.drafts;
    case "validatedToday":
      return activity.validatedToday;
    case "sentToConfirmateur":
      return activity.sentToConfirmateur;
    default:
      return activity.recent;
  }
}

function filterItems(items: AgentActivityItem[], q: string): AgentActivityItem[] {
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

function sortItems(items: AgentActivityItem[], key: SortKey, dir: "asc" | "desc"): AgentActivityItem[] {
  const d = dir === "desc" ? -1 : 1;
  return [...items].sort((a, b) => {
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

export function AgentWorkflowActivityPanel({
  activity,
  onResume,
}: {
  activity: AgentActivityBuckets;
  onResume: (item: AgentActivityItem) => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<QueueTab>("drafts");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "updated", dir: "desc" });

  const rawItems = useMemo(() => itemsForTab(activity, tab), [activity, tab]);
  const filtered = useMemo(() => filterItems(rawItems, search), [rawItems, search]);
  const rows = useMemo(() => sortItems(filtered, sort.key, sort.dir), [filtered, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key !== key ? { key, dir: key === "company" ? "asc" : "desc" } : { key, dir: s.dir === "desc" ? "asc" : "desc" },
    );
  }

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <CardTitle className="text-lg">Dossiers</CardTitle>
        <CardDescription>
          Uniquement les dossiers dont vous êtes l&apos;agent créateur. Brouillons et simulations non transmises :
          reprenez via <strong>Reprendre</strong>. Dès qu&apos;un dossier est chez le confirmateur ou plus loin, ouvrez la
          fiche avec <strong>Consulter</strong> ou en cliquant la ligne.
        </CardDescription>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Vues dossiers agent">
          {TABS.map((t) => (
            <CrmQueueTabButton
              key={t.id}
              label={t.label}
              count={t.count(activity)}
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
          <Table className="min-w-[960px]">
            <TableHeader className="sticky top-0 z-10 shadow-[0_1px_0_hsl(var(--border))]">
              <TableRow className="border-0 hover:bg-transparent">
                <CrmSortableHead
                  label="Société"
                  active={sort.key === "company"}
                  dir={sort.dir}
                  onToggle={() => toggleSort("company")}
                  className="w-[200px] pl-4"
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
                <TableHead className="min-w-[160px] bg-muted/80 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contact
                </TableHead>
                <CrmSortableHead
                  label="Économie / an"
                  active={sort.key === "saving"}
                  dir={sort.dir}
                  onToggle={() => toggleSort("saving")}
                  className="text-right"
                />
                <CrmSortableHead
                  label="Mise à jour"
                  active={sort.key === "updated"}
                  dir={sort.dir}
                  onToggle={() => toggleSort("updated")}
                />
                <TableHead className="bg-muted/80 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                    {rawItems.length === 0
                      ? "Aucun dossier dans cette vue."
                      : "Aucun résultat pour votre recherche — modifiez le filtre."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((item) => {
                  const resumeOnly = canResumeInSimulator(item.workflowStatus);
                  return (
                  <TableRow
                    key={`${tab}-${item.workflowId}`}
                    className={cn("group", !resumeOnly && "cursor-pointer")}
                    onClick={
                      resumeOnly
                        ? undefined
                        : () => router.push(`/leads/${item.leadId}`)
                    }
                  >
                    <TableCell className="max-w-[200px] pl-4 font-medium" title={item.companyName}>
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
                    <TableCell className="max-w-[180px]">
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
                    <TableCell className="text-muted-foreground tabular-nums text-xs">
                      {crmFormatUpdated(item.updatedAt)}
                    </TableCell>
                    <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap justify-end gap-2">
                        {resumeOnly ? null : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="opacity-90 group-hover:opacity-100"
                            onClick={() => router.push(`/leads/${item.leadId}`)}
                          >
                            Consulter
                          </Button>
                        )}
                        {resumeOnly ? (
                          <Button type="button" size="sm" onClick={() => onResume(item)}>
                            Reprendre
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
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
