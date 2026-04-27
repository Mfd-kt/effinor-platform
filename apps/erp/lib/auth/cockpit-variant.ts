import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";

export type CockpitVariant =
  | "super_admin"
  | "admin"
  | "sales_director"
  | "manager"
  | "closer"
  | "sales_agent"
  | "technician"
  | "daf"
  | "admin_agent"
  | "installer"
  | "lead_generation_quantifier"
  | "marketing_manager"
  | "default";

/**
 * Manager d'équipe CEE actif (membre `cee_sheet_team_members` avec rôle manager).
 *
 * NOTE — Plus utilisé par le routing dashboard home : le concept legacy `manager` a
 * été remplacé par `sales_director` dans la nouvelle architecture. Cette fonction
 * reste exportée pour les contrôles d'éligibilité CEE (`switch-cee-sheet-eligibility`,
 * permissions feuille CEE) qui dépendent toujours de la table.
 */
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
 * Priorité dashboard home : direction → commercial / terrain → quantifier → marketing
 * (seul) → default. `marketing_manager` est en dernier pour ne pas masquer un rôle opérationnel.
 *
 * Ne renvoie plus `"manager"` — le concept legacy CEE a été retiré du routing
 * (équivalent moderne = `sales_director`). Un ancien manager retombe naturellement
 * sur sa seconde affiliation (sales_agent, technician…) ou `default`.
 */
export async function resolveCockpitVariant(access: AccessContext): Promise<CockpitVariant> {
  if (access.kind !== "authenticated") {
    return "default";
  }
  const codes = access.roleCodes;
  if (codes.includes("super_admin")) return "super_admin";
  if (codes.includes("admin")) return "admin";
  if (codes.includes("sales_director")) return "sales_director";
  if (codes.includes("daf")) return "daf";
  if (codes.includes("closer")) return "closer";
  if (codes.includes("sales_agent")) return "sales_agent";
  if (codes.includes("technician")) return "technician";
  if (codes.includes("admin_agent")) return "admin_agent";
  if (codes.includes("installer")) return "installer";
  if (codes.includes("lead_generation_quantifier")) return "lead_generation_quantifier";
  if (codes.includes("marketing_manager")) return "marketing_manager";
  return "default";
}
