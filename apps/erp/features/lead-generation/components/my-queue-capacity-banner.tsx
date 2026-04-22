import { Activity, Inbox, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  COMMERCIAL_CAPACITY_BLOCK_THRESHOLD,
  COMMERCIAL_CAPACITY_WARNING_THRESHOLD,
  type AgentCommercialCapacityViewModel,
} from "@/features/lead-generation/lib/agent-commercial-capacity";
import { cn } from "@/lib/utils";

type Props = {
  commercialCapacity: AgentCommercialCapacityViewModel;
  effectiveStockCap: number;
  queueLength: number;
};

const LEVEL_LABEL: Record<"normal" | "warning" | "blocked", string> = {
  normal: "Disponible",
  warning: "Quasi pleine",
  blocked: "Plafond atteint",
};

const LEVEL_BAR_CLASS: Record<"normal" | "warning" | "blocked", string> = {
  normal: "bg-emerald-500",
  warning: "bg-amber-500",
  blocked: "bg-red-500",
};

const LEVEL_TEXT_CLASS: Record<"normal" | "warning" | "blocked", string> = {
  normal: "text-emerald-700 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  blocked: "text-red-700 dark:text-red-400",
};

const LEVEL_PILL_CLASS: Record<"normal" | "warning" | "blocked", string> = {
  normal:
    "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800",
  warning:
    "bg-amber-50 text-amber-950 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800",
  blocked:
    "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-100 dark:border-red-800",
};

/**
 * Bandeau en tête de « Ma file » : vue d'ensemble visuelle en 3 panneaux.
 * - Capacité commerciale : gauge horizontale colorée (palier 100 / 120).
 * - Fiches dans votre file : volume total reçu (server-side).
 * - Quota dispatch : objectif `effectiveStockCap` de nouveaux simultanés.
 *
 * Volontairement complémentaire du panneau interne du shell (scoped CEE) :
 * ce bandeau donne la vue globale dès l'ouverture de l'écran.
 */
export function MyQueueCapacityBanner({
  commercialCapacity,
  effectiveStockCap,
  queueLength,
}: Props) {
  const cap = commercialCapacity.ok ? commercialCapacity.snapshot : null;
  const total = cap?.total ?? 0;
  const level = cap?.level ?? "normal";
  const pct = Math.min(100, Math.round((total / COMMERCIAL_CAPACITY_BLOCK_THRESHOLD) * 100));
  const remaining = Math.max(0, COMMERCIAL_CAPACITY_BLOCK_THRESHOLD - total);

  const warningPct = Math.round(
    (COMMERCIAL_CAPACITY_WARNING_THRESHOLD / COMMERCIAL_CAPACITY_BLOCK_THRESHOLD) * 100,
  );

  return (
    <section
      aria-label="Vue d'ensemble de votre file"
      className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr]"
    >
      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-muted-foreground" aria-hidden />
                <h2 className="text-sm font-semibold text-foreground">Capacité commerciale</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Plafond {COMMERCIAL_CAPACITY_BLOCK_THRESHOLD} fiches actives ·
                ralentissement dispatch dès {COMMERCIAL_CAPACITY_WARNING_THRESHOLD}.
              </p>
            </div>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                LEVEL_PILL_CLASS[level],
              )}
            >
              {LEVEL_LABEL[level]}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className={cn("text-2xl font-semibold tabular-nums tracking-tight", LEVEL_TEXT_CLASS[level])}>
                {cap != null ? total : "—"}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                / {COMMERCIAL_CAPACITY_BLOCK_THRESHOLD} fiches actives
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={total}
              aria-valuemin={0}
              aria-valuemax={COMMERCIAL_CAPACITY_BLOCK_THRESHOLD}
              aria-label="Capacité commerciale agent"
              className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 w-px bg-amber-500/60"
                style={{ left: `${warningPct}%` }}
              />
              <div
                aria-hidden
                className={cn("h-full rounded-full transition-[width]", LEVEL_BAR_CLASS[level])}
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="text-[11px] text-muted-foreground">
              {cap == null
                ? "Capacité indisponible — chiffres masqués pour éviter toute mauvaise interprétation."
                : level === "blocked"
                  ? "Plafond atteint : aucune nouvelle attribution pour le moment."
                  : `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} avant le plafond.`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-2 p-5">
          <div className="flex items-center gap-2">
            <Inbox className="size-4 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Fiches dans la file</h2>
          </div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {queueLength.toLocaleString("fr-FR")}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Tous périmètres CEE confondus — appliquez un filtre ci-dessous pour zoomer.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-2 p-5">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Objectif dispatch</h2>
          </div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {effectiveStockCap}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Nombre de nouvelles fiches visées simultanément à l'attribution automatique.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
