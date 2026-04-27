/**
 * E-03 — Landing Pompe à Chaleur
 *
 * Déclencheur : automatique à la réception d'un lead via la landing PAC.
 * Destinataire : prospect / lead.
 */

import {
  type BaseEmailData,
  renderBaseLayout,
  renderCtaButton,
  renderGreeting,
  renderH2,
  renderHighlight,
  renderParagraph,
  renderSignatureText,
} from "./_base-layout";

export type E03Data = BaseEmailData & {
  /** Type PAC remonté du formulaire landing si renseigné. */
  typePac?: "air_eau" | "air_air";
  /** URL de confirmation du RDV (CTA principal). */
  lienAction: string;
};

export const E03_SUBJECT = "Votre prime pompe à chaleur — estimation gratuite";

type RenderedEmail = { subject: string; html: string; text: string };

function describeTypePac(t: E03Data["typePac"]): string {
  switch (t) {
    case "air_eau":
      return "pompe à chaleur air/eau (chauffage central et eau chaude)";
    case "air_air":
      return "pompe à chaleur air/air (climatisation réversible)";
    default:
      return "pompe à chaleur (air/eau ou air/air selon configuration)";
  }
}

export function renderE03LandingPacEmail(data: E03Data): RenderedEmail {
  const headline =
    "Votre logement peut bénéficier d'une aide pour votre pompe à chaleur";
  const typeLabel = describeTypePac(data.typePac);

  const p1 = `Suite à votre demande, EFFINOR vous accompagne pour le remplacement ou l'installation d'une ${typeLabel}. Le dispositif des Certificats d'Économies d'Énergie (CEE) permet de financer une part importante du projet.`;
  const p2 =
    "Notre conseiller technique réalise un audit gratuit de votre logement (chauffage actuel, isolation, configuration) afin de confirmer votre éligibilité et de chiffrer la prime exacte.";

  const highlightHtml = renderHighlight(
    `<strong>Aide CEE disponible</strong> sous conditions d'éligibilité — audit 100% gratuit et sans engagement.`,
  );

  const bodyHtml = [
    renderGreeting(data.destinatairePrenom),
    renderH2(headline),
    renderParagraph(p1),
    highlightHtml,
    renderParagraph(p2),
    renderCtaButton(
      "Confirmer mon rendez-vous gratuit",
      data.lienAction,
      "Aucun engagement — un conseiller vous rappelle dans la journée.",
    ),
  ].join("\n");

  const html = renderBaseLayout({
    badgeLabel: "Pompe à chaleur",
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
    "Aide CEE disponible sous conditions d'éligibilité — audit 100% gratuit et sans engagement.",
    "",
    p2,
    "",
    `Confirmer mon rendez-vous gratuit : ${data.lienAction}`,
    "Aucun engagement — un conseiller vous rappelle dans la journée.",
    "",
    "—",
    renderSignatureText(data.agentPrenom),
  ].join("\n");

  return { subject: E03_SUBJECT, html, text };
}
