import type { CockpitAiContext } from "./cockpit-ai-types";
import { computeCockpitRecommendationPriority } from "./cockpit-ai-priority";
import type { CockpitDataForAi } from "./build-cockpit-ai-context";
import { buildAiActionFieldsForRecommendation } from "../ai-actions/map-recommendation-action";
import type { CockpitAiRecommendation } from "../types";

type Draft = CockpitAiRecommendation & { _sortScore: number };

function pushRec(
  drafts: Draft[],
  r: Omit<
    CockpitAiRecommendation,
    "priority" | "confidence" | "reasonCodes" | "executable" | "actionType" | "actionPayload" | "executionStatus" | "executionMessage"
  > & { _signals: Parameters<typeof computeCockpitRecommendationPriority>[0] },
) {
  const { _signals, ...base } = r;
  const p = computeCockpitRecommendationPriority(_signals);
  const mergedBase = {
    ...base,
    priority: p.priority,
    confidence: p.confidence,
    reasonCodes: p.reasonCodes,
  };
  const aiFields = buildAiActionFieldsForRecommendation(mergedBase);
  drafts.push({
    ...mergedBase,
    ...aiFields,
    _sortScore: p.sortScore,
  });
}

function dedupeKeepStrongest(drafts: Draft[]): Draft[] {
  const byId = new Map<string, Draft>();
  for (const d of drafts) {
    const prev = byId.get(d.id);
    if (!prev || d._sortScore > prev._sortScore) byId.set(d.id, d);
  }
  return [...byId.values()];
}

export function buildCockpitAiRecommendationsFallback(
  ctx: CockpitAiContext,
  data: CockpitDataForAi,
): CockpitAiRecommendation[] {
  const drafts: Draft[] = [];

  if (data.internalSla && (data.internalSla.totals.critical > 0 || data.internalSla.totals.breached > 0)) {
    const t = data.internalSla.totals;
    pushRec(drafts, {
      id: "ai:internal-sla-summary",
      title: "SLA internes : dépassements à traiter",
      description: `${t.critical} critique(s), ${t.breached} dépassement(s), ${t.warning} en alerte — ${t.resolvedTodayParis} résolu(s) aujourd’hui (Paris).`,
      category: "workflow",
      impactEuro: null,
      relatedEntityType: "system",
      relatedEntityId: null,
      actionLabel: "Voir le cockpit",
      actionHref: "/cockpit",
      phone: null,
      _signals: {
        slaInternalCriticalCount: t.critical,
        slaBreachedCount: t.breached,
      },
    });
  }

  if (!data.automation.cronHealthy || data.automation.health === "problem") {
    pushRec(drafts, {
      id: "ai:automation-cron-health",
      title: "Vérifier les automations et le cron",
      description: `${data.automation.failed} échec(s) sur ${data.automation.windowHours}h · santé : ${data.automation.health}.`,
      category: "automation",
      impactEuro: null,
      relatedEntityType: "system",
      relatedEntityId: null,
      actionLabel: "Voir les erreurs",
      actionHref: "/cockpit",
      phone: null,
      _signals: {
        automationCritical: data.automation.health === "problem",
        cronUnhealthy: !data.automation.cronHealthy,
        batchCount: data.automation.failed,
      },
    });
  }

  if (data.automation.callbackAutoFollowup.failed >= 2) {
    pushRec(drafts, {
      id: "ai:automation-callback-followup",
      title: "Relances auto rappels : échecs à traiter",
      description: `${data.automation.callbackAutoFollowup.failed} échec(s) callback_auto_followup (${data.automation.callbackAutoFollowup.runs} exécutions).`,
      category: "automation",
      impactEuro: null,
      relatedEntityType: "system",
      relatedEntityId: null,
      actionLabel: "Voir les rappels",
      actionHref: "/commercial-callbacks",
      phone: null,
      _signals: {
        automationCritical: data.automation.callbackAutoFollowup.failed >= 4,
        batchCount: data.automation.callbackAutoFollowup.failed,
      },
    });
  }

  if (data.automation.slackFailed >= 2 || data.automation.emailFailed >= 3) {
    pushRec(drafts, {
      id: "ai:automation-channels",
      title: "Notifications Slack / emails en échec",
      description: `Slack : ${data.automation.slackFailed} échec(s) · emails relances : ${data.automation.emailFailed}.`,
      category: "automation",
      impactEuro: null,
      relatedEntityType: "system",
      relatedEntityId: null,
      actionLabel: "Voir le cockpit",
      actionHref: "/cockpit",
      phone: null,
      _signals: {
        automationCritical: data.automation.slackFailed >= 4,
        batchCount: data.automation.slackFailed + data.automation.emailFailed,
      },
    });
  }

  for (const a of ctx.criticalAlerts.slice(0, 3)) {
    const alertCat = a.id.startsWith("period-leads") ? "lead" : "workflow";
    pushRec(drafts, {
      id: `ai:alert:${a.id}`,
      title: a.title,
      description: a.message.slice(0, 160),
      category: alertCat,
      impactEuro: null,
      relatedEntityType: "system",
      relatedEntityId: null,
      actionLabel: a.href.includes("commercial-callbacks") ? "Ouvrir" : "Ouvrir",
      actionHref: a.href,
      phone: null,
      _signals: { alertCritical: true },
    });
  }

  if (ctx.overdueHighValue.count >= 2) {
    const sum = Math.round(ctx.overdueHighValue.sumValueEur);
    pushRec(drafts, {
      id: "ai:callbacks-overdue-hv-batch",
      title: `Relancer ${ctx.overdueHighValue.count} rappels en retard à forte valeur`,
      description: `Montants estimés cumulés ~${sum.toLocaleString("fr-FR")} € — prioriser l’appel.`,
      category: "cash",
      impactEuro: sum > 0 ? sum : null,
      relatedEntityType: "callback",
      relatedEntityId: null,
      actionLabel: "Ouvrir la file",
      actionHref: "/commercial-callbacks",
      phone: null,
      _signals: {
        overdue: true,
        batchCount: ctx.overdueHighValue.count,
        valueCents: sum * 100,
      },
    });
  }

  const addedCallbackIds = new Set<string>();

  const urgentCallbacks = ctx.topCallbacks
    .filter((c) => c.overdue || c.dueToday)
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      if (a.dueToday !== b.dueToday) return a.dueToday ? -1 : 1;
      return b.score - a.score;
    });

  for (const cb of urgentCallbacks.slice(0, 6)) {
    if (addedCallbackIds.has(cb.id)) continue;
    addedCallbackIds.add(cb.id);
    const v = cb.valueEur != null ? Math.round(cb.valueEur) : null;
    const valueLine =
      v != null ? `~${v.toLocaleString("fr-FR")} € estimés · score ${cb.score}` : `Score ${cb.score}`;
    const convertLine = cb.canConvert ? " · passage en lead immédiat possible après qualification." : "";
    const noCallLine = cb.neverCalled ? " · aucun appel loggé — ACTION." : "";

    let title: string;
    if (cb.canConvert && (cb.overdue || cb.dueToday)) {
      title = `Convertir callback — ${cb.company} · passage en lead immédiat`;
    } else if (cb.overdue) {
      title = `CALL NOW — Appeler ${cb.company} — rappel en retard`;
    } else {
      title = `Appeler ${cb.company} — opportunité active aujourd'hui`;
    }

    pushRec(drafts, {
      id: `ai:callback-call:${cb.id}`,
      title,
      description: `${valueLine}${noCallLine}${convertLine}`.slice(0, 220),
      category: "callback",
      impactEuro: v,
      relatedEntityType: "callback",
      relatedEntityId: cb.id,
      actionLabel: cb.phone ? "Appeler" : "Ouvrir le rappel",
      actionHref: "/commercial-callbacks",
      phone: cb.phone,
      canConvertCallback: cb.canConvert,
      _signals: {
        overdue: cb.overdue,
        dueTodayCallback: cb.dueToday && !cb.overdue,
        callbackNeverCalled: cb.neverCalled,
        callbackScore: cb.score,
        valueCents: (cb.valueEur ?? 0) * 100,
        proximityConversion: cb.score >= 80 || cb.canConvert,
      },
    });
  }

  let priorityScoreCallbacks = 0;
  for (const cb of ctx.topCallbacks) {
    if (addedCallbackIds.has(cb.id)) continue;
    if (cb.score < 60) continue;
    if (cb.overdue || cb.dueToday) continue;
    addedCallbackIds.add(cb.id);
    priorityScoreCallbacks += 1;
    const v = cb.valueEur != null ? Math.round(cb.valueEur) : null;
    pushRec(drafts, {
      id: `ai:callback-call:${cb.id}`,
      title: `PRIORITÉ — Appeler ${cb.company} · score ${cb.score}`,
      description:
        v != null
          ? `~${v.toLocaleString("fr-FR")} € · rappel à fort potentiel — traiter avant les autres.`
          : "Rappel à fort potentiel — traiter avant les autres.",
      category: "callback",
      impactEuro: v,
      relatedEntityType: "callback",
      relatedEntityId: cb.id,
      actionLabel: cb.phone ? "Appeler" : "Ouvrir le rappel",
      actionHref: "/commercial-callbacks",
      phone: cb.phone,
      canConvertCallback: cb.canConvert,
      _signals: {
        callbackScore: cb.score,
        valueCents: (cb.valueEur ?? 0) * 100,
        proximityConversion: cb.score >= 75 || cb.canConvert,
      },
    });
    if (priorityScoreCallbacks >= 3) break;
  }

  let noCallCallbacks = 0;
  for (const cb of ctx.topCallbacks) {
    if (addedCallbackIds.has(cb.id)) continue;
    if (!cb.neverCalled || cb.score < 40) continue;
    addedCallbackIds.add(cb.id);
    noCallCallbacks += 1;
    const v = cb.valueEur != null ? Math.round(cb.valueEur) : null;
    pushRec(drafts, {
      id: `ai:callback-call:${cb.id}`,
      title: `ACTION — Rappel sans appel loggé — ${cb.company}`,
      description:
        v != null
          ? `~${v.toLocaleString("fr-FR")} € · score ${cb.score} — planifier l’appel maintenant.`
          : `Score ${cb.score} — planifier l’appel maintenant.`,
      category: "callback",
      impactEuro: v,
      relatedEntityType: "callback",
      relatedEntityId: cb.id,
      actionLabel: cb.phone ? "Appeler" : "Ouvrir le rappel",
      actionHref: "/commercial-callbacks",
      phone: cb.phone,
      canConvertCallback: cb.canConvert,
      _signals: {
        callbackNeverCalled: true,
        callbackScore: cb.score,
        valueCents: (cb.valueEur ?? 0) * 100,
      },
    });
    if (noCallCallbacks >= 2) break;
  }

  for (const lead of ctx.newLeadsNeedAction.slice(0, 3)) {
    if (drafts.some((d) => d.id === `ai:lead-new-action:${lead.id}`)) continue;
    pushRec(drafts, {
      id: `ai:lead-new-action:${lead.id}`,
      title: `ACTION — Lead « Nouveau » sans traitement — ${lead.company}`,
      description: "Ouvrir et qualifier tout de suite — chaque heure compte pour la conversion.",
      category: "lead",
      impactEuro: null,
      relatedEntityType: "lead",
      relatedEntityId: lead.id,
      actionLabel: "Ouvrir le lead",
      actionHref: `/leads/${lead.id}`,
      phone: lead.phone,
      _signals: {
        proximityConversion: true,
        batchCount: ctx.newLeadsNeedAction.length,
      },
    });
  }

  const stuckCloser = ctx.closerLoads.find((c) => c.pipelineOpen >= 6 && c.signedWeek === 0);
  if (stuckCloser) {
    pushRec(drafts, {
      id: `ai:staffing:closer-pipe:${stuckCloser.userId}`,
      title: `Pipeline closer sans signature — ${stuckCloser.name}`,
      description: `${stuckCloser.pipelineOpen} dossiers ouverts ·0 signé cette semaine.`,
      category: "staffing",
      impactEuro: null,
      relatedEntityType: "user",
      relatedEntityId: stuckCloser.userId,
      actionLabel: "Voir le closer",
      actionHref: "/leads",
      phone: null,
      _signals: {
        staffingCritical: stuckCloser.pipelineOpen >= 8,
        batchCount: stuckCloser.pipelineOpen,
        pipelineBlocked: true,
      },
    });
  }

  for (const h of ctx.humanAnomaliesTop.filter((x) => x.level === "critique").slice(0, 1)) {
    pushRec(drafts, {
      id: `ai:staffing:anomaly:${h.id}`,
      title: `Anomalie équipe — ${h.displayName}`,
      description: h.problem.slice(0, 200),
      category: "staffing",
      impactEuro: null,
      relatedEntityType: "user",
      relatedEntityId: h.userId,
      actionLabel: "Voir ses dossiers",
      actionHref: "/leads",
      phone: null,
      _signals: { staffingCritical: true },
    });
  }

  if (data.pipeline.unassignedAgent >= 5) {
    pushRec(drafts, {
      id: "ai:pipeline-unassigned",
      title: `${data.pipeline.unassignedAgent} dossiers sans agent assigné`,
      description: "Les dossiers sans propriétaire ralentissent le funnel commercial.",
      category: "workflow",
      impactEuro: null,
      relatedEntityType: "workflow",
      relatedEntityId: null,
      actionLabel: "Voir les leads",
      actionHref: "/leads",
      phone: null,
      _signals: {
        pipelineBlocked: true,
        batchCount: data.pipeline.unassignedAgent,
      },
    });
  }

  const autoHint = data.aiExecutionHints.autoAssignAgent;
  if (autoHint) {
    pushRec(drafts, {
      id: `ai:auto-assign-agent:${autoHint.workflowId}:${autoHint.agentUserId}`,
      title: "Assigner un agent au dossier sans propriétaire",
      description:
        "Premier dossier sans agent détecté : proposition d’affectation vers un agent actif de l’équipe de la fiche (action traçable, à valider).",
      category: "workflow",
      impactEuro: null,
      relatedEntityType: "workflow",
      relatedEntityId: autoHint.workflowId,
      actionLabel: "Voir les leads",
      actionHref: "/leads",
      phone: null,
      _signals: {
        pipelineBlocked: true,
        batchCount: 1,
      },
    });
  }

  const stuckSheet = ctx.workflowStuckBySheet[0];
  if (stuckSheet && stuckSheet.count >= 6) {
    pushRec(drafts, {
      id: `ai:workflow-stuck-sheet:${stuckSheet.label}`,
      title: `Dossiers bloqués sur « ${stuckSheet.label} »`,
      description: `~${stuckSheet.count} dossiers dans les files stale / bloquées pour cette fiche.`,
      category: "workflow",
      impactEuro: null,
      relatedEntityType: "sheet",
      relatedEntityId: null,
      actionLabel: "Voir les fiches",
      actionHref: "/settings/roles",
      phone: null,
      _signals: {
        configBlocksWorkflows: stuckSheet.count,
        pipelineBlocked: true,
      },
    });
  }

  for (const s of ctx.sheetsWithoutTeam.slice(0, 2)) {
    pushRec(drafts, {
      id: `ai:config-sheet:${s.sheetId}`,
      title: `Corriger la fiche « ${s.label} »`,
      description: "Fiche sans équipe active — risque de blocage commercial sur le réseau.",
      category: "config",
      impactEuro: null,
      relatedEntityType: "sheet",
      relatedEntityId: s.sheetId,
      actionLabel: "Corriger la fiche",
      actionHref: "/settings/roles",
      phone: null,
      _signals: {
        configBlocksWorkflows: 12,
      },
    });
  }

  if (ctx.summary.hotSimulatedLeads24h >= 2) {
    const hotLeadId = ctx.topHotLeads[0]?.id;
    pushRec(drafts, {
      id: hotLeadId ? `ai:leads-hot-24h:${hotLeadId}` : "ai:leads-hot-24h",
      title: `${ctx.summary.hotSimulatedLeads24h} leads simulateur (24 h) — les appeler maintenant`,
      description:
        "Cash immédiat : simulateurs récents — premier contact dans l’heure = meilleur taux de conversion.",
      category: "lead",
      impactEuro: null,
      relatedEntityType: "lead",
      relatedEntityId: hotLeadId ?? null,
      actionLabel: "Voir les leads",
      actionHref: "/leads",
      phone: null,
      _signals: {
        batchCount: ctx.summary.hotSimulatedLeads24h,
        proximityConversion: true,
      },
    });
  }

  const hl = ctx.topHotLeads[0];
  if (hl && drafts.every((d) => !d.id.startsWith(`ai:lead-qual:${hl.id}`))) {
    const v = hl.valueEur != null ? Math.round(hl.valueEur) : null;
    pushRec(drafts, {
      id: `ai:lead-qual:${hl.id}`,
      title: `Qualifier tout de suite — ${hl.company} (${hl.statusLabel})`,
      description: `Lead chaud — statut « ${hl.statusLabel} » · traitement immédiat = cash.`,
      category: "lead",
      impactEuro: v,
      relatedEntityType: "lead",
      relatedEntityId: hl.id,
      actionLabel: "Ouvrir le lead",
      actionHref: `/leads/${hl.id}`,
      phone: hl.phone,
      _signals: {
        valueCents: (hl.valueEur ?? 0) * 100,
        proximityConversion: true,
      },
    });
  }

  const cash = data.cashImmediate[0];
  if (cash && cash.kind === "lead" && drafts.length < 8) {
    const v = cash.estimatedValueEur ?? (cash.valueCents > 0 ? Math.round(cash.valueCents / 100) : null);
    pushRec(drafts, {
      id: `ai:cash-lead:${cash.id}`,
      title: `Cash immédiat — ${cash.company}`,
      description: `${cash.statusLabel} · fort potentiel dans le tableau cash.`,
      category: "cash",
      impactEuro: v,
      relatedEntityType: "lead",
      relatedEntityId: cash.id,
      actionLabel: "Ouvrir",
      actionHref: cash.href,
      phone: cash.phone,
      _signals: {
        valueCents: cash.valueCents,
        proximityConversion: true,
      },
    });
  }

  const deduped = dedupeKeepStrongest(drafts);
  deduped.sort((a, b) => b._sortScore - a._sortScore);
  return deduped.slice(0, 10).map(({ _sortScore: _, ...r }) => r);
}
