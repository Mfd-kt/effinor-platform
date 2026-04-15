import { AlertTriangle, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { TechnicalVisitStatusBadge } from "@/features/technical-visits/components/technical-visit-status-badge";
import type { TechnicalVisitDetailRow } from "@/features/technical-visits/types";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * En-tête fiche visite &lt; md : lecture rapide (réf, statut, passage, lieu).
 * Métadonnées bureau (UUID, date de maj) restent sur le bloc desktop.
 */
export function TechnicalVisitDetailMobileHero({
  visit,
  footer,
  className,
  pilotageAlertSummary,
}: {
  visit: TechnicalVisitDetailRow;
  footer?: ReactNode;
  className?: string;
  pilotageAlertSummary?: { openCount: number; criticalCount: number } | null;
}) {
  const locality = [visit.worksite_postal_code, visit.worksite_city].filter(Boolean).join(" ").trim();

  return (
    <header
      className={cn(
        "mb-6 space-y-3 border-b border-border pb-4 md:hidden",
        className,
      )}
    >
      <div className="space-y-2">
        <h1 className="font-mono text-xl font-semibold leading-tight tracking-tight text-foreground">
          {visit.vt_reference}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <TechnicalVisitStatusBadge status={visit.status} />
          {pilotageAlertSummary && pilotageAlertSummary.openCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              {pilotageAlertSummary.openCount} alerte{pilotageAlertSummary.openCount > 1 ? "s" : ""}
              {pilotageAlertSummary.criticalCount > 0
                ? ` · ${pilotageAlertSummary.criticalCount} critique${pilotageAlertSummary.criticalCount > 1 ? "s" : ""}`
                : null}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Passage</p>
          <p className="mt-0.5 font-medium leading-snug text-foreground">
            {formatDateFr(visit.scheduled_at) || "—"}
            {visit.time_slot ? (
              <span className="font-normal text-muted-foreground"> · {visit.time_slot}</span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="min-w-0 leading-snug text-foreground">
            {locality || "—"}
            {visit.region ? (
              <span className="text-muted-foreground"> · {visit.region}</span>
            ) : null}
          </p>
        </div>
      </div>

      {footer ? <div className="pt-1">{footer}</div> : null}
    </header>
  );
}
