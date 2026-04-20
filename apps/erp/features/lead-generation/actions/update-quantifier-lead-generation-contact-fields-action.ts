"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationQuantification } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { assertQuantifierMayActOnQuantificationStock } from "../lib/quantification-batch-ownership";
import { normalizeEmail } from "../lib/normalize-email";
import { normalizePhone, stripPhoneDisplayNoise } from "../lib/normalize-phone";
import { lgTable } from "../lib/lg-db";
import { getLeadGenerationStockById } from "../queries/get-lead-generation-stock-by-id";
import { updateQuantifierLeadGenerationContactFieldsInputSchema } from "../schemas/lead-generation-actions.schema";

export type UpdateQuantifierLeadGenerationContactFieldsResult = {
  updated: true;
};

/**
 * Mise à jour manuelle e-mail / téléphone / décideur / LinkedIn depuis la file quantification.
 */
export async function updateQuantifierLeadGenerationContactFieldsAction(
  input: unknown,
): Promise<LeadGenerationActionResult<UpdateQuantifierLeadGenerationContactFieldsResult>> {
  const parsed = updateQuantifierLeadGenerationContactFieldsInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationQuantification(access)) {
    return { ok: false, error: "Réservé aux quantificateurs." };
  }

  const detail = await getLeadGenerationStockById(parsed.data.stockId);
  if (!detail) {
    return { ok: false, error: "Fiche introuvable." };
  }

  const gate = await assertQuantifierMayActOnQuantificationStock(
    await createClient(),
    access,
    detail.stock,
    detail.import_batch,
  );
  if (!gate.ok) {
    return { ok: false, error: gate.message };
  }

  const {
    stockId,
    email: emailIn,
    phone: phoneIn,
    decisionMakerName: nameIn,
    decisionMakerRole: roleIn,
    linkedinUrl: liIn,
  } = parsed.data;

  const email = emailIn?.trim() ? emailIn.trim().toLowerCase() : null;
  const normalized_email = email ? normalizeEmail(email) : null;
  const phoneRaw = phoneIn?.trim() ? stripPhoneDisplayNoise(phoneIn) : null;
  const phone = phoneRaw?.trim() ? phoneRaw.trim() : null;
  const normalized_phone = phone ? normalizePhone(phone) : null;
  const decision_maker_name = nameIn?.trim() ? nameIn.trim() : null;
  const decision_maker_role = roleIn?.trim() ? roleIn.trim() : null;
  const linkedin_url = liIn?.trim() ? liIn.trim() : null;

  const hasDm = Boolean(decision_maker_name);
  const hasLi = Boolean(linkedin_url);

  const supabase = await createClient();
  const stockT = lgTable(supabase, "lead_generation_stock");
  const now = new Date().toISOString();

  const { error } = await stockT
    .update({
      email,
      normalized_email,
      phone,
      normalized_phone,
      phone_status: normalized_phone ? "found" : "missing",
      email_status: normalized_email ? "found" : "missing",
      decision_maker_name,
      decision_maker_role,
      /** Saisie terrain : pas une extraction automatisée listée en CHECK. */
      decision_maker_source: null,
      decision_maker_confidence:
        decision_maker_name || decision_maker_role ? ("high" as const) : null,
      linkedin_url,
      has_linkedin: hasLi,
      has_decision_maker: hasDm,
      updated_at: now,
    } as never)
    .eq("id", stockId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/lead-generation/quantification");
  revalidatePath(`/lead-generation/quantification/${stockId}`);
  revalidatePath(`/lead-generation/${stockId}`);
  revalidatePath("/lead-generation/stock");

  return { ok: true, data: { updated: true } };
}
