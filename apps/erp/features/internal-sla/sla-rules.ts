import { createAdminClient } from "@/lib/supabase/admin";

import { isInternalSlaEnabled } from "./sla-env";
import type { InternalSlaRuleRow } from "./sla-types";

type Admin = ReturnType<typeof createAdminClient>;

export async function getActiveSlaRules(admin: Admin): Promise<InternalSlaRuleRow[]> {
  if (!isInternalSlaEnabled()) return [];
  const { data, error } = await admin
    .from("internal_sla_rules")
    .select(
      "code, name, entity_type, role_target, condition_json, target_delay_minutes, warning_delay_minutes, critical_delay_minutes, action_policy, is_active",
    )
    .eq("is_active", true);
  if (error || !data) return [];
  return data as InternalSlaRuleRow[];
}
