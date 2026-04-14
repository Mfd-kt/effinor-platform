import { SlackEventType } from "@/features/notifications/domain/slack-events";
import * as T from "@/features/notifications/domain/templates";
import { sendSlackNotification } from "@/features/notifications/services/slack-notification-service";
import type { LeadRow } from "@/features/leads/types";
import { LEAD_SOURCE_LABELS } from "@/features/leads/constants";
import type { LeadSource } from "@/types/database.types";

function safeNotify(promise: Promise<unknown>): void {
  promise.catch((e) => console.warn("[notifications] async notify failed:", e));
}

function sourceLabel(source: LeadSource | string): string {
  return source in LEAD_SOURCE_LABELS
    ? LEAD_SOURCE_LABELS[source as LeadSource]
    : String(source);
}

/** Statuts pipeline Effinor (voir `LEAD_STATUS_LABELS`). */
function pipelineLabel(status: string): string {
  const map: Record<string, string> = {
    new: "Nouveau",
    contacted: "Contacté",
    qualified: "Qualifié",
    dossier_sent: "Dossier envoyé",
    accord_received: "Accord reçu",
    nurturing: "En suivi",
    lost: "Perdu",
    converted: "Converti",
  };
  return map[status] ?? status;
}

function isHotLead(lead: LeadRow): boolean {
  if (lead.lead_status === "qualified" || lead.lead_status === "accord_received") return true;
  const s = lead.sim_lead_score;
  return s != null && Number.isFinite(Number(s)) && Number(s) >= 75;
}

export async function notifyNewLead(lead: LeadRow): Promise<void> {
  const payload = T.templateLeadCreated({
    companyName: lead.company_name,
    leadId: lead.id,
    sourceLabel: sourceLabel(lead.source),
    leadStatus: pipelineLabel(lead.lead_status),
    score: lead.sim_lead_score,
  });
  safeNotify(
    sendSlackNotification(payload, {
      eventType: SlackEventType.LEAD_CREATED,
      entityType: "lead",
      entityId: lead.id,
    }),
  );

  if (isHotLead(lead)) {
    const hot = T.templateLeadHot({
      companyName: lead.company_name,
      leadId: lead.id,
      reason:
        lead.lead_status === "accord_received"
          ? "Accord reçu"
          : lead.lead_status === "qualified"
            ? "Lead qualifié"
            : "Score simulateur élevé (≥ 75)",
    });
    safeNotify(
      sendSlackNotification(hot, {
        eventType: SlackEventType.LEAD_HOT,
        entityType: "lead",
        entityId: lead.id,
      }),
    );
  }
}

export async function notifyLeadFromSimulator(lead: LeadRow): Promise<void> {
  const payload = T.templateLeadFromSimulator({
    companyName: lead.company_name,
    leadId: lead.id,
    score: lead.sim_lead_score,
    primeEur: lead.sim_cee_prime_estimated,
  });
  safeNotify(
    sendSlackNotification(payload, {
      eventType: SlackEventType.LEAD_FROM_SIMULATOR,
      entityType: "lead",
      entityId: lead.id,
    }),
  );
  if (isHotLead(lead)) {
    const hot = T.templateLeadHot({
      companyName: lead.company_name,
      leadId: lead.id,
      reason: "Score simulateur élevé (≥ 75) ou statut prioritaire",
    });
    safeNotify(
      sendSlackNotification(hot, {
        eventType: SlackEventType.LEAD_HOT,
        entityType: "lead",
        entityId: lead.id,
      }),
    );
  }
}

export async function notifyLeadStudyPdfsGenerated(lead: LeadRow): Promise<void> {
  const study = T.templateStudyPdfGenerated({ companyName: lead.company_name, leadId: lead.id });
  safeNotify(
    sendSlackNotification(study, {
      eventType: SlackEventType.STUDY_PDF_GENERATED,
      entityType: "lead",
      entityId: lead.id,
    }),
  );
  const accord = T.templateAccordGenerated({ companyName: lead.company_name, leadId: lead.id });
  safeNotify(
    sendSlackNotification(accord, {
      eventType: SlackEventType.ACCORD_GENERATED,
      entityType: "lead",
      entityId: lead.id,
    }),
  );
}

export async function notifyProductAddedToCart(params: {
  productName: string;
  quantity: number;
  leadLabel: string;
  leadId: string | null;
  cartSubtotalHt: number;
}): Promise<void> {
  const payload = T.templateCartProductAdded({
    productName: params.productName,
    quantity: params.quantity,
    leadLabel: params.leadLabel,
    leadId: params.leadId,
    cartSubtotalHt: params.cartSubtotalHt,
  });
  safeNotify(
    sendSlackNotification(payload, {
      eventType: SlackEventType.CART_PRODUCT_ADDED,
      entityType: "cart",
      entityId: params.leadId ?? "unknown",
    }),
  );
}

export async function notifyTechnicalVisitLifecycle(params: {
  previousStatus: string;
  currentStatus: string;
  vtReference: string;
  vtId: string;
  leadCompanyName?: string | null;
  scheduledAt?: string | null;
}): Promise<void> {
  const { previousStatus, currentStatus } = params;
  if (previousStatus === currentStatus) return;

  if (currentStatus === "scheduled" && previousStatus !== "scheduled") {
    const payload = T.templateVtScheduled({
      vtReference: params.vtReference,
      vtId: params.vtId,
      scheduledAt: params.scheduledAt ?? null,
      companyHint: params.leadCompanyName,
    });
    safeNotify(
      sendSlackNotification(payload, {
        eventType: SlackEventType.VT_SCHEDULED,
        entityType: "technical_visit",
        entityId: params.vtId,
      }),
    );
  }

  if (currentStatus === "performed" && previousStatus !== "performed") {
    const payload = T.templateVtPerformed({
      vtReference: params.vtReference,
      vtId: params.vtId,
      companyHint: params.leadCompanyName,
    });
    safeNotify(
      sendSlackNotification(payload, {
        eventType: SlackEventType.VT_PERFORMED,
        entityType: "technical_visit",
        entityId: params.vtId,
      }),
    );
  }
}

export async function notifyCriticalError(
  message: string,
  context?: Record<string, unknown>,
): Promise<void> {
  const payload = T.templateCriticalError(message, context);
  safeNotify(
    sendSlackNotification(payload, {
      eventType: SlackEventType.SYSTEM_CRITICAL,
      entityType: "system",
      entityId: "error",
    }),
  );
}

export async function notifyDuplicateLeadAttempt(params: {
  companyName: string;
  reasonLabel: string;
  existingLeadId: string;
}): Promise<void> {
  const payload = T.templateDuplicateLeadAttempt({
    companyName: params.companyName,
    reason: params.reasonLabel,
    existingLeadId: params.existingLeadId,
  });
  safeNotify(
    sendSlackNotification(payload, {
      eventType: SlackEventType.LEAD_DUPLICATE,
      entityType: "lead",
      entityId: params.existingLeadId,
    }),
  );
}
