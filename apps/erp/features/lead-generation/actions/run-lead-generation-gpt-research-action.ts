"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub, canAccessLeadGenerationQuantification } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import type { LeadGenerationGptResearchPayload } from "../domain/lead-generation-gpt-research";
import { mergeLeadGenerationGptResearchWithPappers } from "../gpt-research/merge-with-pappers";
import {
  getLeadGenerationGptResearchModel,
  getLeadGenerationGptResearchOpenAI,
  runLeadGenerationGptResearchDecisionMakerRetryStructured,
  runLeadGenerationGptResearchPhase1Structured,
  runLeadGenerationGptResearchPhase2Structured,
} from "../gpt-research/client";
import { assessLeadGenerationGptResearchCompleteness } from "../lib/assess-lead-generation-gpt-research-completeness";
import { buildLeadGenerationGptResearchInput } from "../lib/build-lead-generation-gpt-research-input";
import { canInitiateLeadGenerationGptResearch } from "../lib/lead-generation-gpt-research-access";
import {
  mergeLeadGenerationGptResearchDecisionMakerRetryIntoPhase1,
  mergeLeadGenerationGptResearchPhase1AndPhase2,
} from "../lib/merge-gpt-research-phases";
import { lgTable } from "../lib/lg-db";
import { assertQuantifierMayActOnQuantificationStock } from "../lib/quantification-batch-ownership";
import { fetchPappersLeadGenerationEnrichment } from "../pappers/client";
import { getLeadGenerationStockById } from "../queries/get-lead-generation-stock-by-id";

export type RunLeadGenerationGptResearchResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function buildResearchSummary(payload: LeadGenerationGptResearchPayload): string {
  const act = payload.activity_summary.trim().slice(0, 220);
  const rec = payload.qualification_recommendation;
  const score = typeof payload.lead_score === "number" ? Math.round(payload.lead_score) : null;
  const action = payload.commercial_action_recommendation;
  const scorePart = score != null ? `Score ${score}/100` : "Score —";
  const actionPart = action ? ` · Action : ${action}` : "";
  const qc = payload.gpt_research_quality;
  const warnPart =
    qc?.completeness === "incomplete"
      ? " — Recherche incomplète (voir avertissements dans le dossier)."
      : "";
  if (!act) {
    return `${scorePart}${actionPart} — Reco qualif : ${rec}.${warnPart}`;
  }
  return `${scorePart}${actionPart} — ${act}${act.length >= 220 ? "…" : ""} — Reco qualif : ${rec}.${warnPart}`;
}

function revalidateQuantificationPaths(stockId: string): void {
  revalidatePath("/lead-generation/quantification");
  revalidatePath(`/lead-generation/quantification/${stockId}`);
}

export async function runLeadGenerationGptResearchAction(stockId: string): Promise<RunLeadGenerationGptResearchResult> {
  const id = stockId?.trim();
  if (!id) {
    return { ok: false, message: "Fiche invalide." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  if (!(await canInitiateLeadGenerationGptResearch(access))) {
    return { ok: false, message: "Action réservée au pilotage ou au quantificateur." };
  }

  const openai = getLeadGenerationGptResearchOpenAI();
  if (!openai) {
    return { ok: false, message: "OPENAI_API_KEY n’est pas configurée sur le serveur." };
  }

  const supabase = await createClient();
  const detail = await getLeadGenerationStockById(id);
  if (!detail) {
    return { ok: false, message: "Fiche introuvable." };
  }

  const { stock, import_batch } = detail;
  const hub = await canAccessLeadGenerationHub(access);
  const quantifier = canAccessLeadGenerationQuantification(access);
  if (quantifier && !hub) {
    const gate = await assertQuantifierMayActOnQuantificationStock(supabase, access, stock, import_batch);
    if (!gate.ok) {
      return { ok: false, message: gate.message };
    }
  }

  const input = buildLeadGenerationGptResearchInput(stock, import_batch);
  const table = lgTable(supabase, "lead_generation_stock");
  const now = new Date().toISOString();

  const { error: pendErr } = await table
    .update({
      research_gpt_status: "pending",
      research_gpt_requested_at: now,
      research_gpt_last_error: null,
    })
    .eq("id", id);

  if (pendErr) {
    return { ok: false, message: `Enregistrement : ${pendErr.message}` };
  }

  try {
    const pappers = await fetchPappersLeadGenerationEnrichment(input);

    const rawPhase1 = await runLeadGenerationGptResearchPhase1Structured(openai, input, pappers);
    let phase1 = mergeLeadGenerationGptResearchWithPappers(rawPhase1, pappers);

    let assessment = assessLeadGenerationGptResearchCompleteness(phase1, input, { hasRetriedDecisionMaker: false });
    if (assessment.shouldRetryDecisionMakerSearch) {
      const rawRetry = await runLeadGenerationGptResearchDecisionMakerRetryStructured(openai, input, pappers, phase1);
      phase1 = mergeLeadGenerationGptResearchDecisionMakerRetryIntoPhase1(phase1, rawRetry);
      phase1 = mergeLeadGenerationGptResearchWithPappers(phase1, pappers);
      assessment = assessLeadGenerationGptResearchCompleteness(phase1, input, { hasRetriedDecisionMaker: true });
    }

    const phase2 = await runLeadGenerationGptResearchPhase2Structured(openai, input, phase1);
    let merged = mergeLeadGenerationGptResearchPhase1AndPhase2(phase1, phase2);
    merged = mergeLeadGenerationGptResearchWithPappers(merged, pappers);

    merged = {
      ...merged,
      gpt_research_quality: {
        completeness: assessment.isComplete ? "complete" : "incomplete",
        warnings: assessment.warnings,
      },
    };

    const summary = buildResearchSummary(merged);
    const done = new Date().toISOString();
    const status = assessment.isComplete ? "completed" : "completed_with_warning";

    const { error: upErr } = await table
      .update({
        research_gpt_status: status,
        research_gpt_completed_at: done,
        research_gpt_payload: merged as unknown as Json,
        research_gpt_summary: summary,
        research_gpt_last_error: null,
      })
      .eq("id", id);

    if (upErr) {
      throw new Error(upErr.message);
    }

    revalidateQuantificationPaths(id);
    const model = getLeadGenerationGptResearchModel();
    const tail = status === "completed_with_warning" ? " Synthèse enregistrée — certains garde-fous ne sont pas au vert." : " Synthèse enregistrée.";
    return {
      ok: true,
      message: `Recherche terminée (modèle ${model}).${tail}`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue.";
    const done = new Date().toISOString();
    await table
      .update({
        research_gpt_status: "failed",
        research_gpt_completed_at: done,
        research_gpt_last_error: msg.slice(0, 2000),
      })
      .eq("id", id);
    revalidateQuantificationPaths(id);
    return { ok: false, message: msg };
  }
}
