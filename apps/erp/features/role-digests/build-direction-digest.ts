import { actionItem } from "./digest-actions";
import { digestOverallPriority, maxPriority, newDigestId, parisYmd } from "./digest-helpers";
import { coercePriorityFromSignals } from "./digest-priority";
import type { RoleDigest } from "./digest-types";
import type { RoleDigestLoaderSnapshot } from "./load-role-digest-data";

export function buildDirectionDigest(s: RoleDigestLoaderSnapshot): RoleDigest | null {
  const now = s.now;
  const leadsToday = s.directionLeadsToday ?? 0;
  const autoFail = s.directionAutomationFailed48h ?? 0;
  const slaCrit = s.directionSlaCritical ?? 0;
  const hvOverdue = s.directionHighValueOverdue ?? 0;
  const noTeam = s.directionSheetsWithoutTeam ?? 0;
  const aiOk = s.directionAiExecutedToday ?? 0;
  const unassigned = s.directionUnassignedWorkflows ?? 0;
  const ai = s.aiOpsBrief;

  const risks: string[] = [];
  if (leadsToday <= 1) risks.push(`Seulement ${leadsToday} lead créé aujourd’hui (Paris) : risque de creux commercial.`);
  if (hvOverdue >= 3) risks.push(`${hvOverdue} rappels haute valeur encore non traités (retard).`);
  if (autoFail >= 2) risks.push(`${autoFail} exécution(s) automation en échec sur 48h.`);
  if (unassigned >= 3) risks.push(`${unassigned} dossier(s) sans agent assigné — friction pipeline.`);
  if (noTeam >= 2) risks.push(`${noTeam} dossier(s) actif(s) sans équipe CEE — configuration ou staffing.`);
  if (slaCrit >= 1) risks.push(`${slaCrit} SLA interne(s) en critique réseau.`);

  const cash: string[] = [];
  if (hvOverdue > 0) cash.push(`${hvOverdue} callback(s) ≥ 8k€ en retard : cash à sécuriser rapidement.`);
  cash.push("Priorise le cockpit « cash immédiat » pour les opportunités du jour.");

  const auto: string[] = [];
  if (autoFail) auto.push(`Automations : ${autoFail} échec(s) récents — vérifier logs et webhooks.`);
  else auto.push("Automations : pas d’alerte volume d’échecs sur 48h.");

  const ia: string[] = [];
  ia.push(`IA : ${aiOk} action(s) exécutée(s) avec succès aujourd’hui (UTC).`);
  if (ai && ai.escalatedCount > 0) ia.push(`${ai.escalatedCount} conversation(s) IA en escalade sur ton compte direction.`);

  const sections: RoleDigest["sections"] = [
    { key: "risks", title: "Risques (top)", items: risks.slice(0, 3) },
    { key: "cash", title: "Opportunités cash", items: cash.slice(0, 3) },
    { key: "auto", title: "Automations", items: auto.slice(0, 2) },
    { key: "ia", title: "IA & exécution", items: ia.slice(0, 2) },
  ].filter((x) => x.items.some((t) => t.trim().length > 0));

  const actions: RoleDigest["actionItems"] = [
    actionItem({
      id: "dir:cockpit",
      label: "Ouvrir le cockpit direction",
      description: "Vue synthétique risques, cash, équipe.",
      actionType: "open",
      actionHref: "/cockpit",
      priority: slaCrit || hvOverdue >= 3 ? "critical" : "high",
    }),
    actionItem({
      id: "dir:callbacks",
      label: "Rappels commerciaux",
      description: "Traiter les retards à forte valeur.",
      actionType: "review",
      actionHref: "/commercial-callbacks",
      priority: hvOverdue ? "critical" : "normal",
    }),
    actionItem({
      id: "dir:settings-cee",
      label: "Fiches CEE & équipes",
      description: "Corriger les dossiers sans équipe ou la config réseau.",
      actionType: "fix",
      actionHref: "/settings/roles",
      priority: noTeam >= 2 ? "high" : "low",
    }),
  ];

  const summaryParts: string[] = [];
  if (risks.length) summaryParts.push(`${risks.length} signal(aux) majeur(s).`);
  if (hvOverdue) summaryParts.push(`${hvOverdue} gros retard(s).`);
  if (aiOk) summaryParts.push(`${aiOk} action(s) IA réussie(s) aujourd’hui.`);
  const summary =
    summaryParts.length > 0
      ? summaryParts.join(" ")
      : "Réseau sous contrôle sur les indicateurs digest — approfondis via le cockpit si besoin.";

  const pr = coercePriorityFromSignals({
    overdueCount: hvOverdue,
    criticalCount: risks.length >= 2 ? 2 : 0,
    slaBreached: slaCrit,
    automationFailures: autoFail,
  });

  const digest: RoleDigest = {
    id: newDigestId(),
    roleTarget: "direction",
    targetUserId: s.userId,
    title: `Digest direction — ${parisYmd(now)}`,
    summary,
    priority: pr,
    sections,
    actionItems: actions,
    generatedAt: now.toISOString(),
  };
  digest.priority = maxPriority(digest.priority, digestOverallPriority(digest));
  return digest;
}
