import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import type { AccessContext } from "@/lib/auth/access-context";

import type { LeadGenerationStockRow } from "../domain/stock-row";
import { isLeadGenerationStockInQuantificationQueue } from "./is-lead-generation-quantification-candidate";
import type { QuantificationImportBatchScope } from "./quantification-viewer-scope";
import { resolveQuantificationImportBatchScope } from "./quantification-viewer-scope";
import { lgTable } from "./lg-db";

export function isImportBatchInQuantificationScope(
  createdByUserId: string | null | undefined,
  scope: QuantificationImportBatchScope,
): boolean {
  if (scope.mode === "all") {
    return true;
  }
  return (createdByUserId ?? "").trim() === scope.userId;
}

/** Fiche éligible file quantif + lot dans le périmètre (ou vue globale hub). */
export function isStockVisibleOnQuantificationPage(
  stock: LeadGenerationStockRow,
  importBatchCreatedByUserId: string | null | undefined,
  scope: QuantificationImportBatchScope,
): boolean {
  if (!isLeadGenerationStockInQuantificationQueue(stock)) {
    return false;
  }
  if (scope.mode === "own" && !stock.import_batch_id?.trim()) {
    return false;
  }
  return isImportBatchInQuantificationScope(importBatchCreatedByUserId, scope);
}

export async function listImportBatchIdsForQuantificationOwner(
  supabase: SupabaseClient<Database>,
  ownerUserId: string,
): Promise<string[]> {
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const { data, error } = await batches.select("id").eq("created_by_user_id", ownerUserId.trim());
  if (error) {
    throw new Error(`Lots quantificateur : ${error.message}`);
  }
  return (data ?? []).map((r: { id: string }) => r.id).filter(Boolean);
}

/**
 * Garde serveur : quantificateur sans hub ne peut agir que sur les fiches issues de ses propres lots.
 */
export async function assertQuantifierMayActOnQuantificationStock(
  supabase: SupabaseClient<Database>,
  access: AccessContext,
  stock: LeadGenerationStockRow,
  importBatch: { created_by_user_id?: string | null } | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }
  const scope = await resolveQuantificationImportBatchScope(access);
  if (!scope) {
    return { ok: false, message: "Accès refusé." };
  }
  if (!isLeadGenerationStockInQuantificationQueue(stock)) {
    return { ok: false, message: "Cette fiche n’est pas dans la file à qualifier." };
  }
  if (scope.mode === "all") {
    return { ok: true };
  }
  if (!stock.import_batch_id?.trim()) {
    return { ok: false, message: "Fiche sans lot d’origine : action réservée au pilotage." };
  }
  const ownerId = importBatch?.created_by_user_id?.trim() ?? null;
  if (!ownerId || ownerId !== access.userId) {
    return { ok: false, message: "Ce lead provient du lot d’un autre quantificateur." };
  }
  return { ok: true };
}
