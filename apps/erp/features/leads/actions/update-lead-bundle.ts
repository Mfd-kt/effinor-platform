/**
 * updateLeadBundle — Server Action transactionnelle pour l'autosave Phase 2.4.
 *
 * Met à jour atomiquement (du point de vue de l'application, pas réellement
 * transactionnel côté Postgres) :
 *   - Les champs partagés de la table leads.
 *   - Optionnellement les champs de l'extension leads_b2b active.
 *   - Optionnellement les champs de l'extension leads_b2c active.
 *
 * NE GÈRE PAS le changement de lead_type. Pour cela, utilisez convertLeadType.
 *
 * NE CRÉE PAS d'extension manquante. Si le bundle contient b2b ou b2c et
 * qu'aucune extension active n'existe pour ce lead, retourne une erreur
 * explicite invitant à utiliser convertLeadType au préalable.
 *
 * Phase 2.3.B.2 — non encore consommée par le code applicatif.
 * Sera branchée en Phase 2.4 lors de la refonte du LeadForm.
 */

"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import {
  buildB2BUpdatePayload,
  buildB2CUpdatePayload,
  buildLeadUpdatePayload,
} from "@/features/leads/lib/build-update-payload";
import { LeadUpsertBundleSchema } from "@/features/leads/schemas/lead-bundle.schema";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { createClient } from "@/lib/supabase/server";

export type UpdateLeadBundleResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

function compactZodIssues(err: ZodError): string {
  return err.issues
    .slice(0, 3)
    .map((i) => i.message)
    .join(" ; ");
}

function isNonEmptyObject(obj: object | undefined): obj is object {
  return obj !== undefined && Object.keys(obj).length > 0;
}

export async function updateLeadBundle(input: unknown): Promise<UpdateLeadBundleResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" };
  }

  const parsed = LeadUpsertBundleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: `Données invalides : ${compactZodIssues(parsed.error)}` };
  }

  const leadId = parsed.data.lead.id;
  const supabase = await createClient();

  const { data: existingLead, error: fetchErr } = await supabase
    .from("leads")
    .select("id, lead_type, display_name, created_by_agent_id, confirmed_by_user_id, deleted_at")
    .eq("id", leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr) {
    console.error("[updateLeadBundle]", leadId, "fetch lead", fetchErr);
    return { ok: false, error: "Lead non trouvé" };
  }
  if (!existingLead) {
    return { ok: false, error: "Lead non trouvé" };
  }

  if (!canAccessLeadRow(existingLead, access)) {
    return { ok: false, error: "Permission refusée" };
  }

  const existingType = existingLead.lead_type as string;
  const incomingType = parsed.data.lead.lead_type;
  if (incomingType !== undefined && incomingType !== existingType) {
    return { ok: false, error: "Le changement de type doit passer par convertLeadType" };
  }

  const leadSource = { ...parsed.data.lead } as Record<string, unknown>;
  delete leadSource.lead_type;

  const leadUpdatePayload = buildLeadUpdatePayload(leadSource);
  if (Object.keys(leadUpdatePayload).length > 0) {
    // Stub `Database` : pas d'inférence des colonnes — payload validé côté Zod.
    const { error: leadErr } = await supabase
      .from("leads")
      .update(leadUpdatePayload as never)
      .eq("id", leadId);

    if (leadErr) {
      console.error("[updateLeadBundle]", leadId, "update leads", leadErr);
      return {
        ok: false,
        error: `Mise à jour du lead échouée : ${leadErr.message ?? "erreur inconnue"}`,
      };
    }
  }

  if (isNonEmptyObject(parsed.data.b2b)) {
    const b2bPayloadRaw = buildB2BUpdatePayload(parsed.data.b2b as Record<string, unknown>);
    if (Object.keys(b2bPayloadRaw).length > 0) {
      const { data: activeB2B, error: b2bFetchErr } = await supabase
        .from("leads_b2b")
        .select("id")
        .eq("lead_id", leadId)
        .is("archived_at", null)
        .maybeSingle();

      if (b2bFetchErr) {
        console.error("[updateLeadBundle]", leadId, "fetch leads_b2b", b2bFetchErr);
        return {
          ok: false,
          error: `Mise à jour B2B échouée : ${b2bFetchErr.message ?? "erreur inconnue"}`,
        };
      }
      if (!activeB2B?.id) {
        return {
          ok: false,
          error: "Aucune extension B2B active. Utilisez convertLeadType d'abord.",
        };
      }

      // Idem : typage Supabase relâché tant que Database reste un stub.
      const { error: b2bErr } = await supabase
        .from("leads_b2b")
        .update(b2bPayloadRaw as never)
        .eq("id", activeB2B.id);

      if (b2bErr) {
        console.error("[updateLeadBundle]", leadId, "update leads_b2b", b2bErr);
        return {
          ok: false,
          error: `Mise à jour B2B échouée : ${b2bErr.message ?? "erreur inconnue"}`,
        };
      }
    }
  }

  if (isNonEmptyObject(parsed.data.b2c)) {
    const b2cPayloadRaw = buildB2CUpdatePayload(parsed.data.b2c as Record<string, unknown>);
    if (Object.keys(b2cPayloadRaw).length > 0) {
      const { data: activeB2C, error: b2cFetchErr } = await supabase
        .from("leads_b2c")
        .select("id")
        .eq("lead_id", leadId)
        .is("archived_at", null)
        .maybeSingle();

      if (b2cFetchErr) {
        console.error("[updateLeadBundle]", leadId, "fetch leads_b2c", b2cFetchErr);
        return {
          ok: false,
          error: `Mise à jour B2C échouée : ${b2cFetchErr.message ?? "erreur inconnue"}`,
        };
      }
      if (!activeB2C?.id) {
        return {
          ok: false,
          error: "Aucune extension B2C active. Utilisez convertLeadType d'abord.",
        };
      }

      // Idem : typage Supabase relâché tant que Database reste un stub.
      const { error: b2cErr } = await supabase
        .from("leads_b2c")
        .update(b2cPayloadRaw as never)
        .eq("id", activeB2C.id);

      if (b2cErr) {
        console.error("[updateLeadBundle]", leadId, "update leads_b2c", b2cErr);
        return {
          ok: false,
          error: `Mise à jour B2C échouée : ${b2cErr.message ?? "erreur inconnue"}`,
        };
      }
    }
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");

  return { ok: true, leadId };
}
