import { createClient } from "@/lib/supabase/server";

import { actionItem } from "./digest-actions";
import { digestOverallPriority, maxPriority, newDigestId, parisYmd } from "./digest-helpers";
import type { RoleDigest } from "./digest-types";
import type { RoleDigestLoaderSnapshot } from "./load-role-digest-data";

export async function enrichManagerSnapshotWithNames(s: RoleDigestLoaderSnapshot): Promise<Map<string, string>> {
  const ids = (s.managerConfirmateurLoads ?? []).map((x) => x.userId);
  if (!ids.length) return new Map();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
  const m = new Map<string, string>();
  for (const p of data ?? []) {
    m.set(p.id, p.full_name?.trim() || p.email || p.id.slice(0, 8));
  }
  return m;
}

export async function buildManagerDigest(s: RoleDigestLoaderSnapshot): Promise<RoleDigest | null> {
  const loads = s.managerConfirmateurLoads ?? [];
  const sla = s.managerSla ?? [];
  const now = s.now;
  const names = await enrichManagerSnapshotWithNames(s);

  const sections: RoleDigest["sections"] = [];
  const team: string[] = [];
  const heavy = loads.filter((l) => l.backlog >= 8);
  const crit = loads.filter((l) => l.backlog >= 12);
  if (loads.length) {
    team.push(`${loads.length} confirmateur(s) suivis sur ton périmètre.`);
    if (crit.length) team.push(`${crit.length} confirmateur(s) au-delà du seuil critique (backlog).`);
    else if (heavy.length) team.push(`${heavy.length} confirmateur(s) avec file élevée — arbitrage utile.`);
  } else {
    team.push("Pas de confirmateur identifié sur tes équipes — vérifie les affectations CEE.");
  }
  sections.push({ key: "team", title: "Équipe", items: team });

  const slaItems: string[] = [];
  const slaCrit = sla.filter((x) => x.status === "critical");
  const slaBad = sla.filter((x) => x.status === "breached" || x.status === "critical");
  if (slaCrit.length) slaItems.push(`${slaCrit.length} SLA critique(s) sous ton arbitrage (stock / délais).`);
  if (slaBad.length && !slaCrit.length) slaItems.push(`${slaBad.length} SLA en dépassement à traiter avec l’équipe.`);
  const slaWarn = sla.filter((x) => x.status === "warning");
  if (slaWarn.length) slaItems.push(`${slaWarn.length} alerte(s) SLA — anticipe avant escalade.`);
  if (slaItems.length) sections.push({ key: "sla", title: "SLA & arbitrage", items: slaItems });

  const mgmt: string[] = [];
  mgmt.push("Top 3 management : 1) débloquer la plus grosse file confirmateur 2) traiter les SLA critiques 3) synchroniser avec les agents sous tension.");
  sections.push({ key: "mgmt", title: "Pilotage", items: mgmt });

  const actions: RoleDigest["actionItems"] = [];
  const topLoad = [...loads].sort((a, b) => b.backlog - a.backlog)[0];
  if (topLoad && topLoad.backlog >= 4) {
    const label = names.get(topLoad.userId) ?? "Confirmateur";
    actions.push(
      actionItem({
        id: `mgr:co:${topLoad.userId}`,
        label: `Backlog ${label}`,
        description: `${topLoad.backlog} dossier(s) en attente confirmateur — priorise avec lui.`,
        actionType: "assign",
        actionHref: "/cockpit",
        priority: topLoad.backlog >= 12 ? "critical" : "high",
      }),
    );
  }
  if (slaCrit.length && actions.length < 3) {
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
  if (crit.length || slaCrit.length) {
    summary = "Situation critique sur file ou SLA — arbitrage attendu aujourd’hui.";
  } else if (heavy.length || slaBad.length) {
    summary = "Tensions modérées : surveille les confirmateurs les plus chargés et les SLA.";
  } else {
    summary = "Pilotage standard : surveille les files et les signaux SLA.";
  }

  let priority: RoleDigest["priority"] = "normal";
  if (slaCrit.length || crit.length) priority = "critical";
  else if (slaBad.length || heavy.length) priority = "high";

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
