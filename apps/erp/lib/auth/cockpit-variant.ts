import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";

export type CockpitVariant =
  | "super_admin"
  | "admin"
  | "sales_director"
  | "manager"
  | "closer"
  | "confirmer"
  | "sales_agent"
  | "technician"
  | "default";

/** Manager d’équipe CEE actif (membre `cee_sheet_team_members` avec rôle manager). */
export async function userIsActiveCeeTeamManager(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cee_sheet_team_members")
    .select("id")
    .eq("user_id", userId)
    .eq("role_in_team", "manager")
    .eq("is_active", true)
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

/**
 * Priorité cockpit : direction → rôles spécialisés (closer / confirmateur) → manager d’équipe CEE → agent.
 */
export async function resolveCockpitVariant(access: AccessContext): Promise<CockpitVariant> {
  if (access.kind !== "authenticated") {
    return "default";
  }
  const codes = access.roleCodes;
  if (codes.includes("super_admin")) return "super_admin";
  if (codes.includes("admin")) return "admin";
  if (codes.includes("sales_director")) return "sales_director";
  if (codes.includes("closer")) return "closer";
  if (codes.includes("confirmer")) return "confirmer";
  if (await userIsActiveCeeTeamManager(access.userId)) return "manager";
  if (codes.includes("sales_agent")) return "sales_agent";
  if (codes.includes("technician")) return "technician";
  return "default";
}
