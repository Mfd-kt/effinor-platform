import {
  isCallbackOverdue,
  isTerminalCallbackStatus,
} from "@/features/commercial-callbacks/domain/callback-dates";

import { actionItem } from "./digest-actions";
import { digestOverallPriority, formatEur, maxPriority, newDigestId, parisYmd } from "./digest-helpers";
import type { RoleDigest } from "./digest-types";
import type { RoleDigestLoaderSnapshot } from "./load-role-digest-data";

export function buildCloserDigest(s: RoleDigestLoaderSnapshot): RoleDigest | null {
  const pipe = s.closerPipeline ?? [];
  const stale = s.closerStaleAgreements ?? [];
  const hotCb = s.closerHighCallbacks ?? [];
  const now = s.now;

  const sections: RoleDigest["sections"] = [];
  const p: string[] = [];
  if (pipe.length) p.push(`${pipe.length} dossier(s) en closing / accord à piloter.`);
  if (stale.length) p.push(`${stale.length} accord(s) envoyé(s) sans mouvement notable depuis 48h — relance signature.`);
  if (p.length) sections.push({ key: "pipeline", title: "Pipeline closer", items: p });

  const conv: string[] = [];
  const toClose = pipe.filter((w) => w.workflow_status === "to_close").length;
  const agr = pipe.filter((w) => w.workflow_status === "agreement_sent").length;
  if (toClose) conv.push(`${toClose} dossier(s) prêt(s) ou en phase closing actif.`);
  if (agr) conv.push(`${agr} en attente de signature.`);
  if (conv.length) sections.push({ key: "conversion", title: "Conversion", items: conv });

  const cbLines: string[] = [];
  const actionable = hotCb.filter((c) => !isTerminalCallbackStatus(c.status));
  for (const c of actionable.slice(0, 2)) {
    const overdue = isCallbackOverdue(c.status, c.callback_date, c.callback_time, now);
    cbLines.push(
      `${c.company_name} — ${formatEur(c.estimated_value_eur ?? null)}${overdue ? " (rappel en retard)" : ""}.`,
    );
  }
  if (cbLines.length) sections.push({ key: "callbacks", title: "Rappels utiles au closing", items: cbLines });

  const actions: RoleDigest["actionItems"] = [];
  const st = stale[0];
  if (st) {
    actions.push(
      actionItem({
        id: `wf:${st.id}`,
        label: "Relancer signature accord",
        description: "Accord envoyé sans mouvement — appel ou relance formalisée.",
        actionType: "followup",
        actionHref: `/leads/${st.lead_id}`,
        priority: "high",
      }),
    );
  }
  const w0 = pipe[0];
  if (w0 && actions.length < 3) {
    actions.push(
      actionItem({
        id: `wf:${w0.id}`,
        label: "Ouvrir le dossier prioritaire",
        description: "Premier dossier de la file closer.",
        actionType: "open",
        actionHref: `/leads/${w0.lead_id}`,
        priority: stale.length ? "high" : "normal",
      }),
    );
  }
  const c0 = actionable[0];
  if (c0 && actions.length < 3) {
    actions.push(
      actionItem({
        id: `cb:${c0.id}`,
        label: `Callback : ${c0.company_name}`,
        description: "Piste conversion — rappelle le décideur.",
        actionType: "call",
        actionHref: "/commercial-callbacks",
        phone: c0.phone,
        impactEuro: c0.estimated_value_eur ?? null,
        priority: "normal",
      }),
    );
  }

  const ai = s.aiOpsBrief;
  if (ai && ai.openConversations > 0 && actions.length < 3) {
    actions.push(
      actionItem({
        id: "aiops:inbox",
        label: "Points IA Ops",
        description: `${ai.openConversations} conversation(s) à consulter.`,
        actionType: "review",
        actionHref: "/agent-operations",
        priority: "low",
      }),
    );
  }

  let summary = "";
  if (stale.length) summary = `${stale.length} accord(s) à relancer — priorité avant 14h si possible.`;
  else if (pipe.length) summary = `${pipe.length} dossier(s) à faire avancer vers la signature.`;
  else if (actionable.length) summary = `${actionable.length} piste(s) rappel utile au closing.`;
  else summary = "Peu de charge visible sur le closing — surveille les nouveaux dossiers assignés.";

  let priority: RoleDigest["priority"] = "low";
  if (stale.length >= 2) priority = "critical";
  else if (stale.length || pipe.length >= 8) priority = "high";
  else if (pipe.length || actionable.length) priority = "normal";

  const digest: RoleDigest = {
    id: newDigestId(),
    roleTarget: "closer",
    targetUserId: s.userId,
    title: `Digest closer — ${parisYmd(now)}`,
    summary,
    priority,
    sections: sections.filter((x) => x.items.length),
    actionItems: actions.slice(0, 3),
    generatedAt: now.toISOString(),
  };
  digest.priority = maxPriority(digest.priority, digestOverallPriority(digest));
  return digest;
}
