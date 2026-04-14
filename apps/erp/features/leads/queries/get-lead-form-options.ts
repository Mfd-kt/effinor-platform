import { getAccessContext } from "@/lib/auth/access-context";
import { canReassignLeadCreator } from "@/lib/auth/lead-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ProfileOption = {
  id: string;
  label: string;
};

function mapProfilesToOptions(
  rows: { id: string; full_name: string | null; email: string }[],
): ProfileOption[] {
  return rows.map((p) => ({
    id: p.id,
    label: [p.full_name?.trim() || null, p.email].filter(Boolean).join(" · ") || p.email,
  }));
}

/**
 * Profils actifs (lecture limitée par RLS — usage interne si besoin).
 */
export async function getLeadFormOptions(): Promise<{ profiles: ProfileOption[] }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("full_name", { ascending: true })
    .limit(500);

  if (error) {
    throw new Error(`Impossible de charger les profils : ${error.message}`);
  }

  return { profiles: mapProfilesToOptions(data ?? []) };
}

/**
 * Liste des agents pour réassigner `created_by_agent_id` — super administrateur uniquement (service role, contourne RLS).
 */
export async function getLeadProfileOptionsForReassign(): Promise<ProfileOption[]> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canReassignLeadCreator(access.roleCodes)) {
    return [];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("full_name", { ascending: true })
    .limit(500);

  if (error) {
    throw new Error(`Impossible de charger les profils : ${error.message}`);
  }

  return mapProfilesToOptions(data ?? []);
}
