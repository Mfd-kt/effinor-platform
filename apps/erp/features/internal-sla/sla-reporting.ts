import type { SupabaseClient } from "@supabase/supabase-js";

import type { CommandCockpitInternalSlaBlock, CommandCockpitSlaWorstRow } from "@/features/cockpit/types";
import type { Database } from "@/types/database.types";
import { getParisDayRangeIso } from "@/lib/datetime/paris-day";

type Admin = SupabaseClient<Database>;

function hrefForSlaEntity(
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown>,
): string {
  if (entityType === "callback") return "/commercial-callbacks";
  if (entityType === "lead") return `/leads/${entityId}`;
  if (entityType === "workflow") {
    const leadId = typeof metadata.lead_id === "string" ? metadata.lead_id : null;
    return leadId ? `/leads/${leadId}` : "/leads";
  }
  if (entityType === "user") return `/settings/users/${entityId}`;
  return "/cockpit";
}

const STATUS_RANK: Record<string, number> = {
  critical: 0,
  breached: 1,
  warning: 2,
  healthy: 3,
  resolved: 4,
};

export async function loadCockpitInternalSlaBlock(admin: Admin, now: Date): Promise<CommandCockpitInternalSlaBlock> {
  const { startIso, endIso } = getParisDayRangeIso(now);

  const [{ count: resolvedTodayParis }, { data: activeRows }, { data: rules }] = await Promise.all([
    admin
      .from("internal_sla_instances")
      .select("id", { count: "exact", head: true })
      .eq("status", "resolved")
      .gte("resolved_at", startIso)
      .lt("resolved_at", endIso),
    admin
      .from("internal_sla_instances")
      .select("id, rule_code, entity_type, entity_id, status, target_due_at, metadata_json")
      .in("status", ["warning", "breached", "critical"])
      .order("target_due_at", { ascending: true })
      .limit(400),
    admin.from("internal_sla_rules").select("code, name").eq("is_active", true),
  ]);

  const ruleNames = new Map((rules ?? []).map((r) => [r.code, r.name]));

  const nowMs = now.getTime();
  const worst: CommandCockpitSlaWorstRow[] = (activeRows ?? []).map((row) => {
    const meta =
      row.metadata_json && typeof row.metadata_json === "object" && !Array.isArray(row.metadata_json)
        ? (row.metadata_json as Record<string, unknown>)
        : {};
    const targetMs = new Date(row.target_due_at).getTime();
    const minutesLate = Math.max(0, Math.floor((nowMs - targetMs) / 60_000));
    return {
      id: row.id,
      ruleCode: row.rule_code,
      ruleName: ruleNames.get(row.rule_code) ?? row.rule_code,
      entityType: row.entity_type,
      entityId: row.entity_id,
      status: row.status,
      minutesLate,
      href: hrefForSlaEntity(row.entity_type, row.entity_id, meta),
    };
  });

  worst.sort((a, b) => {
    const sr = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
    if (sr !== 0) return sr;
    return b.minutesLate - a.minutesLate;
  });

  let warning = 0;
  let breached = 0;
  let critical = 0;
  for (const r of activeRows ?? []) {
    if (r.status === "warning") warning += 1;
    else if (r.status === "breached") breached += 1;
    else if (r.status === "critical") critical += 1;
  }

  return {
    timezone: "Europe/Paris",
    totals: {
      warning,
      breached,
      critical,
      resolvedTodayParis: resolvedTodayParis ?? 0,
    },
    worst: worst.slice(0, 12),
  };
}
