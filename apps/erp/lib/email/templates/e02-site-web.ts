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
  escapeHtml,
  getEffinorPhoneDisplay,
  getEffinorPhoneDisplayHours,
  getEffinorSiteUrl,
  renderBaseLayout,
  renderCtaButton,
  renderGreeting,
  renderH1,
  renderH2,
  renderHighlight,
  renderOrderedList,
  renderParagraph,
  renderSecondaryParagraph,
  renderSignatureText,
} from "./_base-layout";

export type E02Data = BaseEmailData;

export const E02_SUBJECT =
  "Votre demande EFFINOR — un conseiller vous rappelle sous 24h";

type RenderedEmail = { subject: string; html: string; text: string };

export function renderE02SiteWebEmail(data: E02Data): RenderedEmail {
  const intro =
    "Merci de nous avoir contactés. Un conseiller EFFINOR spécialisé en rénovation énergétique étudie votre projet et vous rappellera sous 24 heures ouvrées au numéro que vous nous avez communiqué.";

  const highlightLines = [
    "✓ Étude personnalisée 100% gratuite",
    "✓ Devis sans engagement sous 48h",
    "✓ Accompagnement de A à Z, du diagnostic au versement de votre prime",
  ];
  const highlightInner = highlightLines
    .map(
      (line, i) =>
        `<span style="display:block;margin:${i < highlightLines.length - 1 ? "0 0 10px" : "0"};">${escapeHtml(line)}</span>`,
    )
    .join("");

  const steps = [
    "Analyser votre situation actuelle (logement, chauffage, factures énergie)",
    "Identifier les aides auxquelles vous êtes éligible (CEE, MaPrimeRénov')",
    "Vous proposer une solution adaptée et un devis transparent",
    "Vous accompagner pendant toute la durée des travaux",
  ];

  const siteBase = getEffinorSiteUrl().replace(/\/+$/, "");
  const ctaUrl = `${siteBase}/#simulateur`;

  const phone = getEffinorPhoneDisplay();
  const hours = getEffinorPhoneDisplayHours();
  const ctaSub = `Une question urgente ? Appelez-nous directement au ${phone} (${hours})`;

  const bodyHtml = [
    renderGreeting(data.destinatairePrenom),
    renderH1("Nous avons bien reçu votre demande"),
    renderParagraph(intro),
    renderHighlight(highlightInner),
    renderH2("Ce que nous allons faire pour vous"),
    renderOrderedList(steps),
    renderCtaButton("Démarrer mon projet", ctaUrl, ctaSub),
    renderSecondaryParagraph(
      "Vous pouvez également répondre directement à cet email — nous vous lirons et vous répondrons dans les meilleurs délais.",
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
    "Nous avons bien recu votre demande",
    "",
    intro,
    "",
    "Points cles :",
    "- Etude personnalisee 100% gratuite",
    "- Devis sans engagement sous 48h",
    "- Accompagnement de A a Z, du diagnostic au versement de votre prime",
    "",
    "Ce que nous allons faire pour vous :",
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    `Demarrer mon projet : ${ctaUrl}`,
    "",
    ctaSub,
    "",
    "Vous pouvez aussi repondre directement a cet email.",
    "",
    "—",
    renderSignatureText(data.agentPrenom),
  ].join("\n");

  return { subject: E02_SUBJECT, html, text };
}
