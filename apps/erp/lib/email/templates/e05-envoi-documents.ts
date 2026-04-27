/**
 * E-05 — Envoi documents à signer
 *
 * Déclencheur : manuel, par un admin / agent commercial.
 * Destinataire : prospect / client signataire.
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

export type E05Data = BaseEmailData & {
  /** Liste des documents joints / à signer (libellés courts). */
  listeDocuments: string[];
  /** Date de validité du devis affichée dans le bloc highlight (ex. "15 mai 2026"). */
  dateValiditeDevis: string;
  /** URL de signature électronique (CTA principal). */
  lienSignature: string;
};

export const E05_SUBJECT = "Vos documents à signer — dossier rénovation EFFINOR";

type RenderedEmail = { subject: string; html: string; text: string };

export function renderE05EnvoiDocumentsEmail(data: E05Data): RenderedEmail {
  const headline = "Vos documents sont prêts à être signés";
  const intro =
    "Suite à nos derniers échanges, nous vous transmettons votre dossier complet. Vous trouverez ci-dessous la liste des pièces qui le composent ainsi que le lien pour les signer en quelques clics.";
  const explanation =
    "La signature électronique est sécurisée et a la même valeur légale qu'une signature manuscrite. Si vous avez la moindre question avant de signer, répondez simplement à ce message.";

  const docsHtml =
    data.listeDocuments.length > 0
      ? renderUnorderedList(data.listeDocuments)
      : renderParagraph("La liste détaillée des documents est jointe à ce message.");

  const safeDate = escapeHtml(data.dateValiditeDevis);
  const highlightHtml = renderHighlight(
    `<strong>Devis valable jusqu'au ${safeDate}</strong> — passé ce délai, un nouveau devis sera nécessaire.`,
  );

  const bodyHtml = [
    renderGreeting(data.destinatairePrenom),
    renderH2(headline),
    renderParagraph(intro),
    docsHtml,
    highlightHtml,
    renderParagraph(explanation),
    renderCtaButton(
      "Signer mes documents",
      data.lienSignature,
      "Signature électronique sécurisée — environ 2 minutes.",
    ),
  ].join("\n");

  const html = renderBaseLayout({
    badgeLabel: "Documents à signer",
    bodyHtml,
    agentPrenom: data.agentPrenom,
    destinataireEmail: data.destinataireEmail,
  });

  const docsText =
    data.listeDocuments.length > 0
      ? data.listeDocuments.map((d) => `  • ${d}`).join("\n")
      : "  • Liste détaillée jointe à ce message.";

  const text = [
    `Bonjour ${data.destinatairePrenom},`,
    "",
    headline,
    "",
    intro,
    "",
    "Documents :",
    docsText,
    "",
    `Devis valable jusqu'au ${data.dateValiditeDevis} — passé ce délai, un nouveau devis sera nécessaire.`,
    "",
    explanation,
    "",
    `Signer mes documents : ${data.lienSignature}`,
    "Signature électronique sécurisée — environ 2 minutes.",
    "",
    "—",
    renderSignatureText(data.agentPrenom),
  ].join("\n");

  return { subject: E05_SUBJECT, html, text };
}
