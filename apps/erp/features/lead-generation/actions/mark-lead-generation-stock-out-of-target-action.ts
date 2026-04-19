"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub, canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

type RpcCloseRow = { result_code: string };

function mapTerminalCloseRpc(raw: RpcCloseRow[] | RpcCloseRow | null | undefined): string | null {
  const row = Array.isArray(raw) ? raw[0] : raw ?? undefined;
  const code = row?.result_code;
  if (code === "success") return null;
  switch (code) {
    case "not_found":
      return "Attribution introuvable.";
    case "forbidden":
      return "Cette action n’est pas autorisée pour votre compte.";
    case "already_converted":
      return "Cette fiche est déjà traitée côté CRM.";
    case "invalid_assignment_state":
      return "Cette fiche n’est plus dans votre file.";
    case "stock_not_found":
      return "Fiche introuvable.";
    case "stock_mismatch":
      return "Incohérence attribution / fiche (contactez le support).";
    default:
      return code ? "Action impossible pour le moment." : "Réponse serveur inattendue.";
  }
}

export type MarkLeadGenerationStockOutOfTargetResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Retire la fiche de la file agent (hors cible) : clôture d’attribution si besoin, stock rejeté.
 */
export async function markLeadGenerationStockOutOfTargetAction(
  stockId: string,
): Promise<MarkLeadGenerationStockOutOfTargetResult> {
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

  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");
  const assignments = lgTable(supabase, "lead_generation_assignments");

  const { data: stockRow, error: stockErr } = await stockTable
    .select("id, converted_lead_id, current_assignment_id, stock_status")
    .eq("id", id)
    .maybeSingle();

  if (stockErr || !stockRow) {
    return { ok: false, message: "Fiche introuvable." };
  }

  const stock = stockRow as {
    id: string;
    converted_lead_id: string | null;
    current_assignment_id: string | null;
    stock_status: string;
  };

  if (stock.converted_lead_id) {
    return { ok: false, message: "Cette fiche est déjà convertie." };
  }

  if (stock.stock_status === "rejected") {
    return { ok: true, message: "La fiche a été marquée hors cible." };
  }

  const aid = stock.current_assignment_id;

  if (aid) {
    const { data: asg } = await assignments
      .select("id, agent_id, outcome")
      .eq("id", aid)
      .maybeSingle();

    const a = asg as { id: string; agent_id: string; outcome: string } | null;
    if (a && a.outcome === "pending" && a.agent_id === access.userId) {
      const { data, error } = await supabase.rpc("close_lead_generation_assignment_from_terminal_call", {
        p_assignment_id: aid,
        p_agent_id: access.userId,
        p_outcome: "out_of_target",
        p_last_call_status: "Hors cible",
        p_last_call_at: new Date().toISOString(),
        p_last_call_note: "Validation rapide — hors cible",
        p_last_call_recording_url: null,
      });
      if (error) {
        return { ok: false, message: "Action impossible pour le moment." };
      }
      const msg = mapTerminalCloseRpc(data as RpcCloseRow[] | RpcCloseRow | null);
      if (msg) {
        return { ok: false, message: msg };
      }
    } else if (a && a.outcome === "pending" && hub) {
      const { error: upAsg } = await assignments
        .update({
          outcome: "out_of_target",
          outcome_reason: "Hors cible (pilotage)",
          assignment_status: "consumed",
          consumed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          recycle_status: "closed",
          last_call_note: "Validation rapide — hors cible (pilotage)",
          updated_at: new Date().toISOString(),
        })
        .eq("id", aid)
        .eq("outcome", "pending");

      if (upAsg) {
        return { ok: false, message: "Action impossible pour le moment." };
      }

      const { error: upStock } = await stockTable
        .update({
          stock_status: "rejected",
          current_assignment_id: null,
          rejection_reason: "hub_validation:out_of_target",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("current_assignment_id", aid)
        .is("converted_lead_id", null);

      if (upStock) {
        return { ok: false, message: "Action impossible pour le moment." };
      }
    } else {
      return { ok: false, message: "Cette fiche n’est plus modifiable depuis cet écran." };
    }
  } else if (hub) {
    const { error: upStock } = await stockTable
      .update({
        stock_status: "rejected",
        qualification_status: "rejected",
        rejection_reason: "hub_validation:out_of_target_unassigned",
        dispatch_queue_status: "do_not_dispatch",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("converted_lead_id", null);

    if (upStock) {
      return { ok: false, message: "Action impossible pour le moment." };
    }
  } else {
    return { ok: false, message: "Attribuez-vous la fiche ou contactez un responsable." };
  }

  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation/stock");
  revalidatePath(`/lead-generation/${id}`);
  revalidatePath("/lead-generation/my-queue");
  revalidatePath(`/lead-generation/my-queue/${id}`);

  return { ok: true, message: "La fiche a été marquée hors cible." };
}
