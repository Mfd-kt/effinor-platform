import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

import { detectIssuesRaw, normalizeAiOpsDetectedIssue } from "./detect-issues";
import { isAiOpsAgentEnabled, aiOpsMaxMessagesPerTick } from "./ai-ops-env";
import type { RunAiOpsAgentResult } from "./ai-ops-types";
import { groupRelatedIssuesForUser } from "./lib/group-related-issues";
import { autoCloseInactiveConversations, unsnoozeExpiredConversations } from "./lib/ai-ops-lifecycle";
import {
  ensureConversationWithAgentMessage,
  logAiOpsEvent,
  type AiOpsTickMutableCounters,
} from "./services/persist-ai-ops";
import { isAiConversationIssueStillActive } from "./services/validate-ai-conversation-issue";

/**
 * Tick agent opérations : cycle de vie, détection, discipline (dédoublonnage, cooldown), messages.
 */
export async function runAiOpsAgent(): Promise<RunAiOpsAgentResult> {
  const t0 = Date.now();
  if (!isAiOpsAgentEnabled()) {
    return {
      skipped: true,
      skipReason: "AI_OPS_AGENT_ENABLED est désactivé.",
      issuesDetected: 0,
      issuesAfterGrouping: 0,
      conversationsOpened: 0,
      conversationsTouched: 0,
      messagesSent: 0,
      dedupeSkipped: 0,
      cooldownSkipped: 0,
      autoResolved: 0,
      autoClosed: 0,
      unsnoozed: 0,
      messagesSuppressed: 0,
      openCapSkipped: 0,
      dailyCapSkipped: 0,
      durationMs: Date.now() - t0,
    };
  }

  const admin = createAdminClient();
  const now = new Date();

  const unsnoozed = await unsnoozeExpiredConversations(admin, now);
  const autoClosed = await autoCloseInactiveConversations(admin, now);
  if (autoClosed > 0) {
    await logAiOpsEvent(admin, {
      eventType: "ai_ops_auto_closed_batch",
      channel: "system",
      payloadJson: { count: autoClosed } as Json,
      status: "success",
    });
  }

  let autoResolved = 0;
  const { data: activeConvs } = await admin
    .from("ai_conversations")
    .select("*")
    .in("status", ["open", "awaiting_user", "snoozed", "escalated"])
    .limit(800);

  for (const c of activeConvs ?? []) {
    const still = await isAiConversationIssueStillActive(admin, c, now);
    if (!still) {
      await admin
        .from("ai_conversations")
        .update({
          status: "resolved",
          resolved_at: now.toISOString(),
          awaiting_user_reply: false,
          cooldown_until: null,
          updated_at: now.toISOString(),
        })
        .eq("id", c.id);
      autoResolved += 1;
      await logAiOpsEvent(admin, {
        conversationId: c.id,
        targetUserId: c.user_id,
        eventType: "ai_ops_auto_resolved",
        channel: "in_app",
        status: "success",
        payloadJson: { issue_type: c.issue_type } as Json,
      });
    }
  }

  const raw = await detectIssuesRaw(admin, now);
  const issues = groupRelatedIssuesForUser(raw.map(normalizeAiOpsDetectedIssue));

  const counters: AiOpsTickMutableCounters = {
    dedupeSkipped: 0,
    cooldownSkipped: 0,
    messagesSuppressed: 0,
    openCapSkipped: 0,
    dailyCapSkipped: 0,
    conversationsOpened: 0,
    messagesSent: 0,
  };

  let conversationsTouched = 0;
  const max = aiOpsMaxMessagesPerTick();
  let budget = max;

  for (const issue of issues) {
    if (budget <= 0) break;
    const r = await ensureConversationWithAgentMessage(admin, issue, now, counters);
    if (r?.inserted) {
      conversationsTouched += 1;
      budget -= 1;
      await logAiOpsEvent(admin, {
        conversationId: r.conversationId,
        targetUserId: issue.targetUserId,
        eventType: "ai_ops_agent_message_sent",
        channel: "in_app",
        payloadJson: { topic: issue.topic, dedupe_key: issue.dedupeKey, issue_type: issue.issueType } as Json,
      });
    }
  }

  return {
    skipped: false,
    issuesDetected: raw.length,
    issuesAfterGrouping: issues.length,
    conversationsOpened: counters.conversationsOpened,
    conversationsTouched,
    messagesSent: counters.messagesSent,
    dedupeSkipped: counters.dedupeSkipped,
    cooldownSkipped: counters.cooldownSkipped,
    autoResolved,
    autoClosed,
    unsnoozed,
    messagesSuppressed: counters.messagesSuppressed,
    openCapSkipped: counters.openCapSkipped,
    dailyCapSkipped: counters.dailyCapSkipped,
    durationMs: Date.now() - t0,
  };
}
