"use server";

import { z } from "zod";

import { getAccessContext } from "@/lib/auth/access-context";
import { hasRole, isAdminAgent, isCloser } from "@/lib/auth/role-codes";
import { sendEmail } from "@/lib/email/email-orchestrator";
import { buildFromAddress, getReplyToAddress } from "@/lib/email/email-router";
import { EmailType } from "@/lib/email/email-types";
import { renderE06RdvAuditConfirmeEmail } from "@/lib/email/templates/e06-rdv-audit-confirme";
import { getMailTransport } from "@/lib/email/gmail-transport";

const schema = z.object({
  leadId: z.string().uuid(),
  destinataireEmail: z.string().email(),
  destinatairePrenom: z.string().min(1),
  dateRdv: z.string().min(1),
  heureRdv: z.string().min(1),
  adresseRdv: z.string().min(1),
  telephoneContact: z.string().min(1),
  lienCalendrier: z.string().url().optional(),
});

export type SendAuditRdvConfirmationInput = z.infer<typeof schema>;

export type SendAuditRdvConfirmationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Envoie l'email **E-06 (audit énergétique confirmé)** à un prospect.
 *
 * Réservé aux rôles `admin` / `super_admin` / `admin_agent` / `closer`.
 * L'identité de l'agent (prénom) est dérivée de `AccessContext.fullName`.
 */
export async function sendAuditRdvConfirmationEmail(
  input: SendAuditRdvConfirmationInput,
): Promise<SendAuditRdvConfirmationResult> {
  const ctx = await getAccessContext();
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" };
  }

  const allowed =
    hasRole(ctx.roleCodes, "admin", "super_admin") ||
    isAdminAgent(ctx.roleCodes) ||
    isCloser(ctx.roleCodes);
  if (!allowed) {
    return { ok: false, error: "Permissions insuffisantes" };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const {
    leadId,
    destinataireEmail,
    destinatairePrenom,
    dateRdv,
    heureRdv,
    adresseRdv,
    telephoneContact,
    lienCalendrier,
  } = parsed.data;

  const agentPrenom = ctx.fullName?.trim().split(/\s+/)[0] || "L'équipe";

  const rendered = renderE06RdvAuditConfirmeEmail({
    agentPrenom,
    destinataireEmail,
    destinatairePrenom,
    dateRdv,
    heureRdv,
    adresseRdv,
    telephoneContact,
    lienCalendrier,
  });

  const res = await sendEmail({
    type: EmailType.AUDIT_RDV_CONFIRMED,
    recipient: destinataireEmail,
    metadata: {
      provider: "smtp",
      sourceModule: "leads/send-audit-rdv-confirmation-email",
    },
    context: { leadId, templateId: "e06-rdv-audit-confirme" },
    execute: async () => {
      const transport = getMailTransport();
      const info = await transport.sendMail({
        from: buildFromAddress(agentPrenom),
        replyTo: getReplyToAddress(),
        to: destinataireEmail,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });
      return info?.accepted?.length
        ? { ok: true }
        : { ok: false, error: "SMTP rejected" };
    },
  });

  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
