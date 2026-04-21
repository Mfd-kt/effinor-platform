import { createClient } from "@/lib/supabase/server";

/** Profil sélectionnable pour distribution / conversion (rôle commercial). */
export type LeadGenerationAssignableAgent = {
  id: string;
  displayName: string;
  email: string | null;
  /** Fiches actives en portefeuille — renseigné par {@link getLeadGenerationAssignableAgentsWithStock}. */
  activeStock?: number;
};

/**
 * Commerciaux actifs (`sales_agent` uniquement) pour dispatch / conversion.
 */
export async function getLeadGenerationAssignableAgents(): Promise<LeadGenerationAssignableAgent[]> {
  const supabase = await createClient();

  const { data: roleRow, error: roleErr } = await supabase
    .from("roles")
    .select("id")
    .eq("code", "sales_agent")
    .maybeSingle();

  if (roleErr) {
    throw new Error(`Rôle agent commercial : ${roleErr.message}`);
  }
  if (!roleRow) {
    return [];
  }

  const roleId = (roleRow as { id: string }).id;

  const { data: links, error: urErr } = await supabase.from("user_roles").select("user_id").eq("role_id", roleId);

  if (urErr) {
    throw new Error(`Agents lead generation : ${urErr.message}`);
  }

  const userIds = [...new Set((links ?? []).map((r) => (r as { user_id: string }).user_id))];
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, account_lifecycle_status")
    .in("id", userIds)
    .eq("is_active", true)
    .eq("account_lifecycle_status", "active")
    .is("deleted_at", null)
    .order("full_name", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Agents lead generation : ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    displayName: row.full_name?.trim() || row.email?.trim() || "Sans nom",
    email: row.email ?? null,
  }));
}
