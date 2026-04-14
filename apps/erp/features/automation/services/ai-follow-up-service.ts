import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getAutomationConfig } from "@/features/automation/domain/config";
import { AI_FOLLOW_UP_SYSTEM_PROMPT } from "@/features/automation/templates/ai-follow-up-prompt";
import { insertAutomationLogSupabase } from "@/features/automation/services/automation-log-service";
import type { Database, Json } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

export type AiFollowUpReason =
  | "agreement_sent_stale"
  | "docs_no_response"
  | "follow_up_overdue"
  | "manual";

export type AiFollowUpContext = {
  leadId: string;
  workflowId: string;
  companyName: string;
  contactName: string | null;
  sheetLabel: string | null;
  workflowStatusPublic: string;
  /** Contexte métier sans vocabulaire interne. */
  situationSummary: string;
  lastClientTouchSummary: string | null;
  potentialHint: string | null;
  reason: AiFollowUpReason;
};

function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function getModel(): string {
  return (
    process.env.OPENAI_CHAT_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini"
  );
}

function qualString(json: Json | null | undefined, key: string): string | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const v = (json as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

/**
 * Construit un contexte métier pour relance (sans libellés internes côté client).
 */
export async function buildAiFollowUpContext(
  supabase: Supabase,
  input: { leadId: string; workflowId: string; reason: AiFollowUpReason },
): Promise<AiFollowUpContext | null> {
  const [{ data: lead }, { data: wf }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, company_name, contact_name, email, sim_saving_eur_30_selected, lead_status")
      .eq("id", input.leadId)
      .maybeSingle(),
    supabase
      .from("lead_sheet_workflows")
      .select("id, workflow_status, cee_sheet_id, qualification_data_json, agreement_sent_at, updated_at")
      .eq("id", input.workflowId)
      .maybeSingle(),
  ]);

  if (!lead || !wf) return null;

  const { data: sheetRow } = await supabase
    .from("cee_sheets")
    .select("label")
    .eq("id", wf.cee_sheet_id)
    .maybeSingle();
  const sheetLabel = sheetRow?.label?.trim() ?? null;

  const nextFu = qualString(wf.qualification_data_json, "next_follow_up_at");
  const situationParts: string[] = [];
  if (input.reason === "agreement_sent_stale") {
    situationParts.push("Un document d’accord a été transmis récemment ; le client n’a pas encore confirmé.");
  } else if (input.reason === "follow_up_overdue" && nextFu) {
    situationParts.push("Une date de recontact était prévue ; elle est dépassée.");
  } else if (input.reason === "docs_no_response") {
    situationParts.push("Des éléments commerciaux ont été partagés ; le client n’a pas réagi.");
  } else {
    situationParts.push("Relance commerciale à propos du projet d’économies d’énergie.");
  }

  const { data: emails } = await supabase
    .from("lead_emails")
    .select("direction, subject, email_date")
    .eq("lead_id", input.leadId)
    .order("email_date", { ascending: false })
    .limit(3);

  const lastTouch =
    emails && emails.length > 0
      ? `Derniers échanges : ${emails
          .map((e) => `${e.direction === "sent" ? "Envoyé" : "Reçu"} — ${e.subject ?? "(sans objet)"}`)
          .join(" · ")}`
      : null;

  const pot =
    lead.sim_saving_eur_30_selected != null
      ? `Potentiel d’économies évoqué en ordre de grandeur : ${Math.round(lead.sim_saving_eur_30_selected)} € / an (indicatif).`
      : null;

  return {
    leadId: lead.id,
    workflowId: wf.id,
    companyName: lead.company_name?.trim() || "—",
    contactName: lead.contact_name?.trim() ?? null,
    sheetLabel: sheetLabel?.trim() || null,
    workflowStatusPublic: "Suivi commercial en cours",
    situationSummary: situationParts.join(" "),
    lastClientTouchSummary: lastTouch,
    potentialHint: pot,
    reason: input.reason,
  };
}

export type GenerateAiFollowUpDraftResult =
  | { ok: true; subject: string; body: string }
  | { ok: false; error: string };

export async function generateAiFollowUpDraft(
  supabase: Supabase,
  input: { leadId: string; workflowId: string; reason: AiFollowUpReason },
): Promise<GenerateAiFollowUpDraftResult> {
  const ctx = await buildAiFollowUpContext(supabase, input);
  if (!ctx) {
    return { ok: false, error: "Contexte introuvable." };
  }

  const openai = getOpenAI();
  if (!openai) {
    return { ok: false, error: "OPENAI_API_KEY non configurée." };
  }

  const userContent = [
    `## Contexte (usage interne — ne pas recopier tel quel)`,
    `- Entreprise : ${ctx.companyName}`,
    `- Contact : ${ctx.contactName ?? "—"}`,
    `- Offre / thématique : ${ctx.sheetLabel ?? "performance énergétique"}`,
    `- Situation : ${ctx.situationSummary}`,
    ctx.lastClientTouchSummary ? `- ${ctx.lastClientTouchSummary}` : "",
    ctx.potentialHint ? `- ${ctx.potentialHint}` : "",
    "",
    "Rédige une relance unique adaptée à ce contexte.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: "system", content: AI_FOLLOW_UP_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_completion_tokens: 800,
      temperature: 0.55,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return { ok: false, error: "Réponse vide du modèle." };
    }
    const cleaned = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned) as { subject?: string; body?: string };
    return {
      ok: true,
      subject: parsed.subject?.trim() || "Relance Effinor",
      body: parsed.body?.trim() || "",
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur génération." };
  }
}

export type SendAiFollowUpResult =
  | { ok: true; mode: "draft_logged" | "would_auto_send_disabled"; subject: string; body: string }
  | { ok: false; error: string };

/**
 * Enregistre le brouillon (traçabilité). L’envoi réel email n’est pas forcé : désactivé par défaut.
 */
export async function sendAiFollowUp(
  supabase: Supabase,
  input: {
    leadId: string;
    workflowId: string;
    reason: AiFollowUpReason;
  },
): Promise<SendAiFollowUpResult> {
  const cfg = getAutomationConfig();
  const draft = await generateAiFollowUpDraft(supabase, input);
  if (!draft.ok) {
    await insertAutomationLogSupabase(supabase, {
      automationType: "ai_follow_up_draft",
      workflowId: input.workflowId,
      leadId: input.leadId,
      status: "failed",
      errorMessage: draft.error,
      resultJson: { reason: input.reason },
    });
    return { ok: false, error: draft.error };
  }

  if (cfg.aiFollowUpDraftOnly || !cfg.aiFollowUpAutoSend) {
    await insertAutomationLogSupabase(supabase, {
      automationType: "ai_follow_up_draft",
      workflowId: input.workflowId,
      leadId: input.leadId,
      status: "success",
      resultJson: {
        reason: input.reason,
        subject: draft.subject,
        body: draft.body,
        mode: "draft_only",
      },
    });
    return { ok: true, mode: "draft_logged", subject: draft.subject, body: draft.body };
  }

  await insertAutomationLogSupabase(supabase, {
    automationType: "ai_follow_up_sent",
    workflowId: input.workflowId,
    leadId: input.leadId,
    status: "skipped",
    resultJson: {
      note: "Auto-send non branché sur un transport email — activer manuellement ou étendre.",
      subject: draft.subject,
    },
  });
  return { ok: true, mode: "would_auto_send_disabled", subject: draft.subject, body: draft.body };
}

export type ScheduleFollowUpResult = {
  scheduled: boolean;
  runAfterIso: string | null;
  reason: string;
};

/**
 * Indique si une relance IA est pertinente (ex. accord envoyé depuis X jours sans signature).
 */
export function scheduleAiFollowUpIfNeeded(
  workflow: {
    workflow_status: string;
    agreement_sent_at: string | null;
    agreement_signed_at: string | null;
    qualification_data_json: Json;
  },
  now: Date = new Date(),
): ScheduleFollowUpResult {
  const cfg = getAutomationConfig();
  const staleMs = cfg.agreementStaleDaysForFollowUp * 86_400_000;

  if (
    workflow.workflow_status === "agreement_sent" &&
    workflow.agreement_sent_at &&
    !workflow.agreement_signed_at
  ) {
    const sent = new Date(workflow.agreement_sent_at).getTime();
    if (now.getTime() - sent > staleMs) {
      const runAfter = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      return {
        scheduled: true,
        runAfterIso: runAfter,
        reason: "Accord transmis sans retour depuis le seuil configuré.",
      };
    }
  }

  const raw = qualString(workflow.qualification_data_json, "next_follow_up_at");
  if (raw) {
    const t = new Date(raw).getTime();
    if (!Number.isNaN(t) && now.getTime() > t) {
      return {
        scheduled: true,
        runAfterIso: now.toISOString(),
        reason: "Date de recontact dépassée.",
      };
    }
  }

  return { scheduled: false, runAfterIso: null, reason: "Pas de condition de relance remplie." };
}
