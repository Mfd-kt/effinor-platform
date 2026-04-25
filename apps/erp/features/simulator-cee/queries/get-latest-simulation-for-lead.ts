import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CeeSimulationRow = {
  id: string;
  created_at: string;
  pac_eligible: boolean | null;
  renov_eligible: boolean | null;
  zone: string | null;
  income_category: string | null;
  profil: string | null;
  type_logement: string | null;
  periode_construction: string | null;
  ite_iti_recente: boolean | null;
  fenetres: string | null;
  sous_sol: boolean | null;
  btd_installe: boolean | null;
  vmc_installee: boolean | null;
  chauffage: string | null;
  dpe: string | null;
  travaux_cee_recus: string | null;
  patrimoine_type: string | null;
  nb_logements: number | null;
  surface_totale_m2: number | null;
  raison_sociale: string | null;
  package_recommande: string[] | null;
  cible_ideale: boolean | null;
  result_snapshot: Record<string, unknown> | null;
  raw_answers: Record<string, unknown> | null;
};

/**
 * Récupère la dernière simulation CEE associée à un lead (par `created_at` desc).
 * Renvoie `null` si pas de simulation enregistrée.
 */
export async function getLatestSimulationForLead(leadId: string): Promise<CeeSimulationRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cee_simulations")
    .select(
      [
        "id",
        "created_at",
        "pac_eligible",
        "renov_eligible",
        "zone",
        "income_category",
        "profil",
        "type_logement",
        "periode_construction",
        "ite_iti_recente",
        "fenetres",
        "sous_sol",
        "btd_installe",
        "vmc_installee",
        "chauffage",
        "dpe",
        "travaux_cee_recus",
        "patrimoine_type",
        "nb_logements",
        "surface_totale_m2",
        "raison_sociale",
        "package_recommande",
        "cible_ideale",
        "result_snapshot",
        "raw_answers",
      ].join(","),
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as CeeSimulationRow;
}
