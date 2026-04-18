import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationEnrichmentSource } from "../domain/statuses";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";
import { getLeadGenerationStockIdsForQuickEnrichment } from "../queries/get-lead-generation-stock-ids-for-quick-enrichment";
import { resolveEnrichmentDomain } from "./resolve-enrichment-domain";

export type EnrichLeadGenerationStockResult = {
  stockId: string;
  status: "completed" | "failed";
  enriched_domain?: string | null;
  enriched_email?: string | null;
  enriched_website?: string | null;
  /** Toujours `low` tant que l’enrichissement repose sur des heuristiques non vérifiées. */
  enrichment_confidence?: "low" | "medium" | "high";
  enrichment_source?: LeadGenerationEnrichmentSource;
  error?: string;
};

export type EnrichLeadGenerationStockBatchResult = {
  processed: number;
  successes: number;
  failures: number;
  details: EnrichLeadGenerationStockResult[];
};

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Règles métier étape 10 : téléphone + nom, et il manque l’email ou le site ;
 * pas rejeté / doublon ; pas de suggestions déjà enregistrées (completed).
 */
export function isEligibleForLeadGenerationEnrichment(row: LeadGenerationStockRow): { ok: true } | { ok: false; reason: string } {
  if (!hasText(row.phone)) {
    return { ok: false, reason: "Téléphone requis pour l’enrichissement." };
  }
  if (!hasText(row.company_name)) {
    return { ok: false, reason: "Nom d’entreprise requis." };
  }
  if (row.stock_status === "rejected" || row.qualification_status === "rejected") {
    return { ok: false, reason: "Fiche rejetée : enrichissement non applicable." };
  }
  if (row.duplicate_of_stock_id != null || row.qualification_status === "duplicate") {
    return { ok: false, reason: "Doublon : enrichissement non applicable." };
  }
  if (row.enrichment_status === "completed") {
    return { ok: false, reason: "Des suggestions sont déjà enregistrées pour cette fiche." };
  }
  if (row.enrichment_status === "in_progress") {
    return { ok: false, reason: "Enrichissement déjà en cours." };
  }

  const hasEmail = hasText(row.email);
  const hasWebsite = hasText(row.website);
  if (hasEmail && hasWebsite) {
    return { ok: false, reason: "Email et site déjà présents : rien à compléter." };
  }

  return { ok: true };
}

async function loadStockRow(stockId: string): Promise<LeadGenerationStockRow | null> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const { data, error } = await stock.select("*").eq("id", stockId).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data as LeadGenerationStockRow | null;
}

/**
 * Enrichit une fiche stock (compléments `enriched_*` uniquement).
 */
export async function enrichLeadGenerationStock(input: { stockId: string }): Promise<EnrichLeadGenerationStockResult> {
  const { stockId } = input;
  const row = await loadStockRow(stockId);
  if (!row) {
    return { stockId, status: "failed", error: "Fiche introuvable." };
  }

  const elig = isEligibleForLeadGenerationEnrichment(row);
  if (!elig.ok) {
    return { stockId, status: "failed", error: elig.reason };
  }

  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const { data: locked, error: lockErr } = await stock
    .update({
      enrichment_status: "in_progress",
      enrichment_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stockId)
    .in("enrichment_status", ["not_started", "failed"])
    .select("id")
    .maybeSingle();

  if (lockErr) {
    return { stockId, status: "failed", error: lockErr.message };
  }
  if (!locked) {
    return {
      stockId,
      status: "failed",
      error: "Impossible de démarrer l’enrichissement (déjà en cours, terminé ou modifié).",
    };
  }

  try {
    const domain = resolveEnrichmentDomain({
      website: row.website,
      email: row.email,
      normalized_domain: row.normalized_domain,
      company_name: row.company_name,
      city: row.city,
    });

    if (!domain) {
      const msg = "Impossible de déterminer un domaine (pas de site, pas d’email exploitable, heuristique vide).";
      await stock
        .update({
          enrichment_status: "failed",
          enrichment_error: msg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stockId);
      return { stockId, status: "failed", error: msg };
    }

    const websiteSuggest = `https://${domain}`;
    const needEmail = !hasText(row.email);
    const enriched_email = needEmail ? `contact@${domain}` : null;
    const needWebsite = !hasText(row.website);
    const enriched_website = needWebsite ? websiteSuggest : null;

    const now = new Date().toISOString();
    /** Heuristique locale uniquement : pas de validation externe → fiabilité explicitement faible. */
    const enrichment_confidence = "low" as const;
    const enrichment_source = "heuristic" as const;

    const { error: upErr } = await stock
      .update({
        enrichment_status: "completed",
        enriched_at: now,
        enrichment_error: null,
        enriched_domain: domain,
        enriched_email,
        enriched_website,
        enrichment_confidence,
        enrichment_source,
        updated_at: now,
      })
      .eq("id", stockId);

    if (upErr) {
      await stock
        .update({
          enrichment_status: "failed",
          enrichment_error: upErr.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stockId);
      return { stockId, status: "failed", error: upErr.message };
    }

    return {
      stockId,
      status: "completed",
      enriched_domain: domain,
      enriched_email,
      enriched_website,
      enrichment_confidence,
      enrichment_source,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inattendue.";
    await stock
      .update({
        enrichment_status: "failed",
        enrichment_error: msg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stockId);
    return { stockId, status: "failed", error: msg };
  }
}

/**
 * Enrichit plusieurs fiches séquentiellement (max 100 côté appelant / réglages UI).
 */
export async function enrichLeadGenerationStockBatch(stockIds: string[]): Promise<EnrichLeadGenerationStockBatchResult> {
  const details: EnrichLeadGenerationStockResult[] = [];
  let successes = 0;
  let failures = 0;
  for (const stockId of stockIds) {
    const r = await enrichLeadGenerationStock({ stockId });
    details.push(r);
    if (r.status === "completed") successes += 1;
    else failures += 1;
  }
  return { processed: stockIds.length, successes, failures, details };
}

/**
 * Enrichissement rapide : sélection automatique puis traitement séquentiel.
 */
export async function enrichLeadGenerationStockQuick(limit: number): Promise<EnrichLeadGenerationStockBatchResult> {
  const ids = await getLeadGenerationStockIdsForQuickEnrichment(limit);
  if (ids.length === 0) {
    return { processed: 0, successes: 0, failures: 0, details: [] };
  }
  return enrichLeadGenerationStockBatch(ids);
}
