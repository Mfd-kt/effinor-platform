import { CalendarClock, ChevronRight, Phone } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { leadPhoneToTelHref } from "@/features/leads/lib/lead-phone-tel";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { getRelanceDisplay, type RelanceBucket } from "../lib/my-queue-follow-up";
import type { MyLeadGenerationQueueItem } from "../queries/get-my-lead-generation-queue";
import { LeadGenerationCommercialPriorityBadge } from "./lead-generation-commercial-priority-badge";
import { LeadGenerationDispatchQueueBadge } from "./lead-generation-dispatch-queue-badge";

type Props = {
  items: MyLeadGenerationQueueItem[];
};

function relanceTextClass(bucket: RelanceBucket): string {
  switch (bucket) {
    case "overdue":
      return "font-semibold text-red-600 dark:text-red-400";
    case "today":
      return "font-semibold text-amber-700 dark:text-amber-300";
    case "tomorrow":
    case "future":
      return "text-foreground";
    default:
      return "text-muted-foreground";
  }
}

function companySubline(item: MyLeadGenerationQueueItem): string | null {
  const parts: string[] = [];
  if (item.displayEmail) {
    parts.push(item.displayEmail);
  }
  const dm = [item.decisionMakerName, item.decisionMakerRole].filter(Boolean).join(" · ");
  if (dm) {
    parts.push(dm);
  }
  if (parts.length === 0) {
    return null;
  }
  return parts.join(" · ");
}

export function MyLeadGenerationQueueTable({ items }: Props) {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border bg-card/50 shadow-sm">
        <Table className="w-max min-w-full text-sm">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="sticky left-0 z-20 min-w-[200px] bg-muted/90 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-md dark:bg-muted/80">
                Actions
              </TableHead>
              <TableHead className="min-w-[240px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Société
              </TableHead>
              <TableHead className="min-w-[150px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Relance
              </TableHead>
              <TableHead className="min-w-[148px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Téléphone
              </TableHead>
              <TableHead className="min-w-[100px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ville
              </TableHead>
              <TableHead className="min-w-[72px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Score
              </TableHead>
              <TableHead className="min-w-[100px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Priorité
              </TableHead>
              <TableHead className="min-w-[150px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                File
              </TableHead>
              <TableHead className="min-w-[130px] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Dernière activité
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => {
              const telHref = leadPhoneToTelHref(r.phone);
              const rel = getRelanceDisplay(r);
              const sub = companySubline(r);
              const overdueRow = r.hasOverdueFollowUp;
              const urgentPriority = r.commercialPriority === "critical" || r.commercialPriority === "high";

              return (
                <TableRow
                  key={r.assignmentId}
                  className={cn(
                    "group/row border-border",
                    overdueRow &&
                      "border-l-[4px] border-l-red-500 bg-red-500/[0.06] hover:bg-red-500/[0.1] dark:bg-red-500/[0.09] dark:hover:bg-red-500/[0.12]",
                    !overdueRow &&
                      urgentPriority &&
                      "border-l-[4px] border-l-amber-500/70 bg-amber-500/[0.04] hover:bg-amber-500/[0.07] dark:border-l-amber-400/60 dark:bg-amber-500/[0.06] dark:hover:bg-amber-500/[0.09]",
                    !overdueRow && !urgentPriority && "hover:bg-muted/40",
                  )}
                >
                  <TableCell
                    className={cn(
                      "sticky left-0 z-10 px-3 py-3 align-middle shadow-[4px_0_12px_-4px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-colors",
                      overdueRow &&
                        "bg-red-500/[0.08] group-hover/row:bg-red-500/[0.12] dark:bg-red-500/[0.12] dark:group-hover/row:bg-red-500/[0.16]",
                      !overdueRow &&
                        urgentPriority &&
                        "bg-amber-500/[0.06] group-hover/row:bg-amber-500/[0.1] dark:bg-amber-500/[0.08] dark:group-hover/row:bg-amber-500/[0.12]",
                      !overdueRow &&
                        !urgentPriority &&
                        "bg-card/95 group-hover/row:bg-muted/80 dark:bg-card/92 dark:group-hover/row:bg-muted/50",
                    )}
                  >
                    <div className="flex flex-nowrap items-center gap-1.5">
                      <Link
                        href={`/lead-generation/my-queue/${r.stockId}`}
                        className={cn(
                          buttonVariants({ variant: "default", size: "sm" }),
                          "h-8 shrink-0 px-3 text-xs font-semibold",
                        )}
                      >
                        Ouvrir
                      </Link>
                      {telHref ? (
                        <Link
                          href={telHref}
                          aria-label="Appeler avec Aircall"
                          title="Appeler avec Aircall"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-8 shrink-0 gap-1 px-2.5 text-xs font-semibold",
                          )}
                        >
                          <Phone className="size-3.5 shrink-0" aria-hidden />
                          Appeler
                        </Link>
                      ) : null}
                      <Link
                        href={`/lead-generation/my-queue/${r.stockId}#suivi-activite`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-8 shrink-0 gap-1 px-2.5 text-xs font-medium text-muted-foreground",
                        )}
                        title="Planifier une relance"
                      >
                        <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                        Relance
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[320px] px-3 py-3 align-top whitespace-normal">
                    <div className="space-y-1.5">
                      <Link
                        href={`/lead-generation/my-queue/${r.stockId}`}
                        className="group/link inline-flex items-start gap-1 text-sm font-semibold leading-snug text-foreground decoration-primary/60 underline-offset-4 hover:text-primary hover:underline"
                      >
                        <span>{r.companyName}</span>
                        <ChevronRight className="mt-0.5 size-4 shrink-0 text-primary opacity-0 transition-opacity group-hover/link:opacity-100" />
                      </Link>
                      {sub ? (
                        <p className="text-xs leading-relaxed text-foreground/70" title={sub}>
                          {sub}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className={cn("max-w-[200px] px-3 py-3 align-top text-sm whitespace-normal", relanceTextClass(rel.bucket))}>
                    {rel.label}
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
                            "h-8 w-8 shrink-0 border-primary/25 text-primary hover:bg-primary/10",
                          )}
                        >
                          <Phone className="size-4" />
                        </Link>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-foreground/90">{r.city ?? "—"}</TableCell>
                  <TableCell className="px-3 py-3 text-right text-sm font-semibold tabular-nums text-foreground">
                    {r.commercialScore}
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <LeadGenerationCommercialPriorityBadge priority={r.commercialPriority} />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <LeadGenerationDispatchQueueBadge
                      status={r.dispatchQueueStatus}
                      reason={r.dispatchQueueReason}
                      compact
                      tooltipReasonOnly
                    />
                  </TableCell>
                  <TableCell className="px-3 py-3 text-xs text-muted-foreground whitespace-normal">
                    {r.lastActivityAt ? formatDateTimeFr(r.lastActivityAt) : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="px-1 text-center text-[11px] text-muted-foreground sm:hidden">
        Actions à gauche — glissez le tableau pour voir toutes les colonnes.
      </p>
    </div>
  );
}
