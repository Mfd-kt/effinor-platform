import { describe, expect, it } from "vitest";

import type { AiOpsDetectedIssue } from "../ai-ops-types";
import {
  AI_OPS_REOPEN_AFTER_RESOLVED_MS,
  buildAiOpsDedupeKey,
  shouldOpenNewConversation,
} from "./ai-ops-dedupe";
import { canSendAiFollowUp, computeConversationCooldown, isConversationInCooldown } from "./ai-ops-cooldown";
import { shouldSuppressAiMessageAsDuplicate } from "./ai-ops-messaging-rules";
import { groupRelatedIssuesForUser } from "./group-related-issues";
import { buildDirectionEscalationDedupeKey } from "./ai-ops-escalation-dedupe";

function issue(p: Partial<AiOpsDetectedIssue>): AiOpsDetectedIssue {
  return {
    targetUserId: "u1",
    roleTarget: "commercial",
    issueType: "overdue_callback",
    topic: "Test",
    priority: "normal",
    messageType: "alert",
    body: "Hello",
    requiresAction: true,
    entityType: "callback",
    entityId: "c1",
    ...p,
  };
}

describe("ai-ops-dedupe", () => {
  it("buildAiOpsDedupeKey is stable per entity and user", () => {
    const a = issue({});
    expect(buildAiOpsDedupeKey(a)).toBe("overdue_callback:c1:u1");
    expect(buildAiOpsDedupeKey(issue({ issueType: "missing_fields", entityId: "l1" }))).toBe(
      "missing_fields:lead:l1:u1",
    );
  });

  it("batch keys are one per user", () => {
    expect(
      buildAiOpsDedupeKey(
        issue({
          issueType: "batch_overdue_callback",
          entityId: null,
          entityType: null,
        }),
      ),
    ).toBe("batch:overdue_callback:u1");
  });

  it("shouldOpenNewConversation respects resolved cooldown", () => {
    const now = 1_000_000_000_000;
    const existing = {
      id: "x",
      status: "resolved",
      snoozed_until: null,
      updated_at: new Date(now - AI_OPS_REOPEN_AFTER_RESOLVED_MS + 60_000).toISOString(),
      resolved_at: new Date(now - AI_OPS_REOPEN_AFTER_RESOLVED_MS + 60_000).toISOString(),
      dedupe_key: "k",
      reopen_count: 0,
    };
    expect(shouldOpenNewConversation(issue({}), existing, now)).toBe(false);
    expect(shouldOpenNewConversation(issue({}), { ...existing, resolved_at: new Date(now - AI_OPS_REOPEN_AFTER_RESOLVED_MS - 60_000).toISOString() }, now)).toBe(true);
  });
});

describe("ai-ops-cooldown", () => {
  it("computeConversationCooldown varies by type", () => {
    expect(computeConversationCooldown("missing_fields", "info")).toBe(4 * 3_600_000);
    expect(computeConversationCooldown("overdue_callback", "info")).toBe(2 * 3_600_000);
  });

  it("isConversationInCooldown reads cooldown_until", () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    expect(isConversationInCooldown({ cooldown_until: future, last_ai_message_at: null, last_user_message_at: null }, Date.now())).toBe(true);
  });

  it("canSendAiFollowUp blocks during snooze for non-critical", () => {
    const until = new Date(Date.now() + 3_600_000).toISOString();
    const r = canSendAiFollowUp(
      {
        cooldown_until: null,
        last_ai_message_at: null,
        last_user_message_at: null,
        status: "snoozed",
        snoozed_until: until,
      },
      { issueType: "overdue_callback", priority: "normal", severity: "warning" },
      Date.now(),
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("snoozed");
  });
});

describe("ai-ops-messaging-rules", () => {
  it("suppresses near-duplicate AI bodies", () => {
    const prev = "Veuillez traiter ce rappel commercial aujourd’hui sans délai.";
    const next = "Veuillez traiter ce rappel commercial aujourd’hui sans délai.";
    expect(shouldSuppressAiMessageAsDuplicate(prev, { body: next, severity: "info" }).suppress).toBe(true);
  });
});

describe("groupRelatedIssuesForUser", () => {
  it("merges multiple callbacks for same user", () => {
    const base = issue({ entityId: "c1", body: "a" });
    const b = issue({ entityId: "c2", body: "b" });
    const out = groupRelatedIssuesForUser([base, b]);
    expect(out).toHaveLength(1);
    expect(out[0].issueType).toBe("batch_overdue_callback");
    expect(out[0].dedupeKey).toBe("batch:overdue_callback:u1");
  });
});

describe("ai-ops-escalation-dedupe", () => {
  it("buildDirectionEscalationDedupeKey is stable for topic fingerprint", () => {
    expect(buildDirectionEscalationDedupeKey("conv1", "Sujet")).toBe("ai_ops_esc_dir:conv1:Sujet");
  });
});
