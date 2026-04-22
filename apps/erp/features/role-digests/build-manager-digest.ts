import { actionItem } from "./digest-actions";
import { digestOverallPriority, maxPriority, newDigestId, parisYmd } from "./digest-helpers";
import type { RoleDigest } from "./digest-types";
import type { RoleDigestLoaderSnapshot } from "./load-role-digest-data";

export async function buildManagerDigest(s: RoleDigestLoaderSnapshot): Promise<RoleDigest | null> {
  const sla = s.managerSla ?? [];
  const now = s.now;

  const sections: RoleDigest["sections"] = [];

  const slaItems: string[] = [];
  const slaCrit = sla.filter((x) => x.status === "critical");
  const slaBad = sla.filter((x) => x.status === "breached" || x.status === "critical");
  if (slaCrit.length) slaItems.push(`${slaCrit.length} SLA critique(s) sous ton arbitrage (stock / délais).`);
  if (slaBad.length && !slaCrit.length) slaItems.push(`${slaBad.length} SLA en dépassement à traiter avec l’équipe.`);
  const slaWarn = sla.filter((x) => x.status === "warning");
  if (slaWarn.length) slaItems.push(`${slaWarn.length} alerte(s) SLA — anticipe avant escalade.`);
  if (slaItems.length) sections.push({ key: "sla", title: "SLA & arbitrage", items: slaItems });

  const mgmt: string[] = [];
  mgmt.push("Top 3 management : 1) traiter les SLA critiques 2) synchroniser avec les agents sous tension 3) revue cockpit.");
  sections.push({ key: "mgmt", title: "Pilotage", items: mgmt });

  const actions: RoleDigest["actionItems"] = [];
  if (slaCrit.length) {
    actions.push(
      actionItem({
        id: "mgr:sla",
        label: "Arbitrer les SLA critiques",
        description: "Ouvre le cockpit pour vue transverse et décisions rapides.",
        actionType: "review",
        actionHref: "/cockpit",
        priority: "critical",
      }),
    );
  }
  if (actions.length < 3) {
    actions.push(
      actionItem({
        id: "mgr:cockpit",
        label: "Vue cockpit équipe",
        description: "Anomalies, cash et pipeline sur ton périmètre.",
        actionType: "open",
        actionHref: "/cockpit",
        priority: "normal",
      }),
    );
  }

  const ai = s.aiOpsBrief;
  if (ai && ai.escalatedCount > 0 && actions.length < 3) {
    actions.push(
      actionItem({
        id: "aiops:esc",
        label: "Escalades IA Ops",
        description: `${ai.escalatedCount} escalade(s) récente(s) sur ton compte manager.`,
        actionType: "review",
        actionHref: "/agent-operations",
        priority: "high",
      }),
    );
  }

  let summary = "";
  if (slaCrit.length) {
    summary = "Situation critique sur SLA — arbitrage attendu aujourd’hui.";
  } else if (slaBad.length) {
    summary = "Tensions modérées : surveille les SLA en dépassement.";
  } else {
    summary = "Pilotage standard : surveille les files et les signaux SLA.";
  }

  let priority: RoleDigest["priority"] = "normal";
  if (slaCrit.length) priority = "critical";
  else if (slaBad.length) priority = "high";

  const digest: RoleDigest = {
    id: newDigestId(),
    roleTarget: "manager",
    targetUserId: s.userId,
    title: `Digest manager — ${parisYmd(now)}`,
    summary,
    priority,
    sections: sections.filter((x) => x.items.length),
    actionItems: actions.slice(0, 3),
    generatedAt: now.toISOString(),
  };
  digest.priority = maxPriority(digest.priority, digestOverallPriority(digest));
  return digest;
}
