export { getAutomationConfig, resolveAutomationPublicAppBaseUrl, absoluteAutomationUrl } from "./domain/config";
export type { AutomationConfig } from "./domain/config";
export type {
  AutomationType,
  AutomationLogStatus,
  SlackSmartAlertKind,
  SlackSmartAlertBuildInput,
  AutomationRuleDecision,
} from "./domain/types";

export { evaluateAutomationRuleForSlack, shouldSendSlackSmartAlert } from "./rules/automation-rule-engine";

export {
  buildSlackSmartAlertPayload,
  buildSlackSmartAlertDedupeKey,
  dedupeSlackSmartAlert,
  sendSlackSmartAlert,
} from "./services/slack-smart-alert-service";

export {
  computeAssignmentLoad,
  computeAssignmentLoadsForUsers,
  pickLeastLoadedUser,
} from "./services/workflow-assignment-service";

export {
  buildAiFollowUpContext,
  generateAiFollowUpDraft,
  sendAiFollowUp,
  scheduleAiFollowUpIfNeeded,
} from "./services/ai-follow-up-service";
export type { AiFollowUpContext, AiFollowUpReason, GenerateAiFollowUpDraftResult, SendAiFollowUpResult } from "./services/ai-follow-up-service";

export { insertAutomationLog, insertAutomationLogSupabase, type AutomationLogInsert } from "./services/automation-log-service";

export { loadGlobalCockpitAlertsForAutomation } from "./queries/load-global-cockpit-alerts-for-automation";
export { runAutomationTick, type AutomationTickResult } from "./actions/run-automation-tick";
export { getCronAutomationSecret, isCronAutomationSecretConfigured } from "./domain/cron-auth";
