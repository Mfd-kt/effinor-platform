"use server";

import { revalidatePath } from "next/cache";

import { findDuplicateLead } from "@/features/leads/lib/find-duplicate-lead";
import { insertFromLeadForm } from "@/features/leads/lib/map-to-db";
import {
  isMissingSplitSiretColumnError,
  stripSplitSiretColumns,
} from "@/features/leads/lib/lead-siret-compat";
import { LeadInsertSchema } from "@/features/leads/schemas/lead.schema";
import type { LeadRow } from "@/features/leads/types";
import { createClient } from "@/lib/supabase/server";
import { sendStudyEmail } from "@/features/leads/study-pdf/actions/send-study-email";
import { notifyDuplicateLeadAttempt, notifyNewLead } from "@/features/notifications/services/notification-service";

export type CreateLeadResult =
  | { ok: true; data: LeadRow }
  | {
      ok: false;
      message: string;
      duplicateLeadId?: string;
      duplicateReason?: "company" | "email" | "phone";
      /** Fiche existante (si chargement OK) pour affichage dans la modale doublon. */
      duplicateLead?: LeadRow | null;
    };

const DUPLICATE_REASON_LABEL: Record<"company" | "email" | "phone", string> = {
  company: "la même raison sociale",
  email: "le même e-mail",
  phone: "le même numéro de téléphone",
};

export async function createLead(
  input: unknown,
  options?: { skipPremierContactEmail?: boolean },
): Promise<CreateLeadResult> {
  const parsed = LeadInsertSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const detail = first ? `${first.path.join(".") || "champ"} : ${first.message}` : "";
    return {
      ok: false,
      message: detail ? `Données invalides (${detail}).` : "Données invalides.",
    };
  }

  const supabase = await createClient();

  const duplicate = await findDuplicateLead(supabase, {
    company_name: parsed.data.company_name,
    email: parsed.data.email,
    phone: parsed.data.phone,
  });

  if (duplicate) {
    const label = DUPLICATE_REASON_LABEL[duplicate.reason];
    const { data: existingLead } = await supabase
      .from("leads")
      .select("*")
      .eq("id", duplicate.id)
      .maybeSingle();

    void notifyDuplicateLeadAttempt({
      companyName: parsed.data.company_name.trim(),
      reasonLabel: label,
      existingLeadId: duplicate.id,
    });

    return {
      ok: false,
      message: `Un lead existe déjà avec ${label}.`,
      duplicateLeadId: duplicate.id,
      duplicateReason: duplicate.reason,
      duplicateLead: existingLead ?? null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const row = insertFromLeadForm(parsed.data);
  if (user?.id) {
    row.created_by_agent_id = user.id;
  }

  let { data, error } = await supabase.from("leads").insert(row).select().single();
  if (error && isMissingSplitSiretColumnError(error.message)) {
    ({ data, error } = await supabase
      .from("leads")
      .insert(stripSplitSiretColumns(row))
      .select()
      .single());
  }

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après création." };
  }

  revalidatePath("/leads");

  void notifyNewLead(data);

  // Auto-send first contact email if the lead has an email address
  const leadEmail = data.email?.trim();
  if (!options?.skipPremierContactEmail && leadEmail && leadEmail.includes("@")) {
    sendStudyEmail({
      to: leadEmail,
      leadId: data.id,
      clientName: data.contact_name ?? "",
      companyName: data.company_name ?? "",
      siteName: [data.worksite_address, data.worksite_postal_code, data.worksite_city]
        .filter(Boolean)
        .join(", ") || "",
      presentationUrl: null,
      accordUrl: null,
      variant: "A",
      emailType: "premier_contact",
    }).catch((err) => {
      console.error("[createLead] auto premier_contact email failed:", err);
    });
  }

  return { ok: true, data };
}
