import type { VisitStartGeoCoherence } from "./start-geo-constants";

export function visitStartGeoCoherenceLabelFr(c: VisitStartGeoCoherence): string {
  const m: Record<VisitStartGeoCoherence, string> = {
    on_site: "Sur site",
    near_site: "Proche du site",
    far_from_site: "Éloigné du site",
    site_coords_missing: "Site sans coordonnées de référence",
    geo_unavailable: "Localisation indisponible",
    geo_refused: "Localisation refusée",
  };
  return m[c];
}

export function visitStartGeoCoherenceBadgeClass(c: VisitStartGeoCoherence): string {
  if (c === "on_site") {
    return "border-emerald-500/45 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-200";
  }
  if (c === "near_site" || c === "site_coords_missing") {
    return "border-sky-500/45 bg-sky-50 text-sky-900 dark:bg-sky-950/30 dark:text-sky-200";
  }
  if (c === "far_from_site") {
    return "border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/25 dark:text-amber-200";
  }
  return "border-border bg-muted/60 text-muted-foreground";
}
