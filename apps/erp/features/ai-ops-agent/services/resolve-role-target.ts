import { createAdminClient } from "@/lib/supabase/admin";

import type { AiOpsRoleTarget } from "../ai-ops-types";

type Admin = ReturnType<typeof createAdminClient>;

export async function resolveRoleTargetForUser(admin: Admin, userId: string): Promise<AiOpsRoleTarget> {
  const { data: ur } = await admin.from("user_roles").select("role_id").eq("user_id", userId);
  const ids = [...new Set((ur ?? []).map((r) => r.role_id))];
  if (ids.length === 0) return "commercial";

  const { data: roles } = await admin.from("roles").select("code").in("id", ids);
  const codes = new Set((roles ?? []).map((r) => r.code));

  if (codes.has("super_admin") || codes.has("sales_director")) return "direction";
  if (codes.has("closer")) return "closer";
  if (codes.has("agent")) return "agent";
  return "commercial";
}
