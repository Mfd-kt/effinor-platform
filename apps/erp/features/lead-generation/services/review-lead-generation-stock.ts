import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import {
  isManualReviewDecisionAllowedForType,
  type ReviewLeadGenerationStockInput,
  type ReviewLeadGenerationStockResult,
} from "../domain/manual-review";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";

function compactSnapshot(row: LeadGenerationStockRow): Record<string, unknown> {
  return {
    qualification_status: row.qualification_status,
    stock_status: row.stock_status,
    duplicate_of_stock_id: row.duplicate_of_stock_id,
    duplicate_match_score: row.duplicate_match_score,
    duplicate_match_reasons: row.duplicate_match_reasons,
    dispatch_queue_status: row.dispatch_queue_status,
    dispatch_queue_reason: row.dispatch_queue_reason,
    dispatch_queue_rank: row.dispatch_queue_rank,
    enrichment_status: row.enrichment_status,
    enrichment_confidence: row.enrichment_confidence,
    enriched_email: row.enriched_email,
    enriched_domain: row.enriched_domain,
    enriched_website: row.enriched_website,
    enrichment_source: row.enrichment_source,
    rejection_reason: row.rejection_reason,
    manual_override_status: row.manual_override_status,
    manual_override_reason: row.manual_override_reason,
    manually_reviewed_at: row.manually_reviewed_at,
    manually_reviewed_by_user_id: row.manually_reviewed_by_user_id,
    lead_tier: row.lead_tier,
    premium_score: row.premium_score,
    premium_reasons: row.premium_reasons,
    premium_scored_at: row.premium_scored_at,
  };
}

function decisionLabel(decision: string): string {
  const m: Record<string, string> = {
    confirm_duplicate: "doublon_confirmé",
    restore_from_duplicate: "restaurée_hors_doublon",
    force_ready_now: "file_prêt_maintenant",
    force_review: "file_à_revoir",
    force_do_not_dispatch: "file_ne_pas_diffuser",
    confirm_verified_enrichment: "enrichissement_confirmé",
    reject_enrichment_suggestions: "enrichissement_rejeté",
    clear_enrichment_suggestions: "enrichissement_vidé",
    reopen_stock: "fiche_rouverte",
    close_stock: "fiche_clôturée",
  };
  return m[decision] ?? decision;
}

const NOW_REASON = (notes: string | null | undefined, fallback: string) =>
  notes?.trim() || fallback;

/**
 * Validation humaine assistée : met à jour la fiche, enregistre l’audit et le marqueur manuel.
 */
export async function reviewLeadGenerationStock(
  input: ReviewLeadGenerationStockInput,
): Promise<{ ok: true; data: ReviewLeadGenerationStockResult } | { ok: false; error: string }> {
  const { stockId, reviewType, reviewDecision, reviewNotes, reviewedByUserId } = input;
  const notes = reviewNotes?.trim() || null;

  if (!isManualReviewDecisionAllowedForType(reviewType, reviewDecision)) {
    return { ok: false, error: "Combinaison type de revue / décision invalide." };
  }

  const supabase = await createClient();
  const stockT = lgTable(supabase, "lead_generation_stock");
  const reviewsT = lgTable(supabase, "lead_generation_manual_reviews");

  const { data: row, error: loadErr } = await stockT.select("*").eq("id", stockId).maybeSingle();
  if (loadErr) {
    return { ok: false, error: loadErr.message };
  }
  if (!row) {
    return { ok: false, error: "Fiche introuvable." };
  }

  const stock = row as LeadGenerationStockRow;

  if (stock.converted_lead_id && reviewDecision !== "close_stock") {
    return { ok: false, error: "Fiche déjà convertie en prospect : actions de revue limitées." };
  }

  const previous_snapshot = compactSnapshot(stock) as unknown as Json;
  const nowIso = new Date().toISOString();

  const marker = {
    manual_override_status: decisionLabel(reviewDecision),
    manual_override_reason: notes ?? decisionLabel(reviewDecision),
    manually_reviewed_at: nowIso,
    manually_reviewed_by_user_id: reviewedByUserId,
  };

  let patch: Record<string, unknown> = { ...marker, updated_at: nowIso };

  try {
    switch (reviewDecision) {
      case "confirm_duplicate": {
        if (stock.qualification_status !== "duplicate") {
          return { ok: false, error: "Réservé aux fiches déjà qualifiées « doublon »." };
        }
        break;
      }
      case "restore_from_duplicate": {
        if (stock.qualification_status !== "duplicate") {
          return { ok: false, error: "Seules les fiches « doublon » peuvent être restaurées." };
        }
        if (!stock.normalized_phone) {
          return { ok: false, error: "Téléphone manquant : impossible de remettre la fiche au stock exploitable." };
        }
        patch = {
          ...patch,
          qualification_status: "qualified",
          stock_status: "ready",
          duplicate_of_stock_id: null,
          duplicate_match_score: null,
          duplicate_match_reasons: null,
          rejection_reason: null,
        };
        break;
      }
      case "force_ready_now": {
        patch = {
          ...patch,
          dispatch_queue_status: "ready_now",
          dispatch_queue_reason: NOW_REASON(
            notes,
            "File ajustée manuellement — prêt à distribuer.",
          ),
          dispatch_queue_evaluated_at: nowIso,
        };
        break;
      }
      case "force_review": {
        patch = {
          ...patch,
          dispatch_queue_status: "review",
          dispatch_queue_reason: NOW_REASON(notes, "File ajustée manuellement — à revoir."),
          dispatch_queue_evaluated_at: nowIso,
        };
        break;
      }
      case "force_do_not_dispatch": {
        patch = {
          ...patch,
          dispatch_queue_status: "do_not_dispatch",
          dispatch_queue_reason: NOW_REASON(notes, "Ne pas diffuser — validation manuelle."),
          dispatch_queue_evaluated_at: nowIso,
        };
        break;
      }
      case "confirm_verified_enrichment": {
        const hasSuggestion =
          !!(stock.enriched_email?.trim() || stock.enriched_domain?.trim() || stock.enriched_website?.trim());
        if (!hasSuggestion) {
          return { ok: false, error: "Aucune suggestion enrichie à confirmer." };
        }
        patch = {
          ...patch,
          enrichment_status: "completed",
          enrichment_confidence: stock.enrichment_confidence === "low" ? "medium" : "high",
          enrichment_error: null,
        };
        break;
      }
      case "reject_enrichment_suggestions":
      case "clear_enrichment_suggestions": {
        patch = {
          ...patch,
          enriched_email: null,
          enriched_domain: null,
          enriched_website: null,
          enrichment_confidence: "low",
          enrichment_status: "not_started",
          enrichment_source: "heuristic",
          enriched_at: null,
          enrichment_error:
            reviewDecision === "reject_enrichment_suggestions"
              ? "Suggestions invalidées manuellement."
              : "Suggestions effacées manuellement.",
        };
        break;
      }
      case "reopen_stock": {
        if (stock.qualification_status === "duplicate") {
          return { ok: false, error: "Utilisez « Restaurer hors doublon » pour une fiche doublon." };
        }
        if (stock.stock_status === "converted") {
          return { ok: false, error: "Fiche convertie : réouverture impossible." };
        }
        const reopenable =
          stock.stock_status === "rejected" ||
          stock.stock_status === "archived" ||
          stock.stock_status === "expired" ||
          stock.qualification_status === "rejected";
        if (!reopenable) {
          return { ok: false, error: "État actuel non prévu pour une réouverture prudente." };
        }
        if (!stock.normalized_phone) {
          return { ok: false, error: "Téléphone manquant : ajoutez un numéro avant réouverture." };
        }
        patch = {
          ...patch,
          qualification_status: "qualified",
          stock_status: "ready",
          rejection_reason: null,
        };
        break;
      }
      case "close_stock": {
        patch = {
          ...patch,
          stock_status: "archived",
          rejection_reason: stock.rejection_reason ?? "manual_close",
        };
        break;
      }
    }

    const { error: upErr } = await stockT.update(patch).eq("id", stockId);
    if (upErr) {
      return { ok: false, error: upErr.message };
    }

    const { data: afterRow, error: afterErr } = await stockT.select("*").eq("id", stockId).maybeSingle();
    if (afterErr || !afterRow) {
      return { ok: false, error: afterErr?.message ?? "Lecture après mise à jour impossible." };
    }

    const new_snapshot = compactSnapshot(afterRow as LeadGenerationStockRow) as unknown as Json;

    const { data: ins, error: insErr } = await reviewsT
      .insert({
        stock_id: stockId,
        reviewed_by_user_id: reviewedByUserId,
        review_type: reviewType,
        review_decision: reviewDecision,
        review_notes: notes,
        previous_snapshot,
        new_snapshot,
      })
      .select("id")
      .single();

    if (insErr || !ins) {
      return { ok: false, error: insErr?.message ?? "Enregistrement de l’audit impossible." };
    }

    return {
      ok: true,
      data: { reviewId: (ins as { id: string }).id, stockId },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inattendue.";
    return { ok: false, error: message };
  }
}
