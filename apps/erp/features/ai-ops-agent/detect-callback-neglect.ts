import {
  isCallbackDueToday,
  isCallbackOverdue,
  isTerminalCallbackStatus,
} from "@/features/commercial-callbacks/domain/callback-dates";
import { createAdminClient } from "@/lib/supabase/admin";

import { buildCallbackPriorityLines } from "./build-agent-message";
import type { AiOpsDetectedIssue } from "./ai-ops-types";
import { resolveRoleTargetForUser } from "./services/resolve-role-target";

type Admin = ReturnType<typeof createAdminClient>;

export async function detectCallbackNeglect(admin: Admin, now: Date): Promise<AiOpsDetectedIssue[]> {
  const { data: rows, error } = await admin
    .from("commercial_callbacks")
    .select(
      "id, company_name, status, callback_date, callback_time, attempts_count, assigned_agent_user_id, estimated_value_eur",
    )
    .is("deleted_at", null)
    .limit(3_000);
  if (error || !rows?.length) return [];

  const out: AiOpsDetectedIssue[] = [];

  for (const r of rows) {
    if (isTerminalCallbackStatus(r.status)) continue;
    const overdue = isCallbackOverdue(r.status, r.callback_date, r.callback_time, now);
    const dueToday = !overdue && isCallbackDueToday(r.status, r.callback_date, r.callback_time, now);
    if (!overdue && !dueToday) continue;

    const uid = r.assigned_agent_user_id;
    if (!uid) continue;

    const highValue = (r.estimated_value_eur ?? 0) >= 5_000 || overdue;
    if (!highValue && !dueToday) continue;

    const roleTarget = await resolveRoleTargetForUser(admin, uid);
    const priority = overdue ? "high" : "normal";

    out.push({
      targetUserId: uid,
      roleTarget,
      issueType: "overdue_callback",
      topic: overdue ? "Rappel en retard" : "Rappel du jour",
      priority,
      messageType: "alert",
      body: buildCallbackPriorityLines({
        companyName: r.company_name?.trim() || "Prospect",
        overdue,
        dueToday,
        attemptsCount: r.attempts_count ?? 0,
      }),
      requiresAction: true,
      actionType: "open_callback",
      actionPayload: { callback_id: r.id, href: "/commercial-callbacks" },
      entityType: "callback",
      entityId: r.id,
      estimatedValueEur: r.estimated_value_eur ?? undefined,
      metadataJson: { detector: "detect-callback-neglect" },
    });
  }

  return out;
}
