/**
 * Identifiants d’événements métier pour logs, templates et routage.
 * Préfixe `slack.` pour distinguer du futur canal email/in-app.
 */
export const SlackEventType = {
  LEAD_CREATED: "slack.lead.created",
  LEAD_FROM_SIMULATOR: "slack.lead.from_simulator",
  LEAD_HOT: "slack.lead.hot",
  LEAD_LOST: "slack.lead.lost",
  LEAD_DUPLICATE: "slack.lead.duplicate_detected",
  SIMULATION_RUN: "slack.simulation.run",
  SIMULATION_CONVERTED_TO_LEAD: "slack.simulation.converted_to_lead",
  CART_PRODUCT_ADDED: "slack.cart.product_added",
  CART_FINALIZED: "slack.cart.finalized",
  CART_READY_FOR_QUOTE: "slack.cart.ready_for_quote",
  STUDY_PDF_GENERATED: "slack.study.pdf_generated",
  ACCORD_GENERATED: "slack.accord.generated",
  QUOTE_GENERATED: "slack.quote.generated",
  DOCUMENT_SIGNED: "slack.document.signed",
  CEE_DOSSIER_INCOMPLETE: "slack.cee.dossier_incomplete",
  /** Relance interne (cron) — workflow CEE stagnant sans contact client. */
  CEE_WORKFLOW_NUDGE_CRON: "slack.cee.workflow_nudge_cron",
  CEE_DOSSIER_VALIDATED: "slack.cee.dossier_validated",
  CEE_DOSSIER_DEPOSITED: "slack.cee.dossier_deposited",
  CEE_DOSSIER_REFUSED: "slack.cee.dossier_refused",
  PAYMENT_RECEIVED: "slack.finance.payment_received",
  INVOICE_OVERDUE: "slack.finance.invoice_overdue",
  READY_TO_INVOICE: "slack.finance.ready_to_invoice",
  TREASURY_ALERT: "slack.finance.treasury_alert",
  VT_SCHEDULED: "slack.vt.scheduled",
  /** Démarrage effectif sur le terrain (`started_at`). */
  VT_STARTED: "slack.vt.started",
  /** Rappel interne (cron) J-1 / ~H-2 avant une VT planifiée — pas de contact client. */
  VT_REMINDER_CRON: "slack.vt.reminder_cron",
  VT_PERFORMED: "slack.vt.performed",
  SITE_PLANNED: "slack.site.planned",
  SITE_COMPLETED: "slack.site.completed",
  SITE_INCIDENT: "slack.site.incident",
  DIRECTION_DAILY_SUMMARY: "slack.direction.daily_summary",
  DIRECTION_PIPELINE_ALERT: "slack.direction.pipeline_alert",
  DIRECTION_CONVERSION_DROP: "slack.direction.conversion_drop",
  SYSTEM_CRITICAL: "slack.system.critical",
  /** Automatisation cockpit — alertes intelligentes (dédup, seuils). */
  AUTOMATION_SMART_ALERT: "slack.automation.smart_alert",
  /** Rappels commerciaux — échéance jour J (cron / futur). */
  CALLBACK_DUE_TODAY: "slack.callback.due_today",
  /** Rappels commerciaux — en retard. */
  CALLBACK_OVERDUE: "slack.callback.overdue",
  /** Relance e-mail auto callback — échec (routage commercial si branché). */
  CALLBACK_AUTO_FOLLOWUP_FAILED: "slack.callback.auto_followup_failed",
  /** Relance e-mail auto — envoyée (usage très limité anti-spam). */
  CALLBACK_AUTO_FOLLOWUP_SENT: "slack.callback.auto_followup_sent",
  /** Rappel haute valeur en retard (usage limité). */
  CALLBACK_HIGH_VALUE_OVERDUE: "slack.callback.high_value_overdue",
} as const;

export type SlackEventTypeId = (typeof SlackEventType)[keyof typeof SlackEventType];
