import Link from "next/link";
import { CheckCircle2, Info, MapPin, RefreshCw } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { TechnicalVisitAccessBadge } from "@/features/technical-visits/components/technical-visit-access-badge";
import { TechnicalVisitStatusBadge } from "@/features/technical-visits/components/technical-visit-status-badge";
import { formatOfficeDistanceKm } from "@/features/technical-visits/lib/office-distance";
import type { TechnicalVisitDetailRow } from "@/features/technical-visits/types";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Vue terrain limitée : technicien affecté hors fenêtre J-24h (ou sans date planifiée, ou dossier clos).
 * Mobile-first : peu de texte, hiérarchie immédiate.
 */
export function TechnicalVisitTechnicianRestrictedPanel({ visit }: { visit: TechnicalVisitDetailRow }) {
  const locality = [visit.worksite_postal_code, visit.worksite_city].filter(Boolean).join(" ").trim();
  const isValidated = visit.status === "validated";
  const officeDistance = formatOfficeDistanceKm(
    visit.worksite_latitude,
    visit.worksite_longitude,
    visit.office_distance_km,
  );

  return (
    <div className="mx-auto max-w-lg space-y-4 md:max-w-4xl">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border-2",
          isValidated
            ? "border-emerald-500/45 bg-emerald-50 dark:border-emerald-500/35 dark:bg-emerald-950/35"
            : "border-amber-400/50 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/40",
        )}
      >
        <div className="flex gap-3 p-4">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              isValidated
                ? "bg-emerald-500/15 dark:bg-emerald-400/10"
                : "bg-amber-500/15 dark:bg-amber-400/10",
            )}
            aria-hidden
          >
            {isValidated ? (
              <CheckCircle2 className="size-6 text-emerald-800 dark:text-emerald-100" />
            ) : (
              <Info className="size-6 text-amber-900 dark:text-amber-100" />
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className={cn(
                  "text-base font-semibold leading-tight",
                  isValidated ? "text-emerald-950 dark:text-emerald-50" : "text-amber-950 dark:text-amber-50",
                )}
              >
                {isValidated ? "Visite validée" : "Vue limitée"}
              </h2>
              {!isValidated ? <TechnicalVisitAccessBadge level="technician_restricted" /> : null}
            </div>
            {isValidated ? (
              <p className="text-sm leading-relaxed text-emerald-950/90 dark:text-emerald-50/90">
                La visite technique est <strong>validée</strong>. Merci pour votre travail.
              </p>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-amber-950/90 dark:text-amber-50/90">
                  Le <strong>détail complet</strong> (adresse, contact, formulaire) s’ouvre{" "}
                  <strong>24h avant</strong> le créneau planifié.
                </p>
                {!visit.scheduled_at ? (
                  <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
                    Aucune date planifiée : demandez au bureau d’en poser une pour lancer le décompte.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Résumé</p>
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-lg font-semibold">{visit.vt_reference}</span>
            <TechnicalVisitStatusBadge status={visit.status} />
          </div>

          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Passage</p>
            <p className="text-base font-semibold text-foreground">
              {formatDateFr(visit.scheduled_at) || "—"}
              {visit.time_slot ? (
                <span className="font-normal text-muted-foreground"> · {visit.time_slot}</span>
              ) : null}
            </p>
          </div>

          <div className="flex gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-medium text-foreground">{locality || "Lieu à préciser"}</p>
              {visit.region ? <p className="text-muted-foreground">{visit.region}</p> : null}
              <p className="text-muted-foreground">Distance bureau: {officeDistance}</p>
            </div>
          </div>

          {(visit.surface_m2 != null || visit.ceiling_height_m != null) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {visit.surface_m2 != null ? <span>Surface {visit.surface_m2} m²</span> : null}
              {visit.ceiling_height_m != null ? <span>Hauteur {visit.ceiling_height_m} m</span> : null}
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <Link
            href={`/technical-visits/${visit.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "flex h-12 w-full items-center justify-center gap-2",
            )}
          >
            <RefreshCw className="size-4" aria-hidden />
            Actualiser la page
          </Link>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {isValidated
              ? "Rechargez la page pour actualiser l’affichage si besoin."
              : "Après J-24h, rechargez pour afficher le formulaire terrain."}
          </p>
        </div>
      </div>
    </div>
  );
}
