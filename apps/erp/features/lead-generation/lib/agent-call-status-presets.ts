/** Statuts d’appel — alignés sur la clôture file (`terminal-call-status`) et le journal d’activité. */

export const AGENT_CALL_STATUS_PRESETS = [
  { value: "__empty__", label: "Non renseigné" },
  { value: "Ciblé", label: "Ciblé" },
  { value: "Hors cible", label: "Hors cible" },
  { value: "Refus", label: "Refus" },
  { value: "Annulé", label: "Annulé" },
  { value: "À rappeler", label: "À rappeler" },
  { value: "Autre", label: "Autre" },
  { value: "Contact établi", label: "Contact établi" },
  { value: "Répondeur", label: "Répondeur" },
  { value: "Pas de réponse", label: "Pas de réponse" },
  { value: "RDV fixé", label: "RDV fixé" },
  { value: "Numéro invalide", label: "Numéro invalide" },
] as const;

export function agentCallStatusTriggerLabel(status: string, customStatus: string): string {
  if (status === "__empty__" && customStatus.trim()) {
    return customStatus.trim();
  }
  return AGENT_CALL_STATUS_PRESETS.find((p) => p.value === status)?.label ?? "Choisir…";
}

export function resolveAgentCallStatus(status: string, customStatus: string): string | null {
  if (status === "__empty__") {
    return customStatus.trim() || null;
  }
  return status;
}

export const AGENT_CALL_PRESET_VALUES: ReadonlySet<string> = new Set(
  AGENT_CALL_STATUS_PRESETS.map((p) => p.value).filter((v) => v !== "__empty__"),
);
