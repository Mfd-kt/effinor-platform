import Link from "next/link";
import { ChevronRight, MapPin, User } from "lucide-react";

import { isTechnicalVisitScheduledTodayParis } from "@/features/technical-visits/lib/technical-visit-list-bucket";

import { TechnicalVisitAdminDeleteButton } from "@/features/technical-visits/components/technical-visit-admin-delete-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { TechnicalVisitAccessBadge } from "@/features/technical-visits/components/technical-visit-access-badge";
import { Badge } from "@/components/ui/badge";
import { TechnicalVisitStatusBadge } from "@/features/technical-visits/components/technical-visit-status-badge";
import { buildingTypePreviewFromFormAnswers } from "@/features/technical-visits/lib/building-type-preview";
import { isTechnicalVisitInProgress } from "@/features/technical-visits/lib/visit-in-progress";
import type { TechnicalVisitListRow } from "@/features/technical-visits/types";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TechnicalVisitMobileCard({
  visit,
  canAdminDelete = false,
}: {
  visit: TechnicalVisitListRow;
  canAdminDelete?: boolean;
}) {
  const locality = [visit.worksite_postal_code, visit.worksite_city].filter(Boolean).join(" ").trim();
  const buildingType =
    buildingTypePreviewFromFormAnswers(visit.form_answers_json) ??
    (visit.surface_m2 != null ? `Surface ${visit.surface_m2} m²` : null);
  const isToday = isTechnicalVisitScheduledTodayParis(visit);
  const tech = visit.technician_label?.trim();
  const distanceLabel = visit.formatted_distance ?? "Distance indisponible";
  const distanceTitle = visit.distance_origin_type === "technician" ? "Distance" : "Distance siège";

  return (
    <article
      className={cn(
        "touch-manipulation rounded-2xl border bg-card p-4 shadow-sm transition-shadow",
        isToday
          ? "border-emerald-500/35 ring-1 ring-emerald-500/20 dark:border-emerald-700/40 dark:ring-emerald-600/25"
          : "border-border",
        "active:bg-muted/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] font-semibold tracking-tight text-foreground sm:text-sm">
              {visit.vt_reference}
            </span>
            {isToday ? (
              <Badge className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-emerald-600">
                Aujourd’hui
              </Badge>
            ) : null}
            <TechnicalVisitAccessBadge level={visit.technician_field_access} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <TechnicalVisitStatusBadge status={visit.status} />
            {isTechnicalVisitInProgress(visit) ? (
              <Badge
                variant="outline"
                className="rounded-md border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100"
              >
                En cours
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Passage</p>
          <p className="mt-1 text-base font-semibold leading-snug text-foreground">
            {formatDateFr(visit.scheduled_at) || "—"}
            {visit.time_slot ? (
              <span className="mt-0.5 block text-sm font-normal text-muted-foreground sm:mt-0 sm:ml-1 sm:inline">
                · {visit.time_slot}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex gap-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="min-w-0 leading-snug text-foreground">
            {locality || "Lieu à préciser"}
            {visit.region ? <span className="text-muted-foreground"> · {visit.region}</span> : null}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{distanceTitle}: {distanceLabel}</p>

        {tech ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="size-4 shrink-0" aria-hidden />
            <span className="text-sm text-foreground">{tech}</span>
          </div>
        ) : null}

        {buildingType ? (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/90">Site : </span>
            {buildingType}
          </p>
        ) : null}

        {visit.lead_company_name ? (
          <p className="truncate text-xs text-muted-foreground">{visit.lead_company_name}</p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Link
          href={`/technical-visits/${visit.id}`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "flex h-12 w-full min-h-12 items-center justify-center gap-2 text-base font-semibold touch-manipulation",
          )}
        >
          Ouvrir la fiche
          <ChevronRight className="size-5 shrink-0" aria-hidden />
        </Link>
        {canAdminDelete ? (
          <TechnicalVisitAdminDeleteButton
            visitId={visit.id}
            vtReference={visit.vt_reference}
            size="lg"
            className="w-full min-h-12"
          />
        ) : null}
      </div>
    </article>
  );
}
