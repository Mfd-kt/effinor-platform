import { sendSlackNotification } from "@/features/notifications/services/slack-notification-service";

import type { CommercialPipelineStatus } from "../domain/commercial-pipeline-status";

function crmBaseUrl(): string {
  return (
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    ""
  ).replace(/\/+$/, "");
}

/**
 * Alerte Slack lors d’un passage en SLA dépassé (transition vers breached).
 * Canal `alerts` systématique ; canal `direction` en plus si pipeline « nouveau » (critique).
 */
export async function notifyLeadGenerationCommercialSlaBreach(input: {
  assignmentId: string;
  stockId: string;
  companyName: string;
  agentDisplayName: string;
  commercialPipelineStatus: CommercialPipelineStatus;
}): Promise<void> {
  const base = crmBaseUrl();
  const path = `/lead-generation/my-queue/${input.stockId}`;
  const actionUrl = base ? `${base}${path}` : path;

  const lines = [
    `Société : ${input.companyName}`,
    `Agent : ${input.agentDisplayName}`,
    `Pipeline : ${input.commercialPipelineStatus}`,
    `Assignation : ${input.assignmentId}`,
  ];

  const isCriticalNew = input.commercialPipelineStatus === "new";

  await sendSlackNotification(
    {
      title: "SLA lead generation dépassé",
      lines,
      severity: isCriticalNew ? "critical" : "warning",
      channelKey: "alerts",
      actionUrl,
      actionLabel: "Ouvrir la fiche",
    },
    { eventType: "lead_generation_sla_breach", entityType: "lead_generation_assignment", entityId: input.assignmentId },
  );

  if (isCriticalNew) {
    await sendSlackNotification(
      {
        title: "SLA critique — stock « Nouveau » non traité",
        lines: [...lines, "À traiter en priorité (pression stock neuf)."],
        severity: "critical",
        channelKey: "direction",
        actionUrl,
        actionLabel: "Ouvrir la fiche",
      },
      {
        eventType: "lead_generation_sla_breach_critical",
        entityType: "lead_generation_assignment",
        entityId: input.assignmentId,
      },
    );
  }
}
