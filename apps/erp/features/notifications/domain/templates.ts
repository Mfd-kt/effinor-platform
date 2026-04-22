import { formatDateFr } from "@/lib/format";

import type { NotificationChannelKey, NotificationSeverity, SlackNotificationPayload } from "./types";

const CH = {
  commercial: "commercial",
  administratif: "administratif",
  technique: "technique",
  finance: "finance",
  direction: "direction",
  alerts: "alerts",
  closer: "closer",
} as const satisfies Record<string, NotificationChannelKey>;

function baseUrl(): string {
  return process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
}

function leadUrl(leadId: string): string {
  const root = baseUrl();
  const path = `/leads/${leadId}`;
  return root ? `${root.replace(/\/$/, "")}${path}` : path;
}

// ——— Leads ———

export function templateLeadCreated(opts: {
  companyName: string;
  leadId: string;
  sourceLabel: string;
  leadStatus: string;
  score?: number | null;
}): SlackNotificationPayload {
  const lines = [
    `Client : ${opts.companyName}`,
    `Source : ${opts.sourceLabel}`,
    `Statut pipeline : ${opts.leadStatus}`,
  ];
  if (opts.score != null && Number.isFinite(opts.score)) {
    lines.push(`Score simulateur : ${Math.round(opts.score)}`);
  }
  return {
    title: "Nouveau lead",
    lines,
    severity: "info",
    channelKey: CH.commercial,
    actionUrl: leadUrl(opts.leadId),
    actionLabel: "Ouvrir la fiche lead",
  };
}

export function templateLeadFromSimulator(opts: {
  companyName: string;
  leadId: string;
  score?: number | null;
  primeEur?: number | null;
}): SlackNotificationPayload {
  const lines = [
    `Client : ${opts.companyName}`,
    `Créé depuis le simulateur terrain`,
  ];
  if (opts.score != null && Number.isFinite(opts.score)) {
    lines.push(`Score : ${Math.round(opts.score)}`);
  }
  if (opts.primeEur != null && Number.isFinite(opts.primeEur)) {
    lines.push(`Prime CEE estimée : ${Math.round(opts.primeEur).toLocaleString("fr-FR")} €`);
  }
  return {
    title: "Nouveau lead (simulateur)",
    lines,
    severity: "success",
    channelKey: CH.commercial,
    actionUrl: leadUrl(opts.leadId),
    actionLabel: "Ouvrir le lead",
  };
}

export function templateLeadHot(opts: {
  companyName: string;
  leadId: string;
  reason: string;
}): SlackNotificationPayload {
  return {
    title: "Lead chaud",
    lines: [`Client : ${opts.companyName}`, `Signal : ${opts.reason}`],
    severity: "warning",
    channelKey: CH.commercial,
    actionUrl: leadUrl(opts.leadId),
    actionLabel: "Traiter le lead",
  };
}

export function templateDuplicateLeadAttempt(opts: {
  companyName: string;
  reason: string;
  existingLeadId: string;
}): SlackNotificationPayload {
  return {
    title: "Doublon lead détecté",
    lines: [
      `Saisie : ${opts.companyName}`,
      `Motif : ${opts.reason}`,
      `Fiche existante : ${opts.existingLeadId}`,
    ],
    severity: "warning",
    channelKey: CH.commercial,
    actionUrl: leadUrl(opts.existingLeadId),
    actionLabel: "Ouvrir la fiche existante",
  };
}

export function templateLeadLost(opts: { companyName: string; leadId: string }): SlackNotificationPayload {
  return {
    title: "Lead perdu",
    lines: [`Client : ${opts.companyName}`],
    severity: "warning",
    channelKey: CH.commercial,
    actionUrl: leadUrl(opts.leadId),
    actionLabel: "Voir la fiche",
  };
}

// ——— Études / PDF ———

export function templateStudyPdfGenerated(opts: {
  companyName: string;
  leadId: string;
}): SlackNotificationPayload {
  return {
    title: "Étude PDF générée",
    lines: [`Client : ${opts.companyName}`, `Documents : présentation projet + accord de principe`],
    severity: "success",
    channelKey: CH.commercial,
    actionUrl: leadUrl(opts.leadId),
    actionLabel: "Ouvrir le lead",
  };
}

export function templateAccordGenerated(opts: {
  companyName: string;
  leadId: string;
}): SlackNotificationPayload {
  return {
    title: "Accord de principe généré",
    lines: [`Client : ${opts.companyName}`],
    severity: "success",
    channelKey: CH.commercial,
    metadata: { kind: "accord" },
    actionUrl: leadUrl(opts.leadId),
    actionLabel: "Voir le lead",
  };
}

export function templateQuoteGeneratedPlaceholder(opts: {
  reference: string;
  entityId: string;
}): SlackNotificationPayload {
  return {
    title: "Devis généré (à brancher)",
    lines: [`Référence : ${opts.reference}`, "Brancher l’action métier de génération de devis quand disponible."],
    severity: "info",
    channelKey: CH.commercial,
    metadata: { entityId: opts.entityId },
  };
}

// ——— Panier ———

export function templateCartProductAdded(opts: {
  productName: string;
  quantity: number;
  leadLabel: string;
  cartSubtotalHt: number;
  leadId: string | null;
}): SlackNotificationPayload {
  const lines = [
    `Produit : ${opts.productName}`,
    `Quantité : ${opts.quantity}`,
    `Panier : ${opts.leadLabel}`,
    `Sous-total HT : ${opts.cartSubtotalHt.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`,
  ];
  return {
    title: "Produit ajouté au panier",
    lines,
    severity: "info",
    channelKey: CH.commercial,
    actionUrl: opts.leadId ? leadUrl(opts.leadId) : undefined,
    actionLabel: opts.leadId ? "Voir le lead" : undefined,
  };
}

export function templateCartFinalizedPlaceholder(opts: { cartCode: string }): SlackNotificationPayload {
  return {
    title: "Panier finalisé (workflow à brancher)",
    lines: [`Code panier : ${opts.cartCode}`, "Finaliser le statut `project_carts` côté métier pour notifier automatiquement."],
    severity: "success",
    channelKey: CH.commercial,
  };
}

// ——— VT ———

export function templateVtStarted(opts: {
  vtReference: string;
  vtId: string;
  companyHint?: string | null;
  technicianLabel?: string | null;
  startedAt?: string | null;
}): SlackNotificationPayload {
  const lines = [`Réf. VT : ${opts.vtReference}`, "Le technicien a démarré la visite sur le terrain."];
  if (opts.startedAt) lines.push(`Heure de démarrage : ${formatDateFr(opts.startedAt)}`);
  if (opts.technicianLabel) lines.push(`Technicien : ${opts.technicianLabel}`);
  if (opts.companyHint) lines.push(`Contexte : ${opts.companyHint}`);
  const root = baseUrl();
  const path = `/technical-visits/${opts.vtId}`;
  const url = root ? `${root.replace(/\/$/, "")}${path}` : path;
  return {
    title: "VT en cours",
    lines,
    severity: "info",
    channelKey: CH.technique,
    actionUrl: url,
    actionLabel: "Ouvrir la VT",
  };
}

export function templateVtScheduled(opts: {
  vtReference: string;
  vtId: string;
  scheduledAt: string | null;
  companyHint?: string | null;
}): SlackNotificationPayload {
  const lines = [
    `Réf. VT : ${opts.vtReference}`,
    opts.scheduledAt ? `Planifiée le : ${opts.scheduledAt}` : "Date à confirmer",
  ];
  if (opts.companyHint) lines.push(`Contexte : ${opts.companyHint}`);
  const root = baseUrl();
  const path = `/technical-visits/${opts.vtId}`;
  const url = root ? `${root.replace(/\/$/, "")}${path}` : path;
  return {
    title: "VT planifiée",
    lines,
    severity: "info",
    channelKey: CH.technique,
    actionUrl: url,
    actionLabel: "Ouvrir la VT",
  };
}

export function templateVtPerformed(opts: {
  vtReference: string;
  vtId: string;
  companyHint?: string | null;
}): SlackNotificationPayload {
  const lines = [`Réf. VT : ${opts.vtReference}`, "Visite effectuée — rapport à compléter si besoin."];
  if (opts.companyHint) lines.push(`Contexte : ${opts.companyHint}`);
  const root = baseUrl();
  const path = `/technical-visits/${opts.vtId}`;
  const url = root ? `${root.replace(/\/$/, "")}${path}` : path;
  return {
    title: "VT effectuée",
    lines,
    severity: "success",
    channelKey: CH.technique,
    actionUrl: url,
    actionLabel: "Ouvrir la VT",
  };
}

// ——— Finance / CEE (stubs métier) ———

export function templatePaymentReceivedPlaceholder(opts: { amountEur: number; label: string }): SlackNotificationPayload {
  return {
    title: "Paiement reçu",
    lines: [`Montant : ${opts.amountEur.toLocaleString("fr-FR")} €`, opts.label],
    severity: "success",
    channelKey: CH.finance,
  };
}

export function templateCeeDossierDeposedPlaceholder(opts: { label: string }): SlackNotificationPayload {
  return {
    title: "Dossier déposé (à brancher)",
    lines: [opts.label],
    severity: "success",
    channelKey: CH.administratif,
  };
}

// ——— Rappels commerciaux ———

export function templateCallbackDueToday(opts: {
  companyName: string;
  contactName: string;
  phone: string;
  callbackId: string;
  callbackDate: string;
}): SlackNotificationPayload {
  return {
    title: "Rappel commercial — échéance aujourd’hui",
    lines: [
      `Société : ${opts.companyName}`,
      `Contact : ${opts.contactName}`,
      `Tél. : ${opts.phone}`,
      `Date : ${opts.callbackDate}`,
      `ID rappel : ${opts.callbackId}`,
    ],
    severity: "info",
    channelKey: CH.commercial,
  };
}

export function templateCallbackOverdue(opts: {
  companyName: string;
  contactName: string;
  phone: string;
  callbackId: string;
  callbackDate: string;
}): SlackNotificationPayload {
  return {
    title: "Rappel commercial — en retard",
    lines: [
      `Société : ${opts.companyName}`,
      `Contact : ${opts.contactName}`,
      `Tél. : ${opts.phone}`,
      `Échéance : ${opts.callbackDate}`,
      `ID rappel : ${opts.callbackId}`,
    ],
    severity: "warning",
    channelKey: CH.commercial,
  };
}

// ——— Système ———

export function templateCriticalError(message: string, context?: Record<string, unknown>): SlackNotificationPayload {
  return {
    title: "Erreur critique",
    body: message,
    lines: context
      ? Object.entries(context)
          .slice(0, 12)
          .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
      : undefined,
    severity: "critical",
    channelKey: CH.alerts,
    metadata: context,
  };
}

export function withSeverity(
  payload: SlackNotificationPayload,
  severity: NotificationSeverity,
): SlackNotificationPayload {
  return { ...payload, severity };
}
