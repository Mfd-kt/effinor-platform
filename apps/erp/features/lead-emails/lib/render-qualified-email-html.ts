import { escapeHtmlText } from "./escape-html";
import { buildQualifiedProspectEmailHtmlDocument } from "../templates/qualified-lead-email-template";
import type { QualifiedLeadEmailBranding } from "../templates/qualified-lead-email-template";

/**
 * Convertit le corps texte (sauts de ligne) en paragraphes HTML sobres.
 */
export function renderQualifiedEmailHtmlFromBodyText(
  emailBody: string,
  branding?: QualifiedLeadEmailBranding,
): string {
  const paragraphs = emailBody
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const inner = paragraphs
    .map(
      (block) =>
        `<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#222222;">${block
          .split(/\r?\n/)
          .map((line) => escapeHtmlText(line))
          .join("<br/>")}</p>`,
    )
    .join("");

  return buildQualifiedProspectEmailHtmlDocument({
    bodyHtmlParagraphs: inner,
    branding,
  });
}
