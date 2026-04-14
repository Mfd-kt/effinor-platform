export type {
  DomainNotificationEvent,
  NotificationChannelKey,
  NotificationSeverity,
  SlackNotificationPayload,
} from "@/features/notifications/domain/types";

export { SlackEventType } from "@/features/notifications/domain/slack-events";
export { resolveSlackWebhookUrl } from "@/features/notifications/domain/routing";
export {
  SLACK_AUTOMATION_EVENT_TYPES,
  type SlackAutomationEventType,
  type SlackWebhookForEventResult,
  type SlackWebhookTarget,
  resolveSlackWebhookForEvent,
  mapCockpitAlertToAutomationEventType,
  buildSlackMessageFromEvent,
  sanitizeSlackVisibleText,
} from "@/features/notifications/domain/slack-automation-routing";
export { renderSlackText, renderSlackBlocks } from "@/features/notifications/domain/render-slack";
export * as notificationTemplates from "@/features/notifications/domain/templates";

export { sendSlackNotification, notifyDomainEvent } from "@/features/notifications/services/slack-notification-service";
export {
  sendSlackAutomationTypedEvent,
  buildAbsoluteLeadUrl,
} from "@/features/notifications/services/slack-automation-event-send";
export {
  notifyNewLead,
  notifyLeadFromSimulator,
  notifyLeadStudyPdfsGenerated,
  notifyProductAddedToCart,
  notifyTechnicalVisitLifecycle,
  notifyCriticalError,
  notifyDuplicateLeadAttempt,
} from "@/features/notifications/services/notification-service";

export { triggerNotificationFromDomainEvent } from "@/features/notifications/actions/trigger-notification";
