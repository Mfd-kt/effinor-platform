import {
  isCallbackDueToday,
  isCallbackOverdue,
  isTerminalCallbackStatus,
} from "@/features/commercial-callbacks/domain/callback-dates";
import { computeCommercialCallbackScore } from "@/features/commercial-callbacks/lib/callback-scoring";

import { actionItem } from "./digest-actions";
import { digestOverallPriority, formatEur, maxPriority, newDigestId, parisYmd } from "./digest-helpers";
import { coercePriorityFromSignals } from "./digest-priority";
import type { RoleDigest } from "./digest-types";
import type { RoleDigestLoaderSnapshot } from "./load-role-digest-data";

const MAX_PRIORITIES = 3;
const MAX_ITEMS = 5;

export function buildAgentDigest(s: RoleDigestLoaderSnapshot): RoleDigest | null {
  const cbs = s.agentCallbacks ?? [];
  const now = s.now;
  const active = cbs.filter((c) => !isTerminalCallbackStatus(c.status));
  const overdue = active.filter((c) => isCallbackOverdue(c.status, c.callback_date, c.callback_time, now));
  const dueToday = active.filter((c) => isCallbackDueToday(c.status, c.callback_date, c.callback_time, now));
  const critical = active.filter((c) => {
    const { businessScore } = computeCommercialCallbackScore(c, now);
    return String(c.priority).toLowerCase() === "critical" || businessScore >= 80 || (c.estimated_value_eur ?? 0) >= 8000;
  });

  const hotLeads = (s.agentHotLeads ?? []).filter((L) => L.simulated_at != null && (L.sim_saving_eur_30_selected ?? 0) > 0);

  const sections: RoleDigest["sections"] = [];
  const items: string[] = [];
  if (overdue.length) items.push(`${overdue.length} rappel(s) en retard — à traiter en priorité.`);
  if (dueToday.length) items.push(`${dueToday.length} rappel(s) à traiter aujourd’hui (Paris).`);
  if (critical.length && overdue.length + dueToday.length === 0) items.push(`${critical.length} rappel(s) à fort enjeu sur ton périmètre.`);
  if (items.length) sections.push({ key: "callbacks", title: "Rappels", items: items.slice(0, MAX_ITEMS) });

  const leadItems: string[] = [];
  if (hotLeads.length) {
    leadItems.push(`${hotLeads.length} lead(s) « simulateur » récent(s) sans prise en charge complète.`);
    for (const L of hotLeads.slice(0, 2)) {
      leadItems.push(`${L.company_name} — économie simulateur ${formatEur(L.sim_saving_eur_30_selected)}.`);
    }
  }
  if (leadItems.length) sections.push({ key: "leads", title: "Leads", items: leadItems.slice(0, MAX_ITEMS) });

  const perfItems: string[] = [];
  const treatedApprox = active.length <= 5 ? "File légère — bon moment pour avancer sur la qualité des relances." : `${active.length} rappels actifs : garde le rythme sur les plus anciens.`;
  perfItems.push(treatedApprox);
  sections.push({ key: "perf", title: "Lecture rapide", items: perfItems.slice(0, 2) });

  const actionItems: RoleDigest["actionItems"] = [];
  const topOverdue = overdue[0];
  if (topOverdue) {
    actionItems.push(
      actionItem({
        id: `cb:${topOverdue.id}`,
        label: `Rappel prioritaire : ${topOverdue.company_name}`,
        description: "En retard — ouvre la fiche et rappelle ou reprogramme.",
        actionType: "open",
        actionHref: "/commercial-callbacks",
        phone: topOverdue.phone,
        impactEuro: topOverdue.estimated_value_eur ?? null,
        priority: "high",
      }),
    );
  }
  const topDue = dueToday[0];
  if (topDue && actionItems.length < MAX_PRIORITIES) {
    actionItems.push(
      actionItem({
        id: `cb:${topDue.id}`,
        label: `Aujourd’hui : ${topDue.company_name}`,
        description: "Échéance du jour — traite avant la fin de la plage prévue.",
        actionType: "call",
        actionHref: "/commercial-callbacks",
        phone: topDue.phone,
        impactEuro: topDue.estimated_value_eur ?? null,
        priority: critical.some((c) => c.id === topDue.id) ? "high" : "normal",
      }),
    );
  }
  const hl = hotLeads[0];
  if (hl && actionItems.length < MAX_PRIORITIES) {
    actionItems.push(
      actionItem({
        id: `lead:${hl.id}`,
        label: `Lead simulateur : ${hl.company_name}`,
        description: "Prise en charge commerciale à finaliser.",
        actionType: "open",
        actionHref: `/leads/${hl.id}`,
        phone: hl.phone,
        impactEuro: hl.sim_saving_eur_30_selected,
        priority: "normal",
      }),
    );
  }

  const ai = s.aiOpsBrief;
  if (ai && ai.openConversations > 0 && actionItems.length < MAX_PRIORITIES) {
    actionItems.push(
      actionItem({
        id: "aiops:inbox",
        label: "Sujets sous surveillance (IA Ops)",
        description:
          ai.escalatedCount > 0
            ? `${ai.openConversations} conversation(s) ouverte(s), dont ${ai.escalatedCount} escalade(s).`
            : `${ai.openConversations} conversation(s) à traiter dans l’inbox agent.`,
        actionType: "review",
        actionHref: "/agent-operations",
        priority: ai.escalatedCount > 0 ? "high" : "normal",
      }),
    );
  }

  let summary = "";
  if (overdue.length || dueToday.length) {
    summary = `Tu as ${dueToday.length} rappel(s) à traiter aujourd’hui et ${overdue.length} en retard.`;
    if (critical.length) summary += ` Dont ${Math.min(critical.length, overdue.length + dueToday.length)} à enjeu élevé.`;
  } else if (hotLeads.length) {
    summary = `${hotLeads.length} lead(s) simulateur chaud(s) méritent une action rapide.`;
  } else {
    summary = "Peu de tension immédiate sur tes rappels — vérifie tout de même les relances en attente.";
  }

  const pr = coercePriorityFromSignals({
    overdueCount: overdue.length,
    criticalCount: critical.length,
    slaBreached: 0,
    automationFailures: 0,
  });

  const digest: RoleDigest = {
    id: newDigestId(),
    roleTarget: "agent",
    targetUserId: s.userId,
    title: `Digest agent — ${parisYmd(now)}`,
    summary,
    priority: pr,
    sections: sections.filter((x) => x.items.length > 0).slice(0, 4),
    actionItems: actionItems.slice(0, MAX_PRIORITIES),
    generatedAt: now.toISOString(),
  };
  digest.priority = maxPriority(digest.priority, digestOverallPriority(digest));
  return digest;
}
