import { CalendarClock, ChevronRight, Phone, StickyNote } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { leadPhoneToTelHref } from "@/features/leads/lib/lead-phone-tel";
import { cn } from "@/lib/utils";

import { getRelanceDisplay, type RelanceBucket } from "../lib/my-queue-follow-up";
import type { MyLeadGenerationQueueItem } from "../queries/get-my-lead-generation-queue";
import { CommercialPipelineBadge } from "./commercial-pipeline-badge";
import { CommercialSlaBadge } from "./commercial-sla-badge";
import { LeadGenerationCommercialPriorityBadge } from "./lead-generation-commercial-priority-badge";
import { LeadGenerationDispatchQueueBadge } from "./lead-generation-dispatch-queue-badge";

type Props = {
  items: MyLeadGenerationQueueItem[];
  /** Affiche la colonne « Fiche CEE » (utile si plusieurs fiches mélangées). */
  showCeeColumn?: boolean;
  /** URL de retour vers la liste (filtres + ancre), transmise au détail. */
  returnToHref?: string;
};

function relanceTextClass(bucket: RelanceBucket): string {
  switch (bucket) {
    case "overdue":
      return "font-semibold text-red-600 dark:text-red-400";
    case "today":
      return "font-semibold text-orange-700 dark:text-orange-300";
    case "tomorrow":
    case "future":
      return "text-foreground/90";
    default:
      return "text-muted-foreground";
  }
}

function buildDetailHref(stockId: string, returnToHref: string | undefined): string {
  if (!returnToHref?.trim()) {
    return `/lead-generation/my-queue/${stockId}`;
  }
  const p = new URLSearchParams();
  p.set("from", returnToHref);
  p.set("focus", stockId);
  return `/lead-generation/my-queue/${stockId}?${p.toString()}`;
}

export function MyLeadGenerationQueueTable({ items, showCeeColumn = false, returnToHref }: Props) {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border/80 bg-card/40 shadow-sm">
        <Table className="w-max min-w-full text-sm">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {showCeeColumn ? (
                <TableHead className="min-w-[140px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Périmètre
                </TableHead>
              ) : null}
              <TableHead className="sticky left-0 z-20 min-w-[200px] bg-muted/90 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-md dark:bg-muted/80">
                Société
              </TableHead>
              <TableHead className="min-w-[132px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Téléphone
              </TableHead>
              <TableHead className="min-w-[100px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ville
              </TableHead>
              <TableHead className="min-w-[148px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Relance
              </TableHead>
              <TableHead className="min-w-[148px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pipeline
              </TableHead>
              <TableHead className="min-w-[120px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                SLA
              </TableHead>
              <TableHead className="min-w-[140px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Score / priorité
              </TableHead>
              <TableHead className="min-w-[120px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                File dispatch
              </TableHead>
              <TableHead className="min-w-[220px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => {
              const telHref = leadPhoneToTelHref(r.phone);
              const rel = getRelanceDisplay(r);
              const overdueRow = r.hasOverdueFollowUp;
              const urgentPriority = r.commercialPriority === "critical" || r.commercialPriority === "high";

              return (
                <TableRow
                  key={r.assignmentId}
                  id={`queue-row-${r.stockId}`}
                  className={cn(
                    "group/row border-border transition-colors",
                    overdueRow &&
                      "border-l-[4px] border-l-red-500 bg-red-500/[0.06] hover:bg-red-500/[0.1] dark:bg-red-500/[0.09] dark:hover:bg-red-500/[0.12]",
                    !overdueRow &&
                      urgentPriority &&
                      "border-l-[4px] border-l-amber-500/70 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] dark:border-l-amber-400/60 dark:bg-amber-500/[0.06] dark:hover:bg-amber-500/[0.09]",
                    !overdueRow && !urgentPriority && "hover:bg-muted/35",
                  )}
                >
                  {showCeeColumn ? (
                    <TableCell className="max-w-[160px] px-3 py-3 align-middle text-sm text-foreground/90 whitespace-normal">
                      {r.ceeSheetDisplay ?? "—"}
                    </TableCell>
                  ) : null}
                  <TableCell
                    className={cn(
                      "sticky left-0 z-10 px-3 py-3 align-middle shadow-[4px_0_12px_-4px_rgba(0,0,0,0.18)] backdrop-blur-sm transition-colors",
                      overdueRow &&
                        "bg-red-500/[0.08] group-hover/row:bg-red-500/[0.12] dark:bg-red-500/[0.12] dark:group-hover/row:bg-red-500/[0.16]",
                      !overdueRow &&
                        urgentPriority &&
                        "bg-amber-500/[0.06] group-hover/row:bg-amber-500/[0.1] dark:bg-amber-500/[0.08] dark:group-hover/row:bg-amber-500/[0.12]",
                      !overdueRow &&
                        !urgentPriority &&
                        "bg-card/95 group-hover/row:bg-muted/75 dark:bg-card/92 dark:group-hover/row:bg-muted/45",
                    )}
                  >
                    <Link
                      href={buildDetailHref(r.stockId, returnToHref)}
                      className="group/link inline-flex max-w-full items-start gap-1 text-sm font-semibold leading-snug text-foreground decoration-primary/55 underline-offset-4 hover:text-primary hover:underline"
                    >
                      <span className="min-w-0 break-words">{r.companyName}</span>
                      <ChevronRight className="mt-0.5 size-4 shrink-0 text-primary opacity-0 transition-opacity group-hover/link:opacity-100" />
                    </Link>
                  </TableCell>
                  <TableCell className="px-3 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground/90 tabular-nums">{r.phone ?? "—"}</span>
                      {telHref ? (
                        <Link
                          href={telHref}
                          aria-label="Appeler"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "icon" }),
                            "h-8 w-8 shrink-0 border-primary/30 text-primary hover:bg-primary/10",
                          )}
                        >
                          <Phone className="size-4" />
                        </Link>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-foreground/90">{r.city ?? "—"}</TableCell>
                  <TableCell
                    className={cn(
                      "max-w-[200px] px-3 py-3 align-middle text-sm whitespace-normal",
                      relanceTextClass(rel.bucket),
                    )}
                  >
                    {rel.label}
                  </TableCell>
                  <TableCell className="max-w-[180px] px-3 py-3 align-middle">
                    <CommercialPipelineBadge status={r.commercialPipelineStatus} compact />
                  </TableCell>
                  <TableCell className="max-w-[140px] px-3 py-3 align-middle">
                    <CommercialSlaBadge status={r.slaStatus} compact />
                  </TableCell>
                  <TableCell className="px-3 py-3 align-middle">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-semibold tabular-nums text-foreground">{r.commercialScore}</span>
                      <LeadGenerationCommercialPriorityBadge priority={r.commercialPriority} />
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3 align-middle">
                    <LeadGenerationDispatchQueueBadge
                      status={r.dispatchQueueStatus}
                      reason={r.dispatchQueueReason}
                      compact
                      tooltipReasonOnly
                    />
                  </TableCell>
                  <TableCell className="px-3 py-3 align-middle">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Link
                        href={buildDetailHref(r.stockId, returnToHref)}
                        className={cn(
                          buttonVariants({ variant: "secondary", size: "sm" }),
                          "h-8 px-2.5 text-xs font-semibold",
                        )}
                      >
                        Ouvrir
                      </Link>
                      {telHref ? (
                        <Link
                          href={telHref}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-8 gap-1 px-2 text-xs font-semibold",
                          )}
                        >
                          <Phone className="size-3.5 shrink-0 opacity-80" aria-hidden />
                          Appeler
                        </Link>
                      ) : null}
                      <Link
                        href={`${buildDetailHref(r.stockId, returnToHref)}#suivi-activite`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "h-8 gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <StickyNote className="size-3.5 shrink-0" aria-hidden />
                        Note
                      </Link>
                      <Link
                        href={`${buildDetailHref(r.stockId, returnToHref)}#suivi-activite`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "h-8 gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground",
                        )}
                        title="Planifier une relance"
                      >
                        <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                        Relance
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="px-1 text-center text-[11px] text-muted-foreground sm:hidden">
        Faites défiler horizontalement pour voir les actions.
      </p>
    </div>
  );
}
