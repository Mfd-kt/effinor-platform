/**
 * Shell HTML commun à tous les templates email EFFINOR.
 *
 * Règles :
 *  - Tout le CSS est inline (compatible Gmail, Outlook).
 *  - Aucun webfont ni image externe (sauf URL absolue fiable).
 *  - Structure : Header (vert) → Body (blanc) → Footer (sable).
 *
 * Variables d'environnement utilisées :
 *  - `EFFINOR_SIRET` : numéro SIRET affiché en pied de page (fallback "—").
 *  - `EFFINOR_FROM_EMAIL` : adresse d'expédition par défaut (fallback contact@effinor.fr).
 *
 * Ce module n'importe pas l'orchestrateur ni le transport SMTP — il ne
 * produit que des chaînes HTML / texte.
 */

import { renderSignatureHtml, renderSignatureText } from "./_signature";

/** Données minimales partagées par tous les templates. */
export type BaseEmailData = {
  /** Prénom de l'agent (ou "L'équipe" si envoi automatique). */
  agentPrenom: string;
  /** Email du destinataire (utilisé en bas de page pour la mention RGPD). */
  destinataireEmail: string;
  /** Prénom du destinataire (utilisé pour la salutation). */
  destinatairePrenom: string;
};

export type RenderBaseLayoutInput = {
  /** Texte du badge en haut à droite (ex. "Rénovation globale"). */
  badgeLabel: string;
  /** HTML déjà rendu pour le corps (entre header et signature). */
  bodyHtml: string;
  /** Prénom de l'agent (passe directement à la signature). */
  agentPrenom: string;
  /** Email du destinataire (mention RGPD du footer). */
  destinataireEmail: string;
};

/* -------------------------------------------------------------------------- */
/*                            Charte graphique                                */
/* -------------------------------------------------------------------------- */

export const BRAND = {
  primary: "#0F6E56",
  primaryLight: "#1D9E75",
  highlightBg: "#E1F5EE",
  textBody: "#5F5E5A",
  textStrong: "#1B1B1B",
  border: "#E8E8E4",
  footerBg: "#F1EFE8",
  white: "#FFFFFF",
} as const;

export const FONT_STACK = "Arial,Helvetica,sans-serif";

/* -------------------------------------------------------------------------- */
/*                         Helpers d'échappement / env                        */
/* -------------------------------------------------------------------------- */

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getEffinorSiret(): string {
  return process.env.EFFINOR_SIRET?.trim() || "—";
}

function getDefaultFromEmail(): string {
  return process.env.EFFINOR_FROM_EMAIL?.trim() || "contact@effinor.fr";
}

/* -------------------------------------------------------------------------- */
/*                         Helpers de rendu (briques)                         */
/* -------------------------------------------------------------------------- */

export function renderGreeting(prenom: string): string {
  const safe = escapeHtml(prenom?.trim() || "");
  return `<p style="margin:0 0 14px;color:${BRAND.textBody};font-family:${FONT_STACK};font-size:14px;line-height:1.7;">Bonjour ${safe},</p>`;
}

export function renderH2(text: string): string {
  return `<h2 style="margin:0 0 16px;color:${BRAND.primary};font-family:${FONT_STACK};font-size:20px;line-height:1.3;font-weight:700;">${escapeHtml(text)}</h2>`;
}

export function renderParagraph(text: string): string {
  return `<p style="margin:0 0 14px;color:${BRAND.textBody};font-family:${FONT_STACK};font-size:14px;line-height:1.7;">${escapeHtml(text)}</p>`;
}

/**
 * Bloc "highlight" pour mettre en avant une info clé (prime, date RDV…).
 * `contentHtml` est inséré tel quel — pense à pré-échapper si données externes.
 */
export function renderHighlight(contentHtml: string): string {
  return `<div style="background:${BRAND.highlightBg};border-left:3px solid ${BRAND.primaryLight};padding:14px 16px;margin:18px 0;color:${BRAND.textStrong};font-family:${FONT_STACK};font-size:14px;line-height:1.6;border-radius:4px;">${contentHtml}</div>`;
}

export function renderCtaButton(label: string, href: string, subtext?: string): string {
  const safeLabel = escapeHtml(label);
  const safeHref = escapeHtml(href);
  const subHtml = subtext
    ? `<p style="margin:10px 0 0;color:${BRAND.textBody};font-family:${FONT_STACK};font-size:12px;line-height:1.5;">${escapeHtml(subtext)}</p>`
    : "";
  return [
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">`,
    `  <tr><td align="center">`,
    `    <a href="${safeHref}" style="display:inline-block;background:${BRAND.primary};color:${BRAND.white};text-decoration:none;font-family:${FONT_STACK};font-size:14px;font-weight:600;padding:13px 28px;border-radius:6px;">${safeLabel}</a>`,
    `    ${subHtml}`,
    `  </td></tr>`,
    `</table>`,
  ].join("\n");
}

export function renderUnorderedList(items: string[]): string {
  if (items.length === 0) return "";
  const lis = items
    .map(
      (item) =>
        `<li style="margin:0 0 6px;color:${BRAND.textBody};font-family:${FONT_STACK};font-size:14px;line-height:1.7;">${escapeHtml(item)}</li>`,
    )
    .join("");
  return `<ul style="margin:0 0 14px 18px;padding:0;">${lis}</ul>`;
}

/* -------------------------------------------------------------------------- */
/*                                Layout shell                                */
/* -------------------------------------------------------------------------- */

export function renderBaseLayout(input: RenderBaseLayoutInput): string {
  const siret = escapeHtml(getEffinorSiret());
  const safeBadge = escapeHtml(input.badgeLabel);
  const safeEmail = escapeHtml(input.destinataireEmail);
  const signatureHtml = renderSignatureHtml(input.agentPrenom);

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>EFFINOR</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.footerBg};font-family:${FONT_STACK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.footerBg};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${BRAND.white};border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:${BRAND.primary};padding:18px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left" style="color:${BRAND.white};font-family:${FONT_STACK};font-size:20px;font-weight:700;letter-spacing:1px;">EFFINOR</td>
                    <td align="right" style="color:${BRAND.white};font-family:${FONT_STACK};font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">
                      <span style="background:rgba(255,255,255,0.18);padding:5px 12px;border-radius:999px;display:inline-block;">${safeBadge}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;color:${BRAND.textBody};font-family:${FONT_STACK};font-size:14px;line-height:1.7;">
                ${input.bodyHtml}
                <hr style="border:none;border-top:1px solid ${BRAND.border};margin:24px 0;" />
                ${signatureHtml}
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.footerBg};padding:18px 32px;font-family:${FONT_STACK};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left" style="color:${BRAND.textBody};font-family:${FONT_STACK};font-size:11px;">EFFINOR SAS</td>
                    <td align="right" style="color:${BRAND.textBody};font-family:${FONT_STACK};font-size:11px;">
                      <a href="https://effinor.fr/se-desabonner" style="color:${BRAND.textBody};text-decoration:underline;">Se désabonner</a>
                      &middot;
                      <a href="https://effinor.fr/politique-de-confidentialite" style="color:${BRAND.textBody};text-decoration:underline;">Politique de confidentialité</a>
                      &middot;
                      <a href="https://effinor.fr/mentions-legales" style="color:${BRAND.textBody};text-decoration:underline;">Mentions légales</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:10px 0 0;color:${BRAND.textBody};font-family:${FONT_STACK};font-size:10px;line-height:1.5;">
                  Cet email a été envoyé à ${safeEmail}. EFFINOR SAS — SIRET ${siret} — Intervenant RGE.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/* -------------------------------------------------------------------------- */
/*                            Helpers d'enveloppe                             */
/* -------------------------------------------------------------------------- */

/**
 * Construit l'en-tête `From` au format `{Prénom} — EFFINOR <contact@effinor.fr>`.
 * À utiliser dans la Server Action qui appelle `transport.sendMail({ from, ... })`.
 */
export function buildFromAddress(agentPrenom: string): string {
  const name = (agentPrenom?.trim() || "L'équipe").trim();
  const email = getDefaultFromEmail();
  return `"${name} — EFFINOR" <${email}>`;
}

/** Adresse de réponse standard. */
export function getReplyToAddress(): string {
  return getDefaultFromEmail();
}

/** Réexports pour pratique : signature texte côté templates. */
export { renderSignatureText };
