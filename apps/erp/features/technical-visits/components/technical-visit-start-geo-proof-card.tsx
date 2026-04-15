import { MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  visitStartGeoCoherenceBadgeClass,
  visitStartGeoCoherenceLabelFr,
} from "@/features/technical-visits/geo/start-geo-proof-ui";
import type { TechnicalVisitStartGeoProofSummary } from "@/features/technical-visits/types";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Preuve GPS au démarrage — synthèse pour terrain et bureau (sans carte).
 */
export function TechnicalVisitStartGeoProofCard({
  startedAt,
  proof,
  showPreciseCoords = true,
}: {
  startedAt: string | null;
  proof: TechnicalVisitStartGeoProofSummary | null | undefined;
  /** Faux pour vue restreinte : pas de lat/lng affichées. */
  showPreciseCoords?: boolean;
}) {
  if (!startedAt || !proof) return null;

  const hasCoords = proof.latitude != null && proof.longitude != null && showPreciseCoords;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Démarrage terrain
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Preuve enregistrée le {formatDateFr(proof.server_recorded_at) ?? "—"}
            {proof.client_captured_at ? (
              <span className="text-muted-foreground/80">
                {" "}
                · capture appareil {formatDateFr(proof.client_captured_at) ?? ""}
              </span>
            ) : null}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold",
            visitStartGeoCoherenceBadgeClass(proof.coherence),
          )}
        >
          {visitStartGeoCoherenceLabelFr(proof.coherence)}
        </Badge>
      </div>

      <ul className="mt-3 space-y-1.5 text-sm text-foreground">
        {proof.distance_to_site_m != null ? (
          <li className="flex gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              Écart avec le point site (réf. fiche) : environ{" "}
              <strong>{proof.distance_to_site_m} m</strong>
            </span>
          </li>
        ) : proof.coherence === "site_coords_missing" && hasCoords ? (
          <li className="text-muted-foreground">
            Position enregistrée ; pas de coordonnées chantier en base pour comparer.
          </li>
        ) : null}

        {proof.coherence === "geo_refused" || proof.coherence === "geo_unavailable" ? (
          <li className="text-muted-foreground">
            {proof.coherence === "geo_refused"
              ? "L’utilisateur a refusé la géolocalisation ou le navigateur l’a bloquée."
              : "La position n’a pas pu être obtenue (timeout, erreur ou navigateur)."}
            {proof.provider_error_code ? (
              <span className="ml-1 font-mono text-xs">({proof.provider_error_code})</span>
            ) : null}
          </li>
        ) : null}

        {hasCoords ? (
          <li className="font-mono text-xs text-muted-foreground">
            {proof.latitude!.toFixed(6)}, {proof.longitude!.toFixed(6)}
            {proof.accuracy_m != null ? ` · ±${Math.round(proof.accuracy_m)} m` : null}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
