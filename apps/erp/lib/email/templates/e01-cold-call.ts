/**
 * E-01 — Cold call qualifié
 *
 * Déclencheur : manuel, par l'agent après un appel téléphonique réussi.
 * Destinataire : prospect / lead.
 */

import {
  type BaseEmailData,
  escapeHtml,
  renderBaseLayout,
  renderCtaButton,
  renderGreeting,
  renderH2,
  renderHighlight,
  renderParagraph,
  renderSignatureText,
} from "./_base-layout";

export type E01Data = BaseEmailData & {
  /** Résumé libre de l'appel rédigé par l'agent (optionnel). */
  resumeAppel?: string;
  /** URL de confirmation ou formulaire (CTA principal). */
  lienAction: string;
};

export const E01_SUBJECT = "Suite à notre échange — votre projet de rénovation";

export type RenderedEmail = { subject: string; html: string; text: string };

export function renderE01ColdCallEmail(data: E01Data): RenderedEmail {
  const headline = "Votre projet de rénovation est entre de bonnes mains";
  const intro =
    "Merci pour le temps que vous nous avez accordé lors de notre échange téléphonique. Nous avons bien pris note des éléments de votre projet.";
  const next =
    "Prochaines étapes : un devis personnalisé sous 48 heures ouvrées, puis une visite technique gratuite à votre domicile pour valider la faisabilité.";

  const highlightHtml = data.resumeAppel
    ? renderHighlight(
        `<strong style="display:block;margin:0 0 4px;">Récapitulatif de notre échange</strong>${escapeHtml(data.resumeAppel)}`,
      )
    : "";

  const bodyHtml = [
    renderGreeting(data.destinatairePrenom),
    renderH2(headline),
    renderParagraph(intro),
    highlightHtml,
    renderParagraph(next),
    renderCtaButton(
      "Confirmer mon projet",
      data.lienAction,
      "Aucun engagement — réponse en un clic.",
    ),
  ]
    .filter(Boolean)
    .join("\n");

  const html = renderBaseLayout({
    badgeLabel: "Votre conseiller",
    bodyHtml,
    agentPrenom: data.agentPrenom,
    destinataireEmail: data.destinataireEmail,
  });

  const text = [
    `Bonjour ${data.destinatairePrenom},`,
    "",
    headline,
    "",
    intro,
    data.resumeAppel ? `\nRécapitulatif de notre échange :\n${data.resumeAppel}` : "",
    "",
    next,
    "",
    `Confirmer mon projet : ${data.lienAction}`,
    "Aucun engagement — réponse en un clic.",
    "",
    "—",
    renderSignatureText(data.agentPrenom),
  ]
    .filter(Boolean)
    .join("\n");

  return { subject: E01_SUBJECT, html, text };
}
