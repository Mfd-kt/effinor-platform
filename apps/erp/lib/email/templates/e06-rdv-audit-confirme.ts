/**
 * E-06 — RDV audit énergétique confirmé
 *
 * Déclencheur : automatique à la confirmation d'un rendez-vous d'audit.
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
  renderUnorderedList,
} from "./_base-layout";

export type E06Data = BaseEmailData & {
  /** Date au format FR (ex. "Mardi 12 mai 2026"). */
  dateRdv: string;
  /** Heure au format FR (ex. "14h00"). */
  heureRdv: string;
  /** Adresse complète du RDV (ligne unique acceptée). */
  adresseRdv: string;
  /** Téléphone à appeler pour annuler / modifier. */
  telephoneContact: string;
  /** Optionnel : URL .ics ou Google Calendar pour ajouter au calendrier. */
  lienCalendrier?: string;
};

type RenderedEmail = { subject: string; html: string; text: string };

export function buildE06Subject(dateRdv: string): string {
  const safeDate = (dateRdv ?? "").trim() || "à venir";
  return `Votre audit énergétique est confirmé — ${safeDate}`;
}

export function renderE06RdvAuditConfirmeEmail(data: E06Data): RenderedEmail {
  const subject = buildE06Subject(data.dateRdv);

  const headline = "Votre rendez-vous d'audit est confirmé";
  const intro =
    "Bonne nouvelle, votre rendez-vous d'audit énergétique est confirmé. L'audit dure environ une heure et permet de poser un diagnostic précis du logement avant les travaux.";
  const preparation =
    "Pour gagner du temps le jour J, merci de préparer les éléments suivants :";

  const documentsAprep = [
    "Factures d'énergie des trois dernières années (gaz, électricité, fioul, bois…)",
    "Pièce d'identité du propriétaire",
    "Titre de propriété ou taxe foncière",
  ];

  const safeDate = escapeHtml(data.dateRdv);
  const safeHeure = escapeHtml(data.heureRdv);
  const safeAdresse = escapeHtml(data.adresseRdv);
  const safeTel = escapeHtml(data.telephoneContact);

  const highlightHtml = renderHighlight(
    `<strong>${safeDate} à ${safeHeure}</strong><br/>${safeAdresse}`,
  );

  const ctaUrl = data.lienCalendrier?.trim() || "https://effinor.fr/contact";
  const ctaSubtext = `Pour annuler ou modifier : appelez le ${data.telephoneContact}.`;

  const bodyHtml = [
    renderGreeting(data.destinatairePrenom),
    renderH2(headline),
    renderParagraph(intro),
    highlightHtml,
    renderParagraph(preparation),
    renderUnorderedList(documentsAprep),
    renderCtaButton("Ajouter à mon calendrier", ctaUrl, ctaSubtext),
  ].join("\n");

  const html = renderBaseLayout({
    badgeLabel: "Audit énergétique",
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
    "",
    `${data.dateRdv} à ${data.heureRdv}`,
    data.adresseRdv,
    "",
    preparation,
    ...documentsAprep.map((d) => `  • ${d}`),
    "",
    `Ajouter à mon calendrier : ${ctaUrl}`,
    `Pour annuler ou modifier : appelez le ${safeTel}.`,
    "",
    "—",
    renderSignatureText(data.agentPrenom),
  ].join("\n");

  return { subject, html, text };
}
