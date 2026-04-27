/**
 * Types d'emails sortants (utilisés par `lib/email/email-orchestrator.ts`).
 *
 * Le type `EmailType` reste un type-union de littéraux (compat envois existants),
 * et un objet `EmailType` du même nom est exporté pour permettre l'accès façon
 * "enum" (ex. `EmailType.AUDIT_RDV_CONFIRMED`) depuis les nouveaux templates B2C.
 */

export type EmailType =
  | "INTERNAL_CREDENTIALS"
  | "LEAD_FIRST_CONTACT"
  | "STUDY_SENT"
  | "SIGNATURE_REMINDER"
  | "CALLBACK_INITIAL"
  | "CALLBACK_FOLLOWUP"
  | "QUALIFIED_PROSPECT"
  // ─── B2C — premier contact routé par source de lead (E-01 → E-04) ────────
  | "LEAD_FIRST_CONTACT_COLD_CALL"
  | "LEAD_FIRST_CONTACT_SITE_WEB"
  | "LEAD_FIRST_CONTACT_LANDING_PAC"
  | "LEAD_FIRST_CONTACT_LANDING_RENO"
  // ─── B2C — étapes ultérieures du funnel ──────────────────────────────────
  | "DOCS_TO_SIGN"
  | "AUDIT_RDV_CONFIRMED";

export const EmailType = {
  INTERNAL_CREDENTIALS: "INTERNAL_CREDENTIALS",
  LEAD_FIRST_CONTACT: "LEAD_FIRST_CONTACT",
  STUDY_SENT: "STUDY_SENT",
  SIGNATURE_REMINDER: "SIGNATURE_REMINDER",
  CALLBACK_INITIAL: "CALLBACK_INITIAL",
  CALLBACK_FOLLOWUP: "CALLBACK_FOLLOWUP",
  QUALIFIED_PROSPECT: "QUALIFIED_PROSPECT",
  LEAD_FIRST_CONTACT_COLD_CALL: "LEAD_FIRST_CONTACT_COLD_CALL",
  LEAD_FIRST_CONTACT_SITE_WEB: "LEAD_FIRST_CONTACT_SITE_WEB",
  LEAD_FIRST_CONTACT_LANDING_PAC: "LEAD_FIRST_CONTACT_LANDING_PAC",
  LEAD_FIRST_CONTACT_LANDING_RENO: "LEAD_FIRST_CONTACT_LANDING_RENO",
  DOCS_TO_SIGN: "DOCS_TO_SIGN",
  AUDIT_RDV_CONFIRMED: "AUDIT_RDV_CONFIRMED",
} as const satisfies Record<string, EmailType>;

export type EmailSendStatus = "sent" | "failed";
