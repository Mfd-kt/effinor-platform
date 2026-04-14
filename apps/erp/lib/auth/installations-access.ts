import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import type { AccessContext } from "./access-context";
import { canAccessInstallationsModule } from "./module-access";

/**
 * Accès à l’écran Installations : permissions matrice, rôles internes, ou au moins une installation assignée.
 */
export async function canAccessInstallationsPage(
  supabase: SupabaseClient<Database>,
  access: AccessContext,
): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (canAccessInstallationsModule(access)) {
    return true;
  }
  const { count, error } = await supabase
    .from("installations")
    .select("id", { count: "exact", head: true })
    .eq("assigned_installer_user_id", access.userId);
  if (error) {
    return false;
  }
  return (count ?? 0) > 0;
}
