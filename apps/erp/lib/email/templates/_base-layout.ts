/**
 * Shell HTML commun à tous les templates email EFFINOR (charte B2C).
 *
 * Règles :
 *  - CSS inline uniquement (Gmail / Outlook).
 *  - Structure tables pour compatibilité clients mail.
 *
 * Variables d'environnement : voir `apps/erp/.env.example` (bloc EFFINOR — Identité email).
 */

import { renderSignatureHtml, renderSignatureText } from "./_signature";

/** Données minimales partagées par tous les templates. */
export type BaseEmailData = {
  agentPrenom: string;
  destinataireEmail: string;
  destinatairePrenom: string;
};

export type RenderBaseLayoutInput = {
  badgeLabel: string;
  bodyHtml: string;
  agentPrenom: string;
  destinataireEmail: string;
};

export const BRAND = {
  primary: "#0F6E56",
  primaryAccent: "#1FC97A",
  highlightBg: "#E1F5EE",
  textStrong: "#1A1A1A",
  textBody: "#5F5E5A",
  textMuted: "#9CA3AF",
  border: "#E8E8E4",
  bodyBg: "#F4F4F0",
  signFooterBg: "#FAFAF7",
  white: "#FFFFFF",
} as const;

export const FONT_STACK = "Arial,Helvetica,sans-serif";

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Formate un SIRET 14 chiffres avec espaces : XXX XXX XXX XXXXX */
export function formatSiretFr(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 14) return escapeHtml(raw.trim() || "—");
  const formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  return escapeHtml(formatted);
}

function getEffinorFromEmail(): string {
  return process.env.EFFINOR_FROM_EMAIL?.trim() || "contact@effinor.fr";
}

function getEffinorFromName(): string {
  return process.env.EFFINOR_FROM_NAME?.trim() || "EFFINOR";
}

export function getEffinorSiteUrl(): string {
  return process.env.EFFINOR_SITE_URL?.trim() || "https://www.effinor.fr";
}

export function getEffinorPhoneDisplay(): string {
  return process.env.EFFINOR_PHONE?.trim() || "09 78 45 50 63";
}

export function getEffinorPhoneDisplayHours(): string {
  return process.env.EFFINOR_PHONE_DISPLAY_HOURS?.trim() || "Lun-Ven · 8h-18h";
}

function getEffinorAddress(): string {
  return (
    process.env.EFFINOR_ADDRESS?.trim() || "1 Avenue de l'Europe, 94320 Thiais"
  );
}

function getEffinorSiretRaw(): string {
  return process.env.EFFINOR_SIRET?.trim() || "90754766500022";
}

function getEffinorLegalName(): string {
  return process.env.EFFINOR_LEGAL_NAME?.trim() || "EFFINOR LIGHTING";
}

/** Lien tel: — E.164 pour numéros FR commençant par 0 */
function phoneDisplayToTelHref(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return `tel:+33${digits.slice(1)}`;
  }
  if (digits.length >= 10) return `tel:+${digits}`;
  return `tel:${encodeURIComponent(display)}`;
}

export function renderGreeting(prenom: string): string {
  const safe = escapeHtml(prenom?.trim() || "");
  return `<p style="margin:0 0 14px;color:${BRAND.textBody};font-family:${FONT_STACK};font-size:14px;line-height:1.7;">Bonjour ${safe},</p>`;
}

/** Titre principal (style H1 visuel dans le corps). */
export function renderH1(text: string): string {
  return `<h1 style="margin:0 0 14px;color:${BRAND.textStrong};font-family:${FONT_STACK};font-size:22px;line-height:1.25;font-weight:700;">${escapeHtml(text)}</h1>`;
}

export function renderH2(text: string): string {
  return `<h2 style="margin:0 0 14px;color:${BRAND.primary};font-family:${FONT_STACK};font-size:18px;line-height:1.35;font-weight:700;">${escapeHtml(text)}</h2>`;
}

export function renderParagraph(text: string): string {
  return `<p style="margin:0 0 14px;color:${BRAND.textBody};font-family:${FONT_STACK};font-size:14px;line-height:1.7;">${escapeHtml(text)}</p>`;
}

/** Texte secondaire (ex. sous-CTA, 13px). */
export function renderSecondaryParagraph(text: string): string {
  return `<p style="margin:16px 0 0;color:${BRAND.textBody};font-family:${FONT_STACK};font-size:13px;line-height:1.65;">${escapeHtml(text)}</p>`;
}

/**
 * Bloc mise en avant — `contentHtml` est inséré tel quel (échapper les données externes avant).
 */
export function renderHighlight(contentHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:${BRAND.highlightBg};border-left:4px solid ${BRAND.primaryAccent};border-radius:0 8px 8px 0;padding:14px 18px;"><div style="margin:0;font-size:14px;color:${BRAND.primary};line-height:1.6;font-weight:500;font-family:${FONT_STACK};">${contentHtml}</div></td></tr></table>`;
}

export function renderCtaButton(label: string, href: string, subtext?: string): string {
  const safeLabel = escapeHtml(label);
  const safeHref = escapeHtml(href);
  const subHtml = subtext
    ? `<p style="margin:12px 0 0;color:${BRAND.textBody};font-family:${FONT_STACK};font-size:12px;line-height:1.5;text-align:center;">${escapeHtml(subtext)}</p>`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${BRAND.primary};border-radius:8px;"><a href="${safeHref}" style="display:block;padding:14px 32px;color:${BRAND.white};text-decoration:none;font-size:14px;font-weight:600;font-family:${FONT_STACK};letter-spacing:0.02em;">${safeLabel}</a></td></tr></table>${subHtml}</td></tr></table>`;
}

export function renderUnorderedList(items: string[]): string {
  if (items.length === 0) return "";
  const lis = items
    .map(
      (item) =>
        `<li style="margin:0 0 6px;color:${BRAND.textBody};font-family:${FONT_STACK};font-size:14px;line-height:1.7;">${escapeHtml(item)}</li>`,
    )
    .join("");
  return `<ul style="margin:0 0 14px 20px;padding:0;">${lis}</ul>`;
}

export function renderOrderedList(items: string[]): string {
  if (items.length === 0) return "";
  const lis = items
    .map(
      (item) =>
        `<li style="margin:0 0 6px;color:${BRAND.textBody};font-family:${FONT_STACK};font-size:14px;line-height:1.7;">${escapeHtml(item)}</li>`,
    )
    .join("");
  return `<ol style="margin:0 0 14px 20px;padding:0;">${lis}</ol>`;
}

export function renderBaseLayout(input: RenderBaseLayoutInput): string {
  const safeEmail = escapeHtml(input.destinataireEmail);
  const badgeHtml = input.badgeLabel?.trim()
    ? `<span style="display:inline-block;background:${BRAND.highlightBg};color:${BRAND.primary};font-family:${FONT_STACK};font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;border:1px solid ${BRAND.border};">${escapeHtml(input.badgeLabel.trim())}</span>`
    : "";

  const phoneDisplay = getEffinorPhoneDisplay();
  const phoneHref = escapeHtml(phoneDisplayToTelHref(phoneDisplay));
  const mailto = escapeHtml(`mailto:${getEffinorFromEmail()}`);
  const siteBase =
    getEffinorSiteUrl().replace(/\/+$/, "") || "https://www.effinor.fr";
  const siteDisplay = siteBase.replace(/^https?:\/\//i, "");
  const hrefMentions = escapeHtml(`${siteBase}/mentions-legales`);
  const hrefPrivacy = escapeHtml(`${siteBase}/politique-de-confidentialite`);
  const hrefCgv = escapeHtml(`${siteBase}/cgv`);

  const legalLine = `<strong style="color:${BRAND.textBody};">${escapeHtml(getEffinorLegalName())}</strong> · ${escapeHtml(getEffinorAddress())} · SIRET ${formatSiretFr(getEffinorSiretRaw())} · Intervenant RGE`;

  const signatureBlock = renderSignatureHtml(input.agentPrenom);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>EFFINOR</title></head>
<body style="margin:0;padding:0;background:${BRAND.bodyBg};font-family:${FONT_STACK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bodyBg};padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${BRAND.white};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.border};">

<tr><td style="padding:28px 32px 20px;border-bottom:1px solid ${BRAND.border};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td align="left" valign="middle">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="background:${BRAND.primaryAccent};width:36px;height:36px;border-radius:7px;text-align:center;vertical-align:middle;line-height:36px;"><span style="color:${BRAND.white};font-size:20px;font-weight:700;font-family:${FONT_STACK};">E</span></td>
<td style="padding-left:10px;vertical-align:middle;"><span style="font-size:18px;font-weight:700;color:${BRAND.textStrong};letter-spacing:-0.01em;font-family:${FONT_STACK};">Effinor</span></td>
</tr></table>
</td>
<td align="right" valign="middle">${badgeHtml}</td>
</tr></table>
</td></tr>

<tr><td style="padding:32px;">
${input.bodyHtml}
</td></tr>

<tr><td style="padding:24px 32px 20px;border-top:1px solid ${BRAND.border};background:${BRAND.signFooterBg};">
${signatureBlock}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px;"><tr>
<td style="font-size:12px;color:${BRAND.textBody};padding-right:14px;font-family:${FONT_STACK};"><a href="${phoneHref}" style="color:${BRAND.primary};text-decoration:none;font-weight:600;">${escapeHtml(phoneDisplay)}</a></td>
<td style="font-size:12px;color:${BRAND.textBody};padding-right:14px;border-left:1px solid ${BRAND.border};padding-left:14px;font-family:${FONT_STACK};"><a href="${mailto}" style="color:${BRAND.primary};text-decoration:none;">${escapeHtml(getEffinorFromEmail())}</a></td>
<td style="font-size:12px;color:${BRAND.textBody};border-left:1px solid ${BRAND.border};padding-left:14px;font-family:${FONT_STACK};"><a href="${escapeHtml(siteBase)}" style="color:${BRAND.primary};text-decoration:none;">${escapeHtml(siteDisplay)}</a></td>
</tr></table>
</td></tr>

<tr><td style="padding:18px 32px 24px;background:${BRAND.bodyBg};border-top:1px solid ${BRAND.border};">
<p style="margin:0 0 6px;font-size:11px;color:${BRAND.textMuted};line-height:1.6;font-family:${FONT_STACK};">${legalLine}</p>
<p style="margin:0;font-size:11px;color:${BRAND.textMuted};line-height:1.6;font-family:${FONT_STACK};"><a href="${hrefMentions}" style="color:${BRAND.textMuted};text-decoration:underline;">Mentions légales</a> &nbsp;·&nbsp; <a href="${hrefPrivacy}" style="color:${BRAND.textMuted};text-decoration:underline;">Politique de confidentialité</a> &nbsp;·&nbsp; <a href="${hrefCgv}" style="color:${BRAND.textMuted};text-decoration:underline;">CGV</a></p>
<p style="margin:8px 0 0;font-size:10px;color:${BRAND.textMuted};line-height:1.6;font-family:${FONT_STACK};">Cet email a été envoyé à <strong style="color:${BRAND.textBody};">${safeEmail}</strong> car vous avez fait une demande sur notre site. Pour vous désabonner, répondez avec « STOP ».</p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;
}

/**
 * En-tête `From` : `{Prénom} — {EFFINOR_FROM_NAME} <EFFINOR_FROM_EMAIL>`.
 */
export function buildFromAddress(agentPrenom: string): string {
  const name = (agentPrenom?.trim() || "L'équipe").trim();
  const fromName = getEffinorFromName();
  const email = getEffinorFromEmail();
  return `"${name} — ${fromName}" <${email}>`;
}

export function getReplyToAddress(): string {
  return getEffinorFromEmail();
}

export { renderSignatureText };
