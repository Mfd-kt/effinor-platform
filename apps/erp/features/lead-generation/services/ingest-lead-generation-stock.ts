import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import type { LeadGenerationIngestLineResult, LeadGenerationIngestResult } from "../domain/batch-summary";
import type { LeadGenerationRawStockInput } from "../domain/raw-input";
import { lgTable } from "../lib/lg-db";
import { AUTO_OOT_DUPLICATE_REJECTION, isLeadGenerationStockDurableOutOfTarget } from "../lib/out-of-target";
import { prepareLeadGenerationStockRow } from "../lib/prepare-lead-generation-stock-row";
import { resolveCanonicalLeadGenerationStock } from "../lib/resolve-canonical-lead-generation-stock";
import { evaluateLeadGenerationDispatchQueueBatch } from "../queue/evaluate-dispatch-queue";
import { findAdvancedDuplicateLeadGenerationStock } from "./find-duplicate-lead-generation-stock";

function buildRawPayload(raw: LeadGenerationRawStockInput, lineIndex: number): Json {
  return {
    ...(raw.extra_payload ?? {}),
    _ingest: {
      line_index: lineIndex,
      captured_at: new Date().toISOString(),
    },
    _raw_snapshot: {
      source_external_id: raw.source_external_id ?? null,
      phone: raw.phone ?? null,
      email: raw.email ?? null,
      website: raw.website ?? null,
    },
  };
}

export type IngestLeadGenerationStockOptions = {
  /** Si false, le batch coordinateur reste « running » (étape Yellow à venir). */
  finalizeBatch?: boolean;
};

/**
 * Ingère une liste de fiches brutes : insertions tracées dans `lead_generation_stock`,
 * compteurs mis à jour sur `lead_generation_import_batches`.
 */
export async function ingestLeadGenerationStock(
  importBatchId: string,
  rawRows: LeadGenerationRawStockInput[],
  options?: IngestLeadGenerationStockOptions,
): Promise<LeadGenerationIngestResult> {
  const finalizeBatch = options?.finalizeBatch !== false;
  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const stock = lgTable(supabase, "lead_generation_stock");

  const { data: batchRow, error: batchErr } = await batches
    .select("id, status")
    .eq("id", importBatchId)
    .maybeSingle();

  if (batchErr) {
    return { ok: false, message: `Batch : ${batchErr.message}` };
  }
  if (!batchRow) {
    return { ok: false, message: "Batch d’import introuvable." };
  }

  const now = new Date().toISOString();
  /** Toute entrée importée reste en validation quantificateur — jamais « qualified » à la création. */
  const initialQual = "to_validate" as const;

  const { error: runErr } = await batches
    .update({
      status: "running",
      started_at: now,
    })
    .eq("id", importBatchId);

  if (runErr) {
    return { ok: false, message: `Impossible de démarrer le batch : ${runErr.message}` };
  }

  let accepted_count = 0;
  let duplicate_count = 0;
  let rejected_count = 0;
  const accLines: LeadGenerationIngestLineResult[] = [];

  try {
    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i]!;
      const prepared = prepareLeadGenerationStockRow(raw);

      if (!prepared.company_name.trim()) {
        throw new Error(`Ligne ${i} : company_name obligatoire.`);
      }
      if (!prepared.source.trim()) {
        throw new Error(`Ligne ${i} : source obligatoire.`);
      }

      const raw_payload = buildRawPayload(raw, i);
      const imported_at = now;

      const baseInsert = {
        import_batch_id: importBatchId,
        source: prepared.source,
        source_external_id: prepared.source_external_id,
        company_name: prepared.company_name,
        normalized_company_name: prepared.normalized_company_name,
        phone: prepared.phone,
        normalized_phone: prepared.normalized_phone,
        email: prepared.email,
        normalized_email: prepared.normalized_email,
        website: prepared.website,
        normalized_domain: prepared.normalized_domain,
        address: prepared.address,
        postal_code: prepared.postal_code,
        city: prepared.city,
        category: prepared.category,
        sub_category: prepared.sub_category,
        siret: prepared.siret,
        headcount_range: prepared.headcount_range,
        target_score: prepared.target_score,
        phone_status: prepared.phone_status,
        email_status: prepared.email_status,
        website_status: prepared.website_status,
        has_linkedin: prepared.has_linkedin,
        has_decision_maker: prepared.has_decision_maker,
        source_signal_score: prepared.source_signal_score,
        source_channels: prepared.source_channels,
        linkedin_url: prepared.linkedin_url,
        decision_maker_name: prepared.decision_maker_name,
        decision_maker_role: prepared.decision_maker_role,
        raw_payload,
        imported_at,
      };

      if (!prepared.normalized_phone) {
        const { data: inserted, error: insErr } = await stock
          .insert({
            ...baseInsert,
            qualification_status: "rejected",
            stock_status: "rejected",
            rejection_reason: "no_phone",
            duplicate_of_stock_id: null,
          })
          .select("id")
          .single();

        if (insErr) {
          throw new Error(insErr.message);
        }
        rejected_count += 1;
        accLines.push({
          index: i,
          stock_id: (inserted as { id: string }).id,
          outcome: "rejected_no_phone",
        });
        continue;
      }

      const dupHit = await findAdvancedDuplicateLeadGenerationStock(supabase, prepared);

      if (dupHit) {
        const canon = await resolveCanonicalLeadGenerationStock(supabase, dupHit.duplicateOf);
        const autoOot = isLeadGenerationStockDurableOutOfTarget(canon);
        const matchReasons = [...dupHit.matchReasons];
        if (autoOot) {
          matchReasons.push("auto_duplicate_of_out_of_target");
        }

        if (autoOot) {
          const { data: inserted, error: insErr } = await stock
            .insert({
              ...baseInsert,
              qualification_status: "rejected",
              stock_status: "rejected",
              duplicate_of_stock_id: canon.id,
              duplicate_match_score: dupHit.matchScore,
              duplicate_match_reasons: matchReasons,
              rejection_reason: AUTO_OOT_DUPLICATE_REJECTION,
              dispatch_queue_status: "do_not_dispatch",
            })
            .select("id")
            .single();

          if (insErr) {
            throw new Error(insErr.message);
          }
          rejected_count += 1;
          accLines.push({
            index: i,
            stock_id: (inserted as { id: string }).id,
            outcome: "rejected_duplicate_out_of_target",
            duplicate_of_stock_id: canon.id,
          });
          continue;
        }

        const { data: inserted, error: insErr } = await stock
          .insert({
            ...baseInsert,
            qualification_status: "duplicate",
            stock_status: "rejected",
            duplicate_of_stock_id: dupHit.duplicateOf.id,
            duplicate_match_score: dupHit.matchScore,
            duplicate_match_reasons: dupHit.matchReasons,
            rejection_reason: null,
          })
          .select("id")
          .single();

        if (insErr) {
          throw new Error(insErr.message);
        }
        duplicate_count += 1;
        accLines.push({
          index: i,
          stock_id: (inserted as { id: string }).id,
          outcome: "duplicate",
          duplicate_of_stock_id: dupHit.duplicateOf.id,
        });
        continue;
      }

      const { data: inserted, error: insErr } = await stock
        .insert({
          ...baseInsert,
          qualification_status: initialQual,
          stock_status: "new",
          duplicate_of_stock_id: null,
          rejection_reason: null,
        })
        .select("id")
        .single();

      if (insErr) {
        throw new Error(insErr.message);
      }
      accepted_count += 1;
      accLines.push({
        index: i,
        stock_id: (inserted as { id: string }).id,
        outcome: "accepted",
      });
    }

    const acceptedStockIds = accLines
      .filter((l): l is typeof l & { stock_id: string } => l.outcome === "accepted" && Boolean(l.stock_id))
      .map((l) => l.stock_id);
    const DISPATCH_EVAL_CHUNK = 100;
    for (let i = 0; i < acceptedStockIds.length; i += DISPATCH_EVAL_CHUNK) {
      const chunk = acceptedStockIds.slice(i, i + DISPATCH_EVAL_CHUNK);
      await evaluateLeadGenerationDispatchQueueBatch(chunk);
    }

    const finishedAt = new Date().toISOString();
    const imported_count = rawRows.length;

    if (finalizeBatch) {
      const { error: finErr } = await batches
        .update({
          status: "completed",
          finished_at: finishedAt,
          imported_count,
          accepted_count,
          duplicate_count,
          rejected_count,
        })
        .eq("id", importBatchId);

      if (finErr) {
        throw new Error(finErr.message);
      }

      return {
        ok: true,
        summary: {
          import_batch_id: importBatchId,
          status: "completed",
          imported_count,
          accepted_count,
          duplicate_count,
          rejected_count,
          started_at: now,
          finished_at: finishedAt,
        },
        lines: accLines,
      };
    }

    const { error: finErr } = await batches
      .update({
        status: "running",
        finished_at: null,
        ingest_started_at: null,
        imported_count,
        accepted_count,
        duplicate_count,
        rejected_count,
      })
      .eq("id", importBatchId);

    if (finErr) {
      throw new Error(finErr.message);
    }

    return {
      ok: true,
      summary: {
        import_batch_id: importBatchId,
        status: "running",
        imported_count,
        accepted_count,
        duplicate_count,
        rejected_count,
        started_at: now,
        finished_at: null,
      },
      lines: accLines,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue.";
    const failedAt = new Date().toISOString();

    await batches
      .update({
        status: "failed",
        finished_at: failedAt,
      })
      .eq("id", importBatchId);

    return {
      ok: false,
      message,
      summary: {
        import_batch_id: importBatchId,
        status: "failed",
        imported_count: rawRows.length,
        accepted_count,
        duplicate_count,
        rejected_count,
        started_at: now,
        finished_at: failedAt,
      },
    };
  }
}
