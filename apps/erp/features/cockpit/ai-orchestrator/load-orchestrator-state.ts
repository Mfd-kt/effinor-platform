import {
  calendarDateInParis,
  isCallbackDueToday,
  isCallbackOverdue,
  isTerminalCallbackStatus,
} from "@/features/commercial-callbacks/domain/callback-dates";
import { createAdminClient } from "@/lib/supabase/admin";

import type { BusinessStateAnalysis } from "./types";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Charge l’état métier minimal pour l’orchestrateur (service role — périmètre global).
 */
export async function loadCockpitDataForOrchestrator(admin: Admin): Promise<BusinessStateAnalysis> {
  const now = new Date();
  const todayParis = calendarDateInParis(now);

  const since48h = new Date(Date.now() - 48 * 3_600_000).toISOString();

  const [
    { data: cbRows, error: cbErr },
    { data: wfRows, error: wfErr },
    { data: leadRows, error: leadErr },
  ] = await Promise.all([
    admin
      .from("commercial_callbacks")
      .select(
        "id, company_name, status, callback_date, callback_time, attempts_count, assigned_agent_user_id",
      )
      .is("deleted_at", null)
      .limit(4_000),
    admin
      .from("lead_sheet_workflows")
      .select("id, cee_sheet_team_id, assigned_agent_user_id, workflow_status")
      .is("assigned_agent_user_id", null)
      .not("cee_sheet_team_id", "is", null)
      .neq("workflow_status", "lost")
      .limit(80),
    admin.from("leads").select("id, created_at").is("deleted_at", null).gte("created_at", since48h).limit(3_000),
  ]);

  if (cbErr) throw new Error(cbErr.message);
  if (wfErr) throw new Error(wfErr.message);
  if (leadErr) throw new Error(leadErr.message);

  const cashCallbacks: BusinessStateAnalysis["cashCallbacks"] = [];
  let overdueCallbacksCount = 0;

  for (const r of cbRows ?? []) {
    if (isTerminalCallbackStatus(r.status)) continue;
    const overdue = isCallbackOverdue(r.status, r.callback_date, r.callback_time, now);
    const dueToday = !overdue && isCallbackDueToday(r.status, r.callback_date, r.callback_time, now);
    if (overdue) overdueCallbacksCount += 1;
    if (!overdue && !dueToday) continue;
    cashCallbacks.push({
      id: r.id,
      companyName: r.company_name?.trim() || "—",
      status: r.status,
      attemptsCount: r.attempts_count ?? 0,
      assignedAgentUserId: r.assigned_agent_user_id,
      dueToday,
      overdue,
    });
  }

  let autoAssign: BusinessStateAnalysis["autoAssign"] = null;
  const teamIds = [...new Set((wfRows ?? []).map((w) => w.cee_sheet_team_id).filter(Boolean))] as string[];
  if (teamIds.length > 0) {
    const { data: members, error: memErr } = await admin
      .from("cee_sheet_team_members")
      .select("cee_sheet_team_id, user_id, role_in_team, is_active")
      .in("cee_sheet_team_id", teamIds)
      .eq("is_active", true)
      .eq("role_in_team", "agent");
    if (memErr) throw new Error(memErr.message);
    const byTeam = new Map<string, string[]>();
    for (const m of members ?? []) {
      const tid = m.cee_sheet_team_id;
      if (!byTeam.has(tid)) byTeam.set(tid, []);
      byTeam.get(tid)!.push(m.user_id);
    }
    for (const w of wfRows ?? []) {
      const tid = w.cee_sheet_team_id;
      if (!tid) continue;
      const agents = byTeam.get(tid);
      const pick = agents?.[0];
      if (pick) {
        autoAssign = { workflowId: w.id, agentUserId: pick, teamId: tid };
        break;
      }
    }
  }

  const leadsCreatedToday = (leadRows ?? []).filter((L) => {
    const d = new Date(L.created_at);
    return calendarDateInParis(d) === todayParis;
  }).length;

  return {
    cashCallbacks,
    autoAssign,
    leadsCreatedToday,
    overdueCallbacksCount,
  };
}

export function analyzeBusinessState(state: BusinessStateAnalysis): BusinessStateAnalysis {
  return state;
}
