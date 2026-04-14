/**
 * Formulations agent : direct, actionnable, respectueux (pas d’humiliation).
 */

export function buildCallbackPriorityLines(params: {
  companyName: string;
  overdue: boolean;
  dueToday: boolean;
  attemptsCount: number;
}): string {
  const when = params.overdue ? "en retard" : params.dueToday ? "prévu aujourd’hui" : "à traiter";
  const tries =
    params.attemptsCount > 0 ? ` Déjà ${params.attemptsCount} tentative(s) enregistrée(s).` : "";
  return `Rappel prioritaire (${when}) : ${params.companyName}.${tries} Ouvre la fiche rappel et appelle ou planifie une action concrète.`;
}

export function buildLeadSimulatorFollowupLine(params: { companyName: string; hoursSince: number }): string {
  return `Le lead « ${params.companyName} » a un simulateur rempli depuis ~${Math.round(params.hoursSince)} h sans suite visible. Un contact rapide augmente les chances de conversion.`;
}

export function buildLeadNewUntreatedLine(params: { companyName: string }): string {
  return `Nouveau lead « ${params.companyName} » : prévois une prise en charge (appel ou qualification) dès que possible.`;
}

export function buildWorkflowMissingAgentLine(params: { hint?: string }): string {
  const h = params.hint?.trim();
  return `Un dossier sur ton périmètre n’a pas d’agent assigné alors que l’équipe est connue.${h ? ` ${h}` : ""} La direction peut l’affecter depuis le cockpit si besoin.`;
}

export function buildMissingFieldsLine(params: { entityLabel: string; fields: string[] }): string {
  const f = params.fields.slice(0, 4).join(", ");
  return `Sur ${params.entityLabel}, il manque encore : ${f}. Complète ces champs pour débloquer la suite du dossier.`;
}

export function buildManagerTeamSignalsLine(params: { weakSignalCount: number; summary: string }): string {
  return `Ton équipe a ${params.weakSignalCount} signal(x) à surveiller aujourd’hui (vue agrégée, sans détail nominatif ici). ${params.summary}`;
}

export function buildAgentAckReply(params: { nextHint?: string }): string {
  return `Noté.${params.nextHint ? ` ${params.nextHint}` : " Tiens-moi au courant si tu bloques."}`;
}

export function buildAgentEscalationAck(): string {
  return "J’escalade vers la direction avec le contexte. Tu recevras une copie dans ce fil si une réponse arrive.";
}

export function buildAgentResolvedAck(): string {
  return "Parfait, je clos ce sujet côté agent. Tu peux rouvrir une conversation si besoin.";
}

export function buildAgentSnoozeAck(): string {
  return "D’accord, je repousse les relances sur ce sujet. Reviens quand tu es prêt.";
}

export function buildAgentAskClarify(): string {
  return "Merci pour la précision. Peux-tu indiquer quel dossier ou quel blocage exact (référence ou nom) ?";
}
