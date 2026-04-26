import { computeResult } from "@/features/simulator-cee/domain/eligibility-rules";
import type { SimulationAnswers } from "@/features/simulator-cee/domain/types";
import type { SubmitSimulationInput } from "@/features/simulator-cee/schemas/simulation.schema";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Enregistre une simulation CEE pour un **lead existant** (alternative à
 * `createSimulation` qui crée un nouveau lead). Utilisé quand un lead a déjà
 * été créé par le simulateur site (`source = 'website'`, `sim_version =
 * 'website-simulator-v1'`) et que le closer complète les questions techniques
 * manquantes pour obtenir l'éligibilité.
 *
 * Effets :
 *  - INSERT dans `cee_simulations` avec `lead_id = args.leadId`
 *  - UPDATE sur `leads` : pac_eligible, renov_eligible, sim_payload_json,
 *    sim_version, simulated_at, simulated_by_user_id, next_callback_*
 */
export async function saveSimulationForLead(args: {
  userId: string;
  leadId: string;
  answers: SubmitSimulationInput;
  savedDespiteNonEligible?: boolean;
}): Promise<{ leadId: string; simulationId: string }> {
  const admin = createAdminClient();
  const answers = args.answers as unknown as SimulationAnswers;
  const result = computeResult(answers);
  const savedDespite = args.savedDespiteNonEligible === true;

  const zoneForDb =
    result.zone === "idf" || result.zone === "hors_idf" ? result.zone : null;

  const { data: simRow, error: simErr } = await admin
    .from("cee_simulations")
    .insert({
      lead_id: args.leadId,
      created_by: args.userId,
      raw_answers: args.answers as unknown as Record<string, unknown>,
      result_snapshot: result as unknown as Record<string, unknown>,
      pac_eligible: result.pac.eligible,
      renov_eligible: result.renov.eligible,
      zone: zoneForDb,
      income_category: args.answers.trancheRevenu,
      profil: args.answers.profil,
      type_logement: args.answers.typeLogement ?? null,
      periode_construction: args.answers.periodeConstruction ?? null,
      ite_iti_recente: args.answers.iteItiRecente ?? null,
      fenetres: args.answers.fenetres ?? null,
      sous_sol: args.answers.sousSol ?? null,
      btd_installe: args.answers.btdInstalle ?? null,
      vmc_installee: args.answers.vmcInstallee ?? null,
      chauffage: args.answers.chauffage,
      dpe: args.answers.dpe,
      travaux_cee_recus: args.answers.travauxCeeRecus ?? null,
      patrimoine_type: args.answers.patrimoineType ?? null,
      nb_logements: args.answers.nbLogements ?? null,
      surface_totale_m2: args.answers.surfaceTotaleM2 ?? null,
      raison_sociale: args.answers.raisonSociale?.trim() || null,
      package_recommande: result.renov.package,
      cible_ideale: result.cibleIdeale,
      saved_despite_non_eligible: savedDespite,
      chauffage_24_mois: args.answers.chauffage24Mois ?? null,
      age_logement: args.answers.ageLogement ?? null,
      financement: result.renov.financement,
      financement_label: result.renov.financementLabel,
    })
    .select("id")
    .single();

  if (simErr || !simRow?.id) {
    console.error("saveSimulationForLead cee_simulations insert", simErr);
    throw new Error("Impossible d'enregistrer la simulation");
  }

  // Snapshot résumé côté lead (colonnes dédiées).
  const leadPatch = {
    pac_eligible: result.pac.eligible,
    renov_eligible: result.renov.eligible,
    sim_payload_json: {
      source: "simulator_cee_from_website",
      version: "erp-closer-v1",
      website_source_version: "website-simulator-v1",
      answers: args.answers,
      result,
      saved_despite_non_eligible: savedDespite,
    } as unknown as Record<string, unknown>,
    sim_version: "erp-closer-v1",
    simulated_at: new Date().toISOString(),
    simulated_by_user_id: args.userId,
    next_callback_date: args.answers.rappel?.date ?? null,
    next_callback_time: args.answers.rappel?.heure ?? null,
  };

  const { error: leadErr } = await admin
    .from("leads")
    .update(leadPatch)
    .eq("id", args.leadId);

  if (leadErr) {
    console.error("saveSimulationForLead lead update", leadErr);
    // Non bloquant — la simulation est enregistrée, on loggue l'erreur de sync.
  }

  return { leadId: args.leadId, simulationId: simRow.id };
}
