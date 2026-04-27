/**
 * Routing email par source de lead.
 *
 * Mappe une `LeadSource` (enum DB côté `apps/erp/types/database.types.ts`,
 * libellés FR dans `apps/erp/features/leads/constants.ts`) vers le bon
 * template HTML+texte des `templates/eXX-*.ts`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * Exemple d'utilisation depuis une Server Action
 * ────────────────────────────────────────────────────────────────────────────
 *
 *   "use server";
 *
 *   import { getMailTransport, getFromAddress } from "@/lib/email/gmail-transport";
 *   import { sendEmail } from "@/lib/email/email-orchestrator";
 *   import {
 *     getEmailTemplateForSource,
 *     buildFromAddress,
 *     getReplyToAddress,
 *   } from "@/lib/email/email-router";
 *
 *   export async function sendFirstContactEmail(input: {
 *     leadSource: string | null;
 *     leadEmail: string;
 *     leadPrenom: string;
 *     agentPrenom: string;
 *     lienAction: string;
 *   }) {
 *     const rendered = getEmailTemplateForSource(input.leadSource, {
 *       agentPrenom: input.agentPrenom,
 *       destinataireEmail: input.leadEmail,
 *       destinatairePrenom: input.leadPrenom,
 *       lienAction: input.lienAction,
 *     });
 *
 *     return sendEmail({
 *       type: rendered.emailType,
 *       recipient: input.leadEmail,
 *       metadata: { provider: "smtp", sourceModule: `email-router/${rendered.templateId}` },
 *       context: { leadSource: input.leadSource, templateId: rendered.templateId },
 *       execute: async () => {
 *         const transport = getMailTransport();
 *         const info = await transport.sendMail({
 *           from: buildFromAddress(input.agentPrenom),
 *           replyTo: getReplyToAddress(),
 *           to: input.leadEmail,
 *           subject: rendered.subject,
 *           html: rendered.html,
 *           text: rendered.text,
 *         });
 *         return info?.accepted?.length ? { ok: true } : { ok: false, error: "SMTP rejected" };
 *       },
 *     });
 *   }
 */

import type { EmailType } from "./email-types";
import type { BaseEmailData } from "./templates/_base-layout";
import { renderE01ColdCallEmail } from "./templates/e01-cold-call";
import { renderE02SiteWebEmail } from "./templates/e02-site-web";
import { renderE03LandingPacEmail } from "./templates/e03-landing-pac";
import { renderE04LandingRenoGlobaleEmail } from "./templates/e04-landing-reno-globale";

/* -------------------------------------------------------------------------- */
/*                                Types publics                               */
/* -------------------------------------------------------------------------- */

export type RoutedTemplateId = "E01" | "E02" | "E03" | "E04";

/**
 * Données passées au router. Les champs spécifiques sont optionnels :
 * le router applique des valeurs par défaut sûres si une donnée manque
 * (ex. `lienAction` → page contact).
 */
export type RoutedEmailData = BaseEmailData & {
  /** CTA principal (E01 / E03 / E04). Fallback : page contact EFFINOR. */
  lienAction?: string;
  /** E01 — résumé d'appel rédigé par l'agent. */
  resumeAppel?: string;
  /** E03 — type PAC remonté du formulaire landing. */
  typePac?: "air_eau" | "air_air";
  /** E04 — surface habitable estimée (m²). */
  surfaceEstimee?: number;
  /** E04 — étiquette DPE actuelle (ex. "D"). */
  classeActuelle?: string;
};

export type RoutedEmailResult = {
  subject: string;
  html: string;
  text: string;
  templateId: RoutedTemplateId;
  /** Type d'email à passer à `sendEmail({ type })` côté orchestrateur. */
  emailType: EmailType;
};

/**
 * Mapping `templateId` → valeur de l'enum `EmailType` à logger dans `email_events`.
 */
export const TEMPLATE_ID_TO_EMAIL_TYPE = {
  E01: "LEAD_FIRST_CONTACT_COLD_CALL",
  E02: "LEAD_FIRST_CONTACT_SITE_WEB",
  E03: "LEAD_FIRST_CONTACT_LANDING_PAC",
  E04: "LEAD_FIRST_CONTACT_LANDING_RENO",
} as const satisfies Record<RoutedTemplateId, EmailType>;

/* -------------------------------------------------------------------------- */
/*                                  Constantes                                */
/* -------------------------------------------------------------------------- */

const FALLBACK_LIEN_ACTION = "https://effinor.fr/contact";

/**
 * Map LeadSource → template. Les clés correspondent aux valeurs DB
 * de la colonne `lead.source` (voir `LEAD_SOURCE_LABELS`).
 *
 * Toute source absente de cette map retombe sur **E-02 (site web)** par défaut.
 */
const SOURCE_TO_TEMPLATE: Record<string, RoutedTemplateId> = {
  cold_call: "E01",
  phone: "E01",
  prospecting_kompas: "E01",
  commercial_callback: "E01",

  website: "E02",
  site_internet: "E02",
  site_web: "E02",
  simulator_cee: "E02",
  referral: "E02",
  partner: "E02",
  other: "E02",
  hpf: "E02",
  kompas: "E02",
  lead_generation: "E02",

  landing_pac: "E03",
  landing_froid: "E03",

  landing_reno_global: "E04",
  landing_reno_globale: "E04",
  landing_lum: "E04",
  landing_destrat: "E04",
};

/* -------------------------------------------------------------------------- */
/*                              Router principal                              */
/* -------------------------------------------------------------------------- */

function normalizeSource(source: string | null | undefined): string {
  return (source ?? "").toLowerCase().trim();
}

/**
 * Renvoie le template (`subject` / `html` / `text`) à utiliser pour un lead
 * donné, en fonction de sa source.
 */
export function getEmailTemplateForSource(
  source: string | null | undefined,
  data: RoutedEmailData,
): RoutedEmailResult {
  const key = normalizeSource(source);
  const templateId = SOURCE_TO_TEMPLATE[key] ?? "E02";

  switch (templateId) {
    case "E01": {
      const out = renderE01ColdCallEmail({
        agentPrenom: data.agentPrenom,
        destinataireEmail: data.destinataireEmail,
        destinatairePrenom: data.destinatairePrenom,
        resumeAppel: data.resumeAppel,
        lienAction: data.lienAction ?? FALLBACK_LIEN_ACTION,
      });
      return { ...out, templateId, emailType: TEMPLATE_ID_TO_EMAIL_TYPE.E01 };
    }
    case "E03": {
      const out = renderE03LandingPacEmail({
        agentPrenom: data.agentPrenom,
        destinataireEmail: data.destinataireEmail,
        destinatairePrenom: data.destinatairePrenom,
        typePac: data.typePac,
        lienAction: data.lienAction ?? FALLBACK_LIEN_ACTION,
      });
      return { ...out, templateId, emailType: TEMPLATE_ID_TO_EMAIL_TYPE.E03 };
    }
    case "E04": {
      const out = renderE04LandingRenoGlobaleEmail({
        agentPrenom: data.agentPrenom,
        destinataireEmail: data.destinataireEmail,
        destinatairePrenom: data.destinatairePrenom,
        surfaceEstimee: data.surfaceEstimee,
        classeActuelle: data.classeActuelle,
        lienAction: data.lienAction ?? FALLBACK_LIEN_ACTION,
      });
      return { ...out, templateId, emailType: TEMPLATE_ID_TO_EMAIL_TYPE.E04 };
    }
    case "E02":
    default: {
      const out = renderE02SiteWebEmail({
        agentPrenom: data.agentPrenom,
        destinataireEmail: data.destinataireEmail,
        destinatairePrenom: data.destinatairePrenom,
      });
      return { ...out, templateId: "E02", emailType: TEMPLATE_ID_TO_EMAIL_TYPE.E02 };
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                            Réexports d'enveloppe                           */
/* -------------------------------------------------------------------------- */

export {
  buildFromAddress,
  getReplyToAddress,
  type BaseEmailData,
} from "./templates/_base-layout";
