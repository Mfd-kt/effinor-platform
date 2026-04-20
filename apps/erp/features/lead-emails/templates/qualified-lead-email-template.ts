import { escapeHtmlText } from "../lib/escape-html";
import { getEffinorLogoUrl, getTotalEnergiesLogoUrl } from "../lib/qualified-prospect-email-config";

export type QualifiedLeadEmailBranding = {
  totalEnergiesLogoUrl: string;
  effinorLogoUrl: string;
};

export const QUALIFIED_EMAIL_SIGNATURE_LINES = [
  "Votre conseiller en rénovation énergétique",
  "TotalEnergie-effinor",
] as const;

function logoBlock(url: string, alt: string, maxWidth: number): string {
  if (!url) {
    return `<span style="font-size:11px;color:#555555;">${escapeHtmlText(alt)}</span>`;
  }
  return `<img src="${escapeHtmlText(url)}" alt="${escapeHtmlText(alt)}" width="${maxWidth}" style="display:block;border:0;outline:none;text-decoration:none;max-width:100%;height:auto;" />`;
}

/**
 * HTML e-mail (tables + styles inline) — corps déjà échappé en amont ou passé ici échappé.
 */
export function buildQualifiedProspectEmailHtmlDocument(opts: {
  bodyHtmlParagraphs: string;
  branding?: QualifiedLeadEmailBranding;
}): string {
  const te = opts.branding?.totalEnergiesLogoUrl ?? getTotalEnergiesLogoUrl();
  const ef = opts.branding?.effinorLogoUrl ?? getEffinorLogoUrl();

  const sig = QUALIFIED_EMAIL_SIGNATURE_LINES.map(
    (line) =>
      `<p style="margin:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.45;color:#222222;">${escapeHtmlText(line)}</p>`,
  ).join("");

  const headerLogo = logoBlock(te, "TotalEnergies", 200);
  const footerLogo = logoBlock(te, "TotalEnergies", 120);
  const effinorOptional = ef
    ? `<tr><td align="center" style="padding:8px 16px 0;">${logoBlock(ef, "Effinor", 100)}</td></tr>`
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title></title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f4;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e5e5e5;">
        <tr>
          <td align="center" style="padding:20px 16px 12px;">${headerLogo}</td>
        </tr>
        <tr>
          <td style="padding:8px 24px 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#222222;">
            ${opts.bodyHtmlParagraphs}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px 8px;border-top:1px solid #eeeeee;">
            ${sig}
          </td>
        </tr>
        ${effinorOptional}
        <tr>
          <td align="center" style="padding:12px 16px 20px;">${footerLogo}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
