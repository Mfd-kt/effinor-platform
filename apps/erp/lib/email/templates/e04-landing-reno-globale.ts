/**
 * E-04 — Landing Rénovation globale (BAR-TH-174)
 *
 * Déclencheur : automatique à la réception d'un lead via la landing rénovation globale.
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

export type E04Data = BaseEmailData & {
  /** Surface habitable estimée (m²), si renseignée par le formulaire. */
  surfaceEstimee?: number;
  /** Étiquette DPE actuelle (ex. "D"), si connue. */
  classeActuelle?: string;
  /** URL de programmation de l'audit (CTA principal). */
  lienAction: string;
};

export const E04_SUBJECT = "Votre prime rénovation globale — jusqu'à 7 400 €";

type RenderedEmail = { subject: string; html: string; text: string };

function describePrimeRange(surfaceM2?: number): string {
  if (typeof surfaceM2 !== "number" || !Number.isFinite(surfaceM2) || surfaceM2 <= 0) {
    return "entre 4 700 € et 7 400 € selon votre surface habitable";
  }
  if (surfaceM2 < 100) return "estimée à environ 4 700 €";
  if (surfaceM2 < 150) return "estimée à environ 5 800 €";
  return "estimée à environ 7 400 €";
}

export function renderE04LandingRenoGlobaleEmail(data: E04Data): RenderedEmail {
  const headline =
    "Votre maison est potentiellement éligible à la prime rénovation d'ampleur";

  const primeText = describePrimeRange(data.surfaceEstimee);

  const p1 =
    "EFFINOR vous accompagne sur le dispositif BAR-TH-174 (rénovation globale) : un bouquet de travaux qui doit faire gagner au moins deux classes au DPE de votre logement.";
  const p2 = `Pour une maison individuelle, la prime CEE est ${primeText} (4 700 € entre 35 et 100 m², 5 800 € entre 100 et 150 m², 7 400 € au-delà). L'audit énergétique préalable est obligatoire — nous le réalisons gratuitement pour confirmer le potentiel de votre logement.`;

  const highlightInner = data.classeActuelle
    ? `<strong>Prime estimée ${escapeHtml(primeText)}</strong> — DPE actuel renseigné : <strong>${escapeHtml(data.classeActuelle)}</strong>. L'audit gratuit est nécessaire pour confirmer.`
    : `<strong>Prime estimée ${escapeHtml(primeText)}</strong> — audit gratuit pour confirmer.`;

  const bodyHtml = [
    renderGreeting(data.destinatairePrenom),
    renderH2(headline),
    renderParagraph(p1),
    renderHighlight(highlightInner),
    renderParagraph(p2),
    renderCtaButton(
      "Programmer mon audit énergétique gratuit",
      data.lienAction,
      "Audit réalisé par un bureau d'études partenaire — 100% gratuit, sans engagement.",
    ),
  ].join("\n");

  const html = renderBaseLayout({
    badgeLabel: "Rénovation globale",
    bodyHtml,
    agentPrenom: data.agentPrenom,
    destinataireEmail: data.destinataireEmail,
  });

  const classeText = data.classeActuelle
    ? ` — DPE actuel renseigné : ${data.classeActuelle}.`
    : "";

  const text = [
    `Bonjour ${data.destinatairePrenom},`,
    "",
    headline,
    "",
    p1,
    "",
    `Prime estimée ${primeText}${classeText} L'audit gratuit est nécessaire pour confirmer.`,
    "",
    p2,
    "",
    `Programmer mon audit énergétique gratuit : ${data.lienAction}`,
    "Audit 100% gratuit, sans engagement.",
    "",
    "—",
    renderSignatureText(data.agentPrenom),
  ].join("\n");

  return { subject: E04_SUBJECT, html, text };
}
