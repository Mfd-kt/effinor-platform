import { countDispatchableReadyNowPool } from "../services/auto-dispatch-lead-generation-stock-round-robin";
import { countLeadGenerationStockNeedingContactImprovement } from "./get-lead-generation-stock-ids-needing-contact-improvement";

export type LeadGenerationPipelineRecommendedStep =
  | "wait_imports"
  | "generate"
  | "improve"
  | "assign"
  | "balanced";

export type LeadGenerationPipelineCockpitSnapshot = {
  /** Fiches en statut stock « ready ». */
  stockReadyCount: number;
  /** Fiches réellement attribuables (même règles que la distribution auto). */
  leadsReadyToAssign: number;
  /** Fiches encore améliorables (email ou site manquant, enrichissement possible). */
  leadsNeedingContactImprovement: number;
  /** Lots fournisseur encore en cours (nombre de batches). */
  importsRunning: number;
  /** File interne : encore à compléter avant contact (libellé métier côté UI). */
  leadsStillBeingQualified: number;
  recommendedStep: LeadGenerationPipelineRecommendedStep;
  /** Action conseillée, phrase lisible pour un utilisateur métier. */
  recommendedActionLabel: string;
};

/**
 * Vue cockpit : étapes conseillées sans exposer les codes techniques de file.
 */
export async function getLeadGenerationPipelineCockpitSnapshot(input: {
  stockReadyCount: number;
  leadsStillBeingQualified: number;
  importsRunning: number;
}): Promise<LeadGenerationPipelineCockpitSnapshot> {
  const [leadsNeedingContactImprovement, leadsReadyToAssign] = await Promise.all([
    countLeadGenerationStockNeedingContactImprovement(),
    countDispatchableReadyNowPool(),
  ]);

  const { stockReadyCount, leadsStillBeingQualified, importsRunning } = input;

  let recommendedStep: LeadGenerationPipelineRecommendedStep = "balanced";
  let recommendedActionLabel =
    "Vous pouvez enchaîner génération, complément des fiches et distribution selon vos priorités.";

  if (importsRunning > 0) {
    recommendedStep = "wait_imports";
    recommendedActionLabel =
      "Import en cours : attendez la fin et la synchronisation des lots avant de compter sur de nouveaux contacts exploitables.";
  } else if (stockReadyCount === 0) {
    recommendedStep = "generate";
    recommendedActionLabel =
      "Aucun lead actif dans le carnet : importez ou générez des contacts pour démarrer.";
  } else if (leadsReadyToAssign > 0) {
    recommendedStep = "assign";
    recommendedActionLabel = `${leadsReadyToAssign} contact${leadsReadyToAssign > 1 ? "s sont" : " est"} prêt${leadsReadyToAssign > 1 ? "s" : ""} à être confié${leadsReadyToAssign > 1 ? "s" : ""} aux commerciaux.`;
  } else if (leadsNeedingContactImprovement > 0) {
    recommendedStep = "improve";
    recommendedActionLabel = `${leadsNeedingContactImprovement} fiche${leadsNeedingContactImprovement > 1 ? "s" : ""} peu${leadsNeedingContactImprovement > 1 ? "vent" : "t"} encore être complétée${leadsNeedingContactImprovement > 1 ? "s" : ""} (email, site) avant une mise en relation efficace. Lancez « Améliorer les leads ».`;
  } else if (leadsStillBeingQualified > 0) {
    recommendedStep = "improve";
    recommendedActionLabel =
      "Les fiches ont été analysées mais peu sont encore assez complètes pour être distribuées. Complétez les contacts ou affinez les données, puis relancez l’étape d’amélioration.";
  } else {
    recommendedStep = "balanced";
    recommendedActionLabel =
      "Enrichissez ou importez de nouveaux contacts pour alimenter le carnet, puis finalisez avant distribution.";
  }

  return {
    stockReadyCount,
    leadsReadyToAssign,
    leadsNeedingContactImprovement,
    importsRunning,
    leadsStillBeingQualified,
    recommendedStep,
    recommendedActionLabel,
  };
}
