import {
  CALLBACK_PRIORITY_LABELS,
  CALLBACK_STATUS_LABELS,
  type CallbackStatus,
} from "@/features/commercial-callbacks/domain/callback-status";
import {
  calendarDateInParis,
  isCallbackDueNow,
  isCallbackOverdue,
} from "@/features/commercial-callbacks/domain/callback-dates";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";
import type { CallbackAiContext, CallbackAiExtra, CallbackAiTone } from "@/features/commercial-callbacks/ai/callback-ai-types";

function statusLabel(status: string): string {
  if (status in CALLBACK_STATUS_LABELS) {
    return CALLBACK_STATUS_LABELS[status as CallbackStatus];
  }
  return status;
}

function priorityLabel(priority: string): string {
  if (priority in CALLBACK_PRIORITY_LABELS) {
    return CALLBACK_PRIORITY_LABELS[priority as keyof typeof CALLBACK_PRIORITY_LABELS];
  }
  return priority;
}

function eurFromRow(row: CommercialCallbackRow): number | null {
  if (row.estimated_value_eur != null && !Number.isNaN(Number(row.estimated_value_eur))) {
    return Number(row.estimated_value_eur);
  }
  if (row.estimated_value_cents != null) {
    return row.estimated_value_cents / 100;
  }
  return null;
}

function pickTone(
  row: CommercialCallbackRow,
  now: Date,
): { tone: CallbackAiTone; whyNow: string; agentGoal: string } {
  const attempts = row.attempts_count ?? 0;
  const temp = row.prospect_temperature;

  let whyNow =
    "C’est le créneau prévu pour relancer le prospect et faire avancer le dossier.";

  if (isCallbackOverdue(row.status, row.callback_date, row.callback_time, now)) {
    whyNow =
      "Ce rappel est en retard : mieux vaut rappeler tout de suite pour garder la confiance et le fil du dossier.";
  } else if (isCallbackDueNow(row.status, row.callback_date, row.callback_time, now)) {
    whyNow =
      "L’échéance est dans une fenêtre courte (aujourd’hui ou très proche) : c’est le bon moment pour joindre le contact.";
  } else if (row.callback_date === calendarDateInParis(now)) {
    whyNow = "L’échéance est aujourd’hui : profitez du créneau prévu pour relancer.";
  }

  if (attempts >= 3 || row.status === "cold_followup") {
    whyNow +=
      " Plusieurs essais déjà : rester bref, proposer un créneau précis ou un refus net.";
  }

  let agentGoal =
    "Obtenir soit un échange utile, soit un créneau de rappel clair, soit une décision (intérêt / pas intérêt).";

  if (temp === "hot") {
    agentGoal =
      "Concrétiser : proposition ou rendez-vous pour chiffrage / prochaine étape, avec une date.";
  } else if (temp === "warm") {
    agentGoal =
      "Qualifier le besoin, lever les derniers freins, proposer une suite simple (doc, appel, visio).";
  } else if (temp === "cold") {
    agentGoal =
      "Vérifier l’intérêt actuel, proposer un court échange ou un report daté, sans insister.";
  }

  let tone: CallbackAiTone = "direct";
  if (row.status === "cold_followup" || attempts >= 3 || row.status === "no_answer") {
    tone = "relance_legere";
  } else if (temp === "warm") {
    tone = "rassurant";
  } else if (temp === "hot") {
    tone = "direct";
  }

  return { tone, whyNow, agentGoal };
}

/**
 * Construit un contexte IA / affichage : pas de jargon interne ERP, libellés français.
 */
export function buildCallbackAiContext(
  row: CommercialCallbackRow,
  extra?: CallbackAiExtra,
  now: Date = new Date(),
): CallbackAiContext {
  const { tone, whyNow, agentGoal } = pickTone(row, now);

  const ceeSheetHint =
    extra?.ceeSheetLabel || extra?.ceeSheetCode
      ? [extra.ceeSheetCode, extra.ceeSheetLabel].filter(Boolean).join(" — ")
      : null;

  return {
    companyName: row.company_name,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    callbackReason: row.callback_reason ?? null,
    callbackComment: row.callback_comment,
    contextSummary: row.call_context_summary ?? null,
    preferredPeriod: row.callback_preferred_period ?? null,
    prospectTemperature: row.prospect_temperature,
    estimatedValueEur: eurFromRow(row),
    attemptsCount: row.attempts_count ?? 0,
    lastCallAt: row.last_call_at,
    callbackDate: row.callback_date,
    callbackTime: row.callback_time,
    nextReminderAt: row.next_reminder_at,
    source: row.source,
    statusLabel: `${statusLabel(row.status)} · priorité ${priorityLabel(row.priority)}`,
    whyNow,
    agentGoal,
    recommendedTone: tone,
    ceeSheetHint,
  };
}

/** Résumé court pour panneau agent (quelques secondes de lecture). */
export function buildCallbackAgentContextSections(ctx: CallbackAiContext): {
  title: string;
  body: string;
}[] {
  const sections: { title: string; body: string }[] = [];

  if (ctx.contextSummary?.trim()) {
    sections.push({ title: "Contexte", body: ctx.contextSummary.trim() });
  }
  if (ctx.callbackReason?.trim()) {
    sections.push({ title: "Raison du rappel", body: ctx.callbackReason.trim() });
  }

  sections.push({
    title: "Commentaire / notes",
    body: ctx.callbackComment,
  });

  sections.push({
    title: "Priorité & statut",
    body: ctx.statusLabel,
  });

  sections.push({
    title: "Tentatives",
    body:
      ctx.attemptsCount > 0
        ? `${ctx.attemptsCount} tentative(s)${ctx.lastCallAt ? ` — dernier contact : ${new Date(ctx.lastCallAt).toLocaleString("fr-FR")}` : ""}`
        : "Aucune tentative enregistrée.",
  });

  if (ctx.estimatedValueEur != null && ctx.estimatedValueEur > 0) {
    sections.push({
      title: "Valeur estimée",
      body: new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(ctx.estimatedValueEur),
    });
  }

  sections.push({
    title: "Pourquoi maintenant",
    body: ctx.whyNow,
  });
  sections.push({
    title: "Action recommandée",
    body: `${ctx.agentGoal} Ton : ${
      ctx.recommendedTone === "direct"
        ? "direct"
        : ctx.recommendedTone === "rassurant"
          ? "rassurant"
          : "relance légère"
    }.`,
  });

  if (ctx.ceeSheetHint) {
    sections.push({ title: "Fiche / projet", body: ctx.ceeSheetHint });
  }

  return sections;
}
