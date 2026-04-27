/**
 * E-02 — Formulaire site web (accusé de réception)
 *
 * Déclencheur : automatique à la réception d'un lead via le site vitrine.
 * Destinataire : prospect / lead.
 *
 * Sert également de fallback générique (router) lorsqu'aucune source n'est connue.
 */

import {
  type BaseEmailData,
  renderBaseLayout,
  renderCtaButton,
  renderGreeting,
  renderH2,
  renderParagraph,
  renderSignatureText,
} from "./_base-layout";

export type E02Data = BaseEmailData;

export const E02_SUBJECT = "Nous avons bien reçu votre demande";

type RenderedEmail = { subject: string; html: string; text: string };

export function renderE02SiteWebEmail(data: E02Data): RenderedEmail {
  const headline = "Votre demande est en cours de traitement";
  const p1 =
    "Nous avons bien reçu votre demande via notre site internet. Un conseiller EFFINOR vous rappellera sous 24 heures ouvrées pour échanger sur votre projet et répondre à vos premières questions.";
  const p2 =
    "D'ici là, vous pouvez nous répondre directement à ce message si vous souhaitez nous transmettre des informations complémentaires (devis existant, photos du logement, factures d'énergie…).";

  const ctaUrl = "mailto:contact@effinor.fr";

  const bodyHtml = [
    renderGreeting(data.destinatairePrenom),
    renderH2(headline),
    renderParagraph(p1),
    renderParagraph(p2),
    renderCtaButton(
      "Répondre à ce message",
      ctaUrl,
      "Réponse rapide — votre dossier est déjà en file d'attente.",
    ),
  ].join("\n");

  const html = renderBaseLayout({
    badgeLabel: "Demande reçue",
    bodyHtml,
    agentPrenom: data.agentPrenom,
    destinataireEmail: data.destinataireEmail,
  });

  const text = [
    `Bonjour ${data.destinatairePrenom},`,
    "",
    headline,
    "",
    p1,
    "",
    p2,
    "",
    `Nous écrire : ${ctaUrl}`,
    "",
    "—",
    renderSignatureText(data.agentPrenom),
  ].join("\n");

  return { subject: E02_SUBJECT, html, text };
}
