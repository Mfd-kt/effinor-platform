"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub, canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import {
  buildDropcontactEnrichmentPayload,
  isEligibleForDropcontactEnrichment,
} from "../dropcontact/build-dropcontact-request";
import { getDropcontactApiKey, sendDropcontactEnrichmentRequest } from "../dropcontact/client";
import { lgTable } from "../lib/lg-db";
import type { LeadGenerationStockRow } from "../domain/stock-row";

export type EnrichLeadWithDropcontactResult = { ok: true; message: string } | { ok: false; message: string };

export async function canUseDropcontactOnStock(
  accessUserId: string,
  stock: LeadGenerationStockRow,
  hub: boolean,
): Promise<boolean> {
  if (hub) return true;
  const aid = stock.current_assignment_id;
  if (!aid) return false;
  const supabase = await createClient();
  const assignments = lgTable(supabase, "lead_generation_assignments");
  const { data } = await assignments.select("agent_id").eq("id", aid).maybeSingle();
  const row = data as { agent_id: string } | null;
  return row?.agent_id === accessUserId;
}

/**
 * Lance un enrichissement Dropcontact pour une fiche (résultat asynchrone via webhook).
 */
export async function enrichLeadWithDropcontactAction(stockId: string): Promise<EnrichLeadWithDropcontactResult> {
  const id = stockId?.trim();
  if (!id) {
    return { ok: false, message: "Fiche invalide." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const hub = await canAccessLeadGenerationHub(access);
  const queue = canAccessLeadGenerationMyQueue(access);
  if (!hub && !queue) {
    return { ok: false, message: "Accès refusé." };
  }

  if (!getDropcontactApiKey()) {
    return {
      ok: false,
      message:
        "Dropcontact n’est pas configuré sur le serveur : ajoutez DROPCONTACT_API_KEY (ou DROPCONTACT_ACCESS_TOKEN) dans l’environnement, puis redémarrez l’app.",
    };
  }

  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");

  const { data: row, error: loadErr } = await stockTable.select("*").eq("id", id).maybeSingle();
  if (loadErr || !row) {
    return { ok: false, message: "Fiche introuvable." };
  }

  const stock = row as LeadGenerationStockRow;

  if (stock.converted_lead_id) {
    return { ok: false, message: "Cette fiche est déjà convertie." };
  }

  if (stock.stock_status === "rejected") {
    return { ok: false, message: "Action impossible pour le moment." };
  }

  if (!(await canUseDropcontactOnStock(access.userId, stock, hub))) {
    return { ok: false, message: "Cette fiche ne vous est pas attribuée." };
  }

  const elig = isEligibleForDropcontactEnrichment(stock);
  if (!elig.ok) {
    return { ok: false, message: elig.reason };
  }

  if (stock.dropcontact_status === "pending") {
    return { ok: false, message: "Enrichissement en cours…" };
  }

  const payloadBuild = buildDropcontactEnrichmentPayload(stock);
  if (!payloadBuild.ok) {
    return { ok: false, message: payloadBuild.reason };
  }

  const now = new Date().toISOString();

  const { data: locked, error: lockErr } = await stockTable
    .update({
      dropcontact_status: "pending",
      dropcontact_last_error: null,
      dropcontact_requested_at: now,
      dropcontact_request_id: null,
      dropcontact_completed_at: null,
      enrichment_status: "in_progress",
      enrichment_error: null,
      updated_at: now,
    })
    .eq("id", id)
    .neq("dropcontact_status", "pending")
    .select("id");

  if (lockErr) {
    return { ok: false, message: "Enrichissement interrompu. Réessayez plus tard." };
  }
  if (!locked?.length) {
    return { ok: false, message: "Enrichissement en cours…" };
  }

  const post = await sendDropcontactEnrichmentRequest(payloadBuild.body);

  if (!post.ok) {
    await stockTable
      .update({
        dropcontact_status: "failed",
        dropcontact_last_error: post.message,
        enrichment_status: "failed",
        enrichment_error: post.message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    revalidatePath("/lead-generation");
    revalidatePath("/lead-generation/stock");
    revalidatePath(`/lead-generation/${id}`);
    revalidatePath("/lead-generation/my-queue");
    revalidatePath(`/lead-generation/my-queue/${id}`);

    return { ok: false, message: post.message };
  }

  await stockTable
    .update({
      dropcontact_request_id: post.request_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation/stock");
  revalidatePath(`/lead-generation/${id}`);
  revalidatePath("/lead-generation/my-queue");
  revalidatePath(`/lead-generation/my-queue/${id}`);

  return { ok: true, message: "Enrichissement en cours…" };
}
