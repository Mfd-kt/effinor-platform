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
import { sendEmail } from "@/lib/email/email-orchestrator";
import {
  buildFromAddress,
  getEmailTemplateForSource,
  getReplyToAddress,
} from "@/lib/email/email-router";
import { getMailTransport } from "@/lib/email/gmail-transport";
import { createClient } from "@/lib/supabase/server";
import { notifyDuplicateLeadAttempt, notifyNewLead } from "@/features/notifications/services/notification-service";

export type CreateLeadResult =
  | { ok: true; data: LeadRow }
  | {
      ok: false;
      message: string;
      duplicateLeadId?: string;
      duplicateReason?: "company" | "email" | "phone" | "siret";
      /** Fiche existante (si chargement OK) pour affichage dans la modale doublon. */
      duplicateLead?: LeadRow | null;
    };

const DUPLICATE_REASON_LABEL: Record<"company" | "email" | "phone" | "siret", string> = {
  company: "la même raison sociale",
  email: "le même e-mail",
  phone: "le même numéro de téléphone",
  siret: "le même SIRET",
};

export async function createLead(
  input: unknown,
  options?: { skipPremierContactEmail?: boolean; createdByAgentId?: string | null },
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
    siret: parsed.data.siret,
    head_office_siret: parsed.data.head_office_siret,
    worksite_siret: parsed.data.worksite_siret,
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

  /** Payload inclut lead_type + display_name via insertFromLeadForm (Phase 2.3.C.3.b). */
  const row = insertFromLeadForm(parsed.data);
  const creatorId =
    options?.createdByAgentId !== undefined ? options.createdByAgentId : user?.id ?? null;
  if (creatorId) {
    row.created_by_agent_id = creatorId;
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

  // Auto-send du premier contact via le router B2C (template choisi en fonction
  // de `lead.source`). Fire-and-forget : l'échec d'envoi ne doit pas faire
  // échouer la création du lead.
  const leadEmail = data.email?.trim();
  if (!options?.skipPremierContactEmail && leadEmail && leadEmail.includes("@")) {
    void (async () => {
      try {
        // Best-effort : récupère le prénom de l'agent créateur depuis `profiles`
        // (la table contient `full_name`, pas de `first_name` séparé).
        let agentPrenom = "L'équipe";
        if (creatorId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", creatorId)
            .maybeSingle();
          const fullName = (profile?.full_name as string | null | undefined)?.trim();
          const first = fullName?.split(/\s+/)[0];
          if (first) agentPrenom = first;
        }

        const appBaseUrl = (
          process.env.APP_URL?.trim() ||
          process.env.NEXT_PUBLIC_APP_URL?.trim() ||
          ""
        ).replace(/\/+$/, "");
        const lienAction = appBaseUrl
          ? `${appBaseUrl}/leads/${data.id}`
          : "https://effinor.fr/contact";

        const rendered = getEmailTemplateForSource(data.source ?? "other", {
          agentPrenom,
          destinataireEmail: leadEmail,
          destinatairePrenom: (data.first_name as string | null | undefined)?.trim() || "vous",
          lienAction,
        });

        await sendEmail({
          type: rendered.emailType,
          recipient: leadEmail,
          metadata: {
            provider: "smtp",
            sourceModule: `leads/create-lead/${rendered.templateId}`,
          },
          context: {
            leadId: data.id,
            leadSource: data.source ?? null,
            templateId: rendered.templateId,
          },
          execute: async () => {
            const transport = getMailTransport();
            const info = await transport.sendMail({
              from: buildFromAddress(agentPrenom),
              replyTo: getReplyToAddress(),
              to: leadEmail,
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
            });
            return info?.accepted?.length
              ? { ok: true }
              : { ok: false, error: "SMTP rejected" };
          },
        });
      } catch (err) {
        console.error("[createLead] auto premier_contact email failed:", err);
      }
    })();
  }

  return { ok: true, data };
}
