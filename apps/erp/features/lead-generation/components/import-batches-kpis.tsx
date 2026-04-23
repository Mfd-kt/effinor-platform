import { Activity, CalendarRange, PhoneCall, Target } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import type { ImportBatchesKpis } from "@/features/lead-generation/queries/get-import-batches-kpis";

type Props = {
  kpis: ImportBatchesKpis;
  /** True quand l'utilisateur n'a accès qu'à ses propres lots (rôle quantifier seul). */
  scopedToMe?: boolean;
};

function formatRate(numerator: number, denominator: number): string {
  if (denominator === 0) {
    return "—";
  }
  const pct = Math.round((numerator / denominator) * 100);
  return `${pct} %`;
}

/**
 * Bandeau KPI synthétique en haut de l'écran « Imports ».
 *
 * Quatre cartes à valeur business :
 * - Imports actifs (running + pending)
 * - Total du mois (volume d'activité)
 * - Taux de succès du mois (qualité)
 * - Quota téléphones LBC : skeleton pour l'instant (intégration Apify
 *   à venir — coût réel à 10 000 numéros par mois plafonné).
 */
export function ImportBatchesKpis({ kpis, scopedToMe }: Props) {
  const finishedThisMonth = kpis.monthCompleted + kpis.monthFailed;
  const successRate = formatRate(kpis.monthCompleted, finishedThisMonth);

  return (
    <section
      aria-label="Indicateurs imports"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <StatCard
        title={scopedToMe ? "Mes imports en cours" : "Imports en cours"}
        value={kpis.active}
        hint={
          kpis.active === 0
            ? "Aucun scraping ne tourne actuellement."
            : kpis.active === 1
              ? "1 lot est en cours ou en attente de synchro."
              : `${kpis.active} lots sont en cours ou en attente de synchro.`
        }
        tooltip="Compte des lots dont le statut est « en attente » ou « en cours » (Apify / synchro) — période et périmètre appliqués (vos lots si scope quantificateur)."
        icon={<Activity className="size-4" aria-hidden />}
      />
      <StatCard
        title={scopedToMe ? "Mes imports ce mois" : "Imports ce mois"}
        value={kpis.monthTotal}
        hint={
          kpis.monthTotal === 0
            ? "Aucun lot lancé depuis le 1er du mois."
            : `${kpis.monthCompleted} terminé${kpis.monthCompleted > 1 ? "s" : ""} · ${kpis.monthFailed} en échec.`
        }
        tooltip="Volume de lots créés depuis le 1er du mois (UTC) — indépendant du statut final."
        icon={<CalendarRange className="size-4" aria-hidden />}
      />
      <StatCard
        title="Taux de succès (mois)"
        value={successRate}
        hint={
          finishedThisMonth === 0
            ? "Aucun lot terminé ce mois pour calculer le taux."
            : `${kpis.monthCompleted} succès sur ${finishedThisMonth} lots terminés.`
        }
        tooltip="Lots en « terminé » (completed) / lots terminés (terminés + échoués) sur le mois en cours, indicateur de fiabilité."
        icon={<Target className="size-4" aria-hidden />}
      />
      <StatCard
        title="Quota téléphones LBC"
        value="—"
        hint="Intégration quota Apify à venir (plafond 10 000 / mois)."
        tooltip="Réservé : suivi conso téléphones côté Apify (plafond prévu 10 000 / mois) — raccord en cours côté produit."
        icon={<PhoneCall className="size-4" aria-hidden />}
      />
    </section>
  );
}
