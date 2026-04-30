"use server";

import { revalidatePath } from "next/cache";

import { insertLeadActivityEvent } from "@/features/leads/actions/insert-lead-activity-event";
import {
  findLatestArchivedB2BExtension,
  findLatestArchivedB2CExtension,
} from "@/features/leads/lib/lead-extensions-access";
import { canConvertLeadType } from "@/features/leads/lib/lead-conversion-permissions";
import { LeadConversionSchema } from "@/features/leads/schemas/lead-conversion.schema";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { createClient } from "@/lib/supabase/server";

export type ConvertLeadTypeResult =
  | { ok: true; leadId: string; newType: "b2c" | "b2b" }
  | { ok: false; error: string };

function stepError(step: number, err: { message?: string } | null): string {
  const detail = err?.message?.trim();
  if (detail) {
    return `Étape ${step} a échoué : ${detail}`;
  }
  return `Étape ${step} a échoué.`;
}

export async function convertLeadType(input: unknown): Promise<ConvertLeadTypeResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" };
  }

  if (!canConvertLeadType(access.roleCodes)) {
    return { ok: false, error: "Permission refusée" };
  }

  const parsed = LeadConversionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides." };
  }

  const { leadId, target, reason } = parsed.data;
  const supabase = await createClient();

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, lead_type, display_name, created_by_agent_id, confirmed_by_user_id")
    .eq("id", leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (leadErr) {
    console.error("[convertLeadType]", leadId, "fetch lead", leadErr);
    return { ok: false, error: "Lead non trouvé" };
  }
  if (!lead) {
    return { ok: false, error: "Lead non trouvé" };
  }

  if (!canAccessLeadRow(lead, access)) {
    return { ok: false, error: "Permission refusée" };
  }

  const currentType = lead.lead_type as string;
  if (currentType === target) {
    return { ok: false, error: "Lead déjà du type cible" };
  }

  // NEUTRALISATION DU lead_type
  // Le trigger trg_leads_b2b_enforce_lead_type refuse l'activation
  // d'une leads_b2b si leads.lead_type = 'b2c'. Pour passer
  // 'b2c' → 'b2b', on doit d'abord neutraliser à 'unknown'.
  // Le trigger leads_b2c autorise les 3 types donc 'b2b' → 'b2c'
  // n'a pas ce besoin, mais on applique la même logique par
  // symétrie et clarté.
  //
  // Le trigger trg_leads_enforce_extension_for_lead_type autorise
  // sans contrainte le passage à 'unknown' (cf. Phase 2.1).
  if (currentType !== "unknown") {
    const { error: neutralErr } = await supabase
      .from("leads")
      .update({ lead_type: "unknown" })
      .eq("id", leadId);

    if (neutralErr) {
      console.error("[convertLeadType]", leadId, "neutralize lead_type", neutralErr);
      return { ok: false, error: stepError(0, neutralErr) };
    }
  }

  if (target === "b2b") {
    const archived = await findLatestArchivedB2BExtension(supabase, leadId);
    if (archived) {
      const { error: uErr } = await supabase
        .from("leads_b2b")
        .update({ archived_at: null })
        .eq("id", archived.id);

      if (uErr) {
        console.error("[convertLeadType]", leadId, "reactivate b2b", uErr);
        return { ok: false, error: stepError(1, uErr) };
      }
    } else {
      const { error: iErr } = await supabase.from("leads_b2b").insert({
        lead_id: leadId,
        company_name: lead.display_name,
        head_office_address: "",
        head_office_postal_code: "",
        head_office_city: "",
      });

      if (iErr) {
        console.error("[convertLeadType]", leadId, "insert b2b", iErr);
        return { ok: false, error: stepError(1, iErr) };
      }
    }

    const { error: typeErr } = await supabase.from("leads").update({ lead_type: "b2b" }).eq("id", leadId);

    if (typeErr) {
      console.error("[convertLeadType]", leadId, "update lead_type b2b", typeErr);
      return { ok: false, error: stepError(2, typeErr) };
    }
  } else {
    const archived = await findLatestArchivedB2CExtension(supabase, leadId);
    if (archived) {
      const { error: uErr } = await supabase
        .from("leads_b2c")
        .update({ archived_at: null })
        .eq("id", archived.id);

      if (uErr) {
        console.error("[convertLeadType]", leadId, "reactivate b2c", uErr);
        return { ok: false, error: stepError(1, uErr) };
      }
    } else {
      const { error: iErr } = await supabase.from("leads_b2c").insert({
        lead_id: leadId,
      });

      if (iErr) {
        console.error("[convertLeadType]", leadId, "insert b2c", iErr);
        return { ok: false, error: stepError(1, iErr) };
      }
    }

    const { error: typeErr } = await supabase.from("leads").update({ lead_type: "b2c" }).eq("id", leadId);

    if (typeErr) {
      console.error("[convertLeadType]", leadId, "update lead_type b2c", typeErr);
      return { ok: false, error: stepError(2, typeErr) };
    }
  }

  const audit = await insertLeadActivityEvent({
    lead_id: leadId,
    event_type: "lead_type_converted",
    metadata: {
      from_type: currentType,
      to_type: target,
      reason: reason ?? null,
    },
  });

  if (!audit.ok) {
    console.error("[convertLeadType]", leadId, "insertLeadActivityEvent", audit.error);
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");

  return { ok: true, leadId, newType: target };
}
