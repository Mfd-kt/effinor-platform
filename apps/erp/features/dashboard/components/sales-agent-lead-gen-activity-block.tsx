import Link from "next/link";
import { Headphones, History, ListChecks } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AgentLeadGenWorkSummary } from "@/features/lead-generation/queries/get-agent-lead-generation-work-summary";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  call: "Appel",
  email: "E-mail",
  note: "Note",
  follow_up: "Relance",
  status_update: "Statut",
};

function fmtShort(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });
  } catch {
    return iso;
  }
}

type Props = {
  summary: AgentLeadGenWorkSummary;
  periodDescription: string;
  /** Lien fiche LGC (optionnel) */
  myQueueHref?: string;
  variant?: "agent" | "admin";
};

/**
 * Journal synthétique LGC : ce que l’agent a fait (appels, notes) sur la période, distinct des KPI CRM.
 */
export function SalesAgentLeadGenActivityBlock({
  summary,
  periodDescription,
  myQueueHref = "/lead-generation/my-queue",
  variant = "agent",
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Prospection LGC (fiches import)</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {variant === "agent" ? "Votre" : "Son"} activité enregistrée sur les fiches import (appels, notes, relances).{" "}
              {periodDescription}
            </p>
          </div>
          <Link href={myQueueHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}>
            <ListChecks className="size-3.5" aria-hidden />
            Ma file
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">En file maintenant</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{summary.fichesInQueue}</p>
            <p className="text-[11px] text-muted-foreground">Fiches actives à traiter</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Activités (période)</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {summary.activitiesInRange}
            </p>
            <p className="text-[11px] text-muted-foreground">Enregistrements dans le journal</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Headphones className="size-3" aria-hidden />
              Appels (période)
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {summary.callsInRange}
            </p>
            <p className="text-[11px] text-muted-foreground">Lignes type «&nbsp;Appel&nbsp;»</p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <History className="size-3.5" aria-hidden />
            Derniers gestes
          </div>
          {summary.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun appel, note ou relance enregistré{variant === "agent" ? " par vous" : ""} sur cette période — dès
              qu&apos;une action est tracée sur la fiche, elle apparaît ici.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[130px]">Quand</TableHead>
                    <TableHead>Société</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Détail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.recent.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground text-sm tabular-nums">
                        {fmtShort(r.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/lead-generation/my-queue/${r.stockId}`}
                          className="text-foreground hover:text-primary hover:underline"
                        >
                          {r.companyName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{typeLabels[r.activityType] ?? r.activityType}</TableCell>
                      <TableCell className="max-w-[min(100vw,24rem)] text-sm text-muted-foreground">
                        <span className="text-foreground">{r.activityLabel}</span>
                        {r.activityNotes ? (
                          <span className="mt-0.5 line-clamp-2 block text-xs"> {r.activityNotes}</span>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
