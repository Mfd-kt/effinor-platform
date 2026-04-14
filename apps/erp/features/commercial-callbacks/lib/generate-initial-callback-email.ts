import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Date « jour seul » YYYY-MM-DD → libellé français calendaire (sans décalage fuseau). */
export function formatCallbackDateFr(callbackDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(callbackDate.trim());
  if (!m) return callbackDate.trim();
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return callbackDate.trim();
  const utc = new Date(Date.UTC(y, mo - 1, d));
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(utc);
}

export type InitialCallbackEmailContent = {
  subject: string;
  html: string;
  text: string;
};

export type GenerateInitialCallbackEmailInput = {
  callback: Pick<
    CommercialCallbackRow,
    "contact_name" | "callback_date"
  >;
  agentDisplayName: string;
  /** URL publique du simulateur (ex. avec `?source=callback_email`) — utilisée pour le bouton CTA et le texte brut. */
  simulatorLandingUrl: string;
  openPixelSrc: string | null;
};

function pickSubject(dateLabel: string, stableKey: string): string {
  let n = 0;
  for (let i = 0; i < stableKey.length; i++) n += stableKey.charCodeAt(i);
  if (n % 2 === 0) {
    return "Suite à notre échange – rappel programmé";
  }
  return `Comme convenu, je reviens vers vous le ${dateLabel}`;
}

/**
 * Corps d’e-mail « premier contact » : mise en page type newsletter (table600px), CEE / TotalEnergies, CTA bouton.
 */
export function generateInitialCallbackEmail(
  input: GenerateInitialCallbackEmailInput,
): InitialCallbackEmailContent {
  const { callback, agentDisplayName, simulatorLandingUrl, openPixelSrc } =
    input;

  const contact = callback.contact_name.trim() || "Madame, Monsieur";
  const dateLabel = formatCallbackDateFr(callback.callback_date);
  const subject = pickSubject(dateLabel, callback.callback_date + contact);

  const agent = agentDisplayName.trim() || "L’équipe Effinor";

  const text = [
    `Bonjour ${contact},`,
    "",
    `Suite à notre échange, je me permets de vous confirmer que je reviendrai vers vous le ${dateLabel}.`,
    "",
    "Nous accompagnons les entreprises dans l’optimisation de leur consommation énergétique, notamment sur les problématiques de chauffage et de perte de chaleur.",
    "",
    "Nos projets sont réalisés dans le cadre du dispositif CEE, en partenariat avec TotalEnergies.",
    "",
    "En attendant notre échange, vous pouvez déjà obtenir une estimation rapide via notre simulateur :",
    simulatorLandingUrl,
    "",
    "Estimation en quelques secondes, adaptée à votre bâtiment.",
    "",
    "Je reste bien entendu disponible si besoin d’ici là.",
    "",
    "Cordialement,",
    `${agent}`,
    "Conseiller en efficacité énergétique",
    "",
    "Effinor",
    "contact@groupe-effinor.fr",
    "www.groupe-effinor.fr",
  ].join("\n");

  const pixel =
    openPixelSrc != null && openPixelSrc.length > 0
      ? `<img src="${esc(openPixelSrc)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;margin:0;padding:0;" />`
      : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;">
<div style="font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;padding:20px;">
  <table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;padding:30px;border-radius:10px;">
    <tr>
      <td style="font-size:20px;font-weight:bold;color:#116BAD;">
        Confirmation de notre échange
      </td>
    </tr>
    <tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>
    <tr>
      <td style="font-size:14px;color:#333;line-height:1.55;">
        Bonjour ${esc(contact)},<br /><br />
        Suite à notre échange, je me permets de vous confirmer que je reviendrai vers vous le
        <strong>${esc(dateLabel)}</strong>.
      </td>
    </tr>
    <tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>
    <tr>
      <td style="font-size:14px;color:#333;line-height:1.55;">
        Nous accompagnons les entreprises dans l’optimisation de leur consommation énergétique,
        notamment sur les problématiques de chauffage et de perte de chaleur.
      </td>
    </tr>
    <tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>
    <tr>
      <td style="font-size:14px;color:#333;line-height:1.55;">
        Nos projets sont réalisés dans le cadre du dispositif <strong>CEE</strong>, en partenariat avec
        <strong>TotalEnergies</strong>.
      </td>
    </tr>
    <tr><td style="height:25px;line-height:25px;font-size:0;">&nbsp;</td></tr>
    <tr>
      <td style="font-size:14px;color:#333;line-height:1.55;">
        En attendant notre échange, vous pouvez déjà obtenir une estimation rapide&nbsp;:
      </td>
    </tr>
    <tr><td style="height:15px;line-height:15px;font-size:0;">&nbsp;</td></tr>
    <tr>
      <td align="center" style="padding:4px 0;">
        <a href="${esc(simulatorLandingUrl)}"
           style="background:#116BAD;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;font-size:14px;">
          Accéder au simulateur
        </a>
      </td>
    </tr>
    <tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>
    <tr>
      <td style="font-size:13px;color:#666;text-align:center;line-height:1.5;">
        Estimation en quelques secondes, adaptée à votre bâtiment
      </td>
    </tr>
    <tr><td style="height:16px;line-height:16px;font-size:0;">&nbsp;</td></tr>
    <tr>
      <td style="font-size:14px;color:#333;line-height:1.55;">
        Je reste bien entendu disponible si besoin d’ici là.
      </td>
    </tr>
    <tr><td style="height:25px;line-height:25px;font-size:0;">&nbsp;</td></tr>
    <tr>
      <td style="border-top:1px solid #e0e0e0;padding-top:20px;">
        <div style="font-size:14px;color:#333;">Cordialement,</div>
        <div style="height:10px;line-height:10px;font-size:0;">&nbsp;</div>
        <div style="font-size:16px;font-weight:bold;color:#116BAD;">${esc(agent)}</div>
        <div style="font-size:13px;color:#666;">Conseiller en efficacité énergétique</div>
        <div style="height:10px;line-height:10px;font-size:0;">&nbsp;</div>
        <div style="font-size:13px;color:#333;line-height:1.55;">
          Effinor<br />
          &#128231; contact@groupe-effinor.fr<br />
          &#127760; www.groupe-effinor.fr
        </div>
      </td>
    </tr>
  </table>
  ${pixel}
</div>
</body>
</html>`;

  return { subject, html, text };
}
