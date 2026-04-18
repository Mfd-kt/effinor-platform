import type { AutoDispatchLeadsResult, PrepareLeadsResult, SimpleCreateLeadsMapsResult } from "../domain/main-actions-result";
import { humanizeLeadGenerationActionError } from "./humanize-lead-generation-action-error";

export const SIMPLE_COCKPIT_STORAGE_KEY = "lg-simple-cockpit:v1";

export type SimpleCockpitStoredV1 = {
  v: 1;
  runs: {
    create?: {
      at: string;
      acceptedCount: number;
      coordinatorBatchId: string;
      mapsBatchId: string;
    };
    prepare?: PrepareLeadsResult & { at: string };
    dispatch?: AutoDispatchLeadsResult & { at: string };
  };
};

export function readSimpleCockpitStorage(): SimpleCockpitStoredV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SIMPLE_COCKPIT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SimpleCockpitStoredV1;
    if (parsed?.v !== 1 || typeof parsed.runs !== "object" || parsed.runs === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSimpleCockpitRun<K extends keyof SimpleCockpitStoredV1["runs"]>(
  step: K,
  payload: NonNullable<SimpleCockpitStoredV1["runs"][K]>,
): void {
  if (typeof window === "undefined") return;
  try {
    const prev = readSimpleCockpitStorage() ?? { v: 1 as const, runs: {} };
    const next: SimpleCockpitStoredV1 = {
      v: 1,
      runs: { ...prev.runs, [step]: payload },
    };
    window.localStorage.setItem(SIMPLE_COCKPIT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function messageSimpleCockpitCreateZero(): string {
  return "Aucune fiche retenue sur ce lot. Élargissez la zone ou les recherches, puis relancez.";
}

export function messageSimpleCockpitPrepareNoWork(): string {
  return "Rien à traiter pour l’instant : le carnet n’a pas de fiches prêtes pour cette étape.";
}

export function messageSimpleCockpitDispatchBlocked(): string {
  return "Complétez les fiches (étape « Améliorer ») avant de distribuer.";
}

export function summarizeCreateMapsForLastRun(data: SimpleCreateLeadsMapsResult): string {
  if (data.acceptedCount === 0) {
    return messageSimpleCockpitCreateZero();
  }
  return `${data.acceptedCount} fiche${data.acceptedCount > 1 ? "s" : ""} ajoutée${data.acceptedCount > 1 ? "s" : ""} au carnet.`;
}

export function summarizePrepareForLastRun(d: PrepareLeadsResult): string {
  const parts: string[] = [];
  if (d.improvement_succeeded > 0) {
    parts.push(`${d.improvement_succeeded} complément${d.improvement_succeeded > 1 ? "s" : ""} contact`);
  }
  if (d.total_scored > 0) {
    parts.push(`${d.total_scored} fiche${d.total_scored > 1 ? "s" : ""} analysée${d.total_scored > 1 ? "s" : ""}`);
  }
  if (d.total_ready_now > 0) {
    parts.push(`${d.total_ready_now} prêt${d.total_ready_now > 1 ? "s" : ""} à contacter`);
  }
  if (d.total_enrich_needed > 0) {
    parts.push(`${d.total_enrich_needed} à compléter avant appel`);
  }
  if (parts.length === 0) {
    return messageSimpleCockpitPrepareNoWork();
  }
  return parts.join(" · ");
}

export function summarizeDispatchForLastRun(d: AutoDispatchLeadsResult): string {
  if (d.total_assigned === 0) {
    return "Aucune attribution sur ce passage.";
  }
  return `${d.total_assigned} fiche${d.total_assigned > 1 ? "s" : ""} attribuée${d.total_assigned > 1 ? "s" : ""} · ${d.remaining_leads} restante${d.remaining_leads > 1 ? "s" : ""} dans la file.`;
}

/** Messages courts pour le cockpit à 3 boutons (sans jargon Apify / RPC). */
export function humanizeSimpleCockpitStepError(raw: string, step: "prepare" | "dispatch"): string {
  const t = raw.trim().toLowerCase();
  if (step === "dispatch" && t.includes("aucun lead prêt")) {
    return messageSimpleCockpitDispatchBlocked();
  }
  if (step === "prepare" && (t.includes("aucune") || t.includes("rien à")) && t.includes("fiche")) {
    return messageSimpleCockpitPrepareNoWork();
  }
  return humanizeLeadGenerationActionError(raw);
}
