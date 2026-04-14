import type { CeeWorkflowStatus } from "./constants";

const TRANSITIONS: Record<CeeWorkflowStatus, readonly CeeWorkflowStatus[]> = {
  draft: ["simulation_done", "lost"],
  simulation_done: ["to_confirm", "qualified", "lost"],
  /** Envoi au closer possible dès contrôle confirmateur (sans passer par « qualifié » si tout est validé côté formulaire). */
  to_confirm: ["qualified", "to_close", "lost"],
  /** Transmission au closer possible avec ou sans documents (génération côté closer). */
  qualified: ["docs_prepared", "to_close", "technical_visit_pending", "lost"],
  docs_prepared: ["to_close", "agreement_sent", "lost"],
  /** Le closer peut générer le pack après réception du dossier. */
  to_close: ["docs_prepared", "agreement_sent", "lost"],
  agreement_sent: ["agreement_signed", "quote_pending", "lost"],
  agreement_signed: ["quote_pending", "technical_visit_pending", "installation_pending", "lost"],
  quote_pending: ["quote_sent", "lost"],
  quote_sent: ["quote_signed", "lost"],
  quote_signed: ["technical_visit_pending", "installation_pending", "lost"],
  technical_visit_pending: ["technical_visit_done", "lost"],
  technical_visit_done: ["installation_pending", "cee_deposit_pending", "lost"],
  installation_pending: ["cee_deposit_pending", "paid", "lost"],
  cee_deposit_pending: ["cee_deposited", "paid", "lost"],
  cee_deposited: ["paid", "lost"],
  paid: [],
  lost: [],
};

export function canTransitionWorkflowStatus(
  fromStatus: CeeWorkflowStatus,
  toStatus: CeeWorkflowStatus,
): boolean {
  if (fromStatus === toStatus) {
    return true;
  }
  return TRANSITIONS[fromStatus].includes(toStatus);
}

export function assertWorkflowTransition(
  fromStatus: CeeWorkflowStatus,
  toStatus: CeeWorkflowStatus,
): void {
  if (!canTransitionWorkflowStatus(fromStatus, toStatus)) {
    throw new Error(`Transition invalide: ${fromStatus} -> ${toStatus}`);
  }
}
