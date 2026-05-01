"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { getRestrictedAgentLeadEditBlockReason } from "@/lib/auth/restricted-agent-lead-edit";
import { isSuperAdmin } from "@/lib/auth/role-codes";
import { LeadB2BPatchSchema } from "@/features/leads/schemas/lead-b2b.schema";
import { LeadB2CPatchSchema } from "@/features/leads/schemas/lead-b2c.schema";
import { LeadCommonUpdateSchema } from "@/features/leads/schemas/lead-common.schema";
import { LeadUpdatePayloadSchema } from "@/features/leads/schemas/lead.schema";
import type { LeadRow } from "@/features/leads/types";
import { createClient } from "@/lib/supabase/server";

import { updateLeadBundle } from "./update-lead-bundle";

export type UpdateLeadResult =
  | { ok: true; data: LeadRow }
  | { ok: false; message: string };

const COMMON_KEY_SET = new Set(Object.keys(LeadCommonUpdateSchema.shape));
const B2B_KEY_SET = new Set(Object.keys(LeadB2BPatchSchema.shape));
const B2C_KEY_SET = new Set(Object.keys(LeadB2CPatchSchema.shape));

/**
 * Répartit le payload plat du formulaire (LeadInsert-shaped) vers lead / b2b / b2c
 * selon `lead_type`, en s'appuyant sur les clés des schémas bundle.
 */
function dispatchPayloadToBundle(
  payload: Record<string, unknown>,
  leadType: string,
): { lead: Record<string, unknown>; b2b?: Record<string, unknown>; b2c?: Record<string, unknown> } {
  const id = payload.id;
  const lead: Record<string, unknown> = typeof id === "string" ? { id } : {};
  const b2b: Record<string, unknown> = {};
  const b2c: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (key === "id") continue;
    if (value === undefined) continue;
    if (key === "lead_type") continue;

    const inCommon = COMMON_KEY_SET.has(key);
    const inB2b = B2B_KEY_SET.has(key);
    const inB2c = B2C_KEY_SET.has(key);

    if (leadType === "unknown") {
      lead[key] = value;
    } else if (leadType === "b2b") {
      if (inCommon) lead[key] = value;
      else if (inB2b) b2b[key] = value;
    } else if (leadType === "b2c") {
      if (inCommon) lead[key] = value;
      else if (inB2c) b2c[key] = value;
    } else {
      lead[key] = value;
    }
  }

  const b2bOut = Object.keys(b2b).length > 0 ? b2b : undefined;
  const b2cOut = Object.keys(b2c).length > 0 ? b2c : undefined;
  return { lead, b2b: b2bOut, b2c: b2cOut };
}

function hasBundleMutations(bundle: {
  lead: Record<string, unknown>;
  b2b?: Record<string, unknown>;
  b2c?: Record<string, unknown>;
}): boolean {
  const leadKeys = Object.keys(bundle.lead).filter((k) => k !== "id");
  if (leadKeys.length > 0) return true;
  if (bundle.b2b && Object.keys(bundle.b2b).length > 0) return true;
  if (bundle.b2c && Object.keys(bundle.b2c).length > 0) return true;
  return false;
}

export async function updateLead(input: unknown): Promise<UpdateLeadResult> {
  const parsed = LeadUpdatePayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const { id, ...rest } = parsed.data;

  const supabase = await createClient();
  const { data: existingRow, error: fetchError } = await supabase
    .from("leads")
    .select("id, created_by_agent_id, confirmed_by_user_id, lead_status, lead_type")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError || !existingRow) {
    return { ok: false, message: fetchError?.message ?? "Lead introuvable." };
  }

  if (!canAccessLeadRow(existingRow, access)) {
    return { ok: false, message: "Accès refusé à ce lead." };
  }

  const agentBlock = await getRestrictedAgentLeadEditBlockReason(supabase, access, id);
  if (agentBlock) {
    return { ok: false, message: agentBlock };
  }

  let restForDispatch = rest as Record<string, unknown>;
  if (!isSuperAdmin(access.roleCodes)) {
    const { created_by_agent_id: _c, ...withoutCreator } = restForDispatch;
    void _c;
    restForDispatch = withoutCreator;
  }

  const leadType = String(existingRow.lead_type ?? "unknown");
  const payloadRecord = { id, ...restForDispatch };
  const bundle = dispatchPayloadToBundle(payloadRecord, leadType);

  if (!hasBundleMutations(bundle)) {
    const { data: existing, error: fullFetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (fullFetchError || !existing) {
      return { ok: false, message: fullFetchError?.message ?? "Lead introuvable." };
    }
    return { ok: true, data: existing };
  }

  const bundleResult = await updateLeadBundle(bundle);
  if (!bundleResult.ok) {
    return { ok: false, message: bundleResult.error };
  }

  const transitionedToLost =
    existingRow.lead_status !== "lost" &&
    typeof parsed.data.lead_status === "string" &&
    parsed.data.lead_status === "lost";
  if (transitionedToLost) {
    const now = new Date().toISOString();
    const { error: vtArchiveErr } = await supabase
      .from("technical_visits")
      .update({ deleted_at: now })
      .eq("lead_id", id)
      .is("deleted_at", null);
    if (vtArchiveErr) {
      return { ok: false, message: vtArchiveErr.message };
    }
  }

  const { data: fullLead, error: fullLeadErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (fullLeadErr || !fullLead) {
    return { ok: false, message: fullLeadErr?.message ?? "Lead introuvable." };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/technical-visits");

  return { ok: true, data: fullLead };
}
