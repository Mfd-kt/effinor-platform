import { actionItem } from "./digest-actions";
import { digestOverallPriority, maxPriority, newDigestId, parisYmd } from "./digest-helpers";
import type { RoleDigest } from "./digest-types";
import type { RoleDigestLoaderSnapshot } from "./load-role-digest-data";

const MAX_OLD = 3;

export function buildConfirmateurDigest(s: RoleDigestLoaderSnapshot): RoleDigest | null {
  const backlog = s.confirmateurBacklog ?? [];
  const sla = s.confirmateurSla ?? [];
  const now = s.now;
  const oldest = backlog.slice(0, MAX_OLD);

  const sections: RoleDigest["sections"] = [];
  const main: string[] = [];
  if (backlog.length) {
    main.push(`Backlog confirmateur : ${backlog.length} dossier(s) en « à confirmer ».`);
    if (oldest.length) {
      main.push(`Les plus anciens : mis à jour il y a plus longtemps — priorité flux.`);
    }
  }
  if (main.length) sections.push({ key: "backlog", title: "File confirmateur", items: main });

  const slaItems: string[] = [];
  const slaBad = sla.filter((x) => x.status === "breached" || x.status === "critical");
  const slaWarn = sla.filter((x) => x.status === "warning");
  if (slaBad.length) slaItems.push(`${slaBad.length} dossier(s) en dépassement SLA interne.`);
  if (slaWarn.length) slaItems.push(`${slaWarn.length} en alerte SLA — anticipe avant dépassement.`);
  if (slaItems.length) sections.push({ key: "sla", title: "SLA internes", items: slaItems });

  const qual: string[] = [];
  qual.push("Contrôle les champs obligatoires (coordonnées, pièces) avant qualification pour éviter les blocages closer.");
  sections.push({ key: "qual", title: "Qualité / flux", items: qual });

  const actions: RoleDigest["actionItems"] = [];
  const first = oldest[0];
  if (first) {
    actions.push(
      actionItem({
        id: `wf:${first.id}`,
        label: "Traiter le dossier le plus ancien",
        description: "Ouvre le lead lié et avance le statut confirmateur.",
        actionType: "review",
        actionHref: `/leads/${first.lead_id}`,
        priority: slaBad.length ? "critical" : "high",
      }),
    );
  }
  if (backlog.length > 5 && actions.length < 3) {
    actions.push(
      actionItem({
        id: "confirm:queue",
        label: "Voir la file complète",
        description: "Priorise les dossiers les plus anciens avant midi.",
        actionType: "open",
        actionHref: "/confirmateur",
        priority: "normal",
      }),
    );
  }

  const ai = s.aiOpsBrief;
  if (ai && ai.openConversations > 0 && actions.length < 3) {
    actions.push(
      actionItem({
        id: "aiops:inbox",
        label: "Synthèse IA Ops",
        description: `${ai.openConversations} sujet(s) ouvert(s) sur ton compte.`,
        actionType: "review",
        actionHref: "/agent-operations",
        priority: ai.escalatedCount ? "high" : "normal",
      }),
    );
  }

  let summary = "";
  if (!backlog.length && !sla.length) {
    summary = "Pas de tension majeure sur ta file confirmateur pour l’instant.";
  } else {
    summary = `Backlog à ${backlog.length} dossier(s)`;
    if (slaBad.length) summary += ` — ${slaBad.length} en dépassement SLA.`;
    else if (slaWarn.length) summary += ` — ${slaWarn.length} en alerte SLA.`;
    summary += ".";
  }

  let priority: RoleDigest["priority"] = "low";
  if (slaBad.length || backlog.length >= 12) priority = "critical";
  else if (slaWarn.length || backlog.length >= 6) priority = "high";
  else if (backlog.length) priority = "normal";

  const digest: RoleDigest = {
    id: newDigestId(),
    roleTarget: "confirmateur",
    targetUserId: s.userId,
    title: `Digest confirmateur — ${parisYmd(now)}`,
    summary,
    priority,
    sections: sections.filter((x) => x.items.length),
    actionItems: actions.slice(0, 3),
    generatedAt: now.toISOString(),
  };
  digest.priority = maxPriority(digest.priority, digestOverallPriority(digest));
  return digest;
}
