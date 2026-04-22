import { CheckCircle2, Database, Sparkles, Zap } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import type { LeadGenerationStockSummary } from "@/features/lead-generation/queries/get-lead-generation-stock-summary";

type Props = {
  summary: LeadGenerationStockSummary;
  /** True quand au moins un filtre est appliqué — change la formulation des hints. */
  filtered?: boolean;
};

/**
 * Bandeau KPI synthétique en haut de l'écran « Stock ».
 *
 * Quatre indicateurs business directement dérivés du summary serveur :
 * - Total stock affiché (respecte les filtres en cours)
 * - Prêts à contacter (file dispatch `ready_now`)
 * - À enrichir avant diffusion (file dispatch `enrich_first`)
 * - Convertis (statut stock `converted`)
 *
 * Aucune query supplémentaire : tout est calculé côté serveur dans
 * `getLeadGenerationStockSummary` qui faisait déjà les comptes par statut.
 */
export function LeadGenerationStockKpis({ summary, filtered }: Props) {
  const ready = summary.byDispatchQueue.ready_now ?? 0;
  const enrich = summary.byDispatchQueue.enrich_first ?? 0;
  const converted = summary.byStockStatus.converted ?? 0;

  return (
    <section
      aria-label="Indicateurs stock"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <StatCard
        title={filtered ? "Stock filtré" : "Stock total"}
        value={summary.totalMatching.toLocaleString("fr-FR")}
        hint={
          filtered
            ? "Nombre de fiches correspondant aux filtres actifs."
            : "Toutes les fiches actuellement dans le carnet."
        }
        icon={<Database className="size-4" aria-hidden />}
      />
      <StatCard
        title="Prêts à contacter"
        value={ready.toLocaleString("fr-FR")}
        hint={
          ready === 0
            ? "Aucune fiche immédiatement contactable."
            : "Fiches qualifiées prêtes pour le terrain."
        }
        icon={<Zap className="size-4" aria-hidden />}
      />
      <StatCard
        title="À enrichir"
        value={enrich.toLocaleString("fr-FR")}
        hint={
          enrich === 0
            ? "Aucune fiche en attente d'enrichissement."
            : "Fiches à compléter avant diffusion (contact, qualif…)."
        }
        icon={<Sparkles className="size-4" aria-hidden />}
      />
      <StatCard
        title="Convertis"
        value={converted.toLocaleString("fr-FR")}
        hint={
          converted === 0
            ? "Aucune conversion enregistrée."
            : "Fiches passées en lead/CRM."
        }
        icon={<CheckCircle2 className="size-4" aria-hidden />}
      />
    </section>
  );
}
