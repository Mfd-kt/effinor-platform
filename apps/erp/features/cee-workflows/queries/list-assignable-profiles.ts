import { createClient } from "@/lib/supabase/server";

export type AssignableProfileOption = {
  id: string;
  fullName: string | null;
  email: string;
  roleCodes: string[];
};

export async function listAssignableProfiles(query?: string): Promise<AssignableProfileOption[]> {
  const supabase = await createClient();
  let profileQuery = supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (query?.trim()) {
    const q = query.trim();
    profileQuery = profileQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data: profiles, error: profilesError } = await profileQuery.limit(100);
  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const ids = (profiles ?? []).map((profile) => profile.id);
  if (ids.length === 0) {
    return [];
  }

  const { data: roleLinks, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id, roles!role_id(code)")
    .in("user_id", ids);

  if (rolesError) {
    throw new Error(rolesError.message);
  }

  const rolesByUser = new Map<string, string[]>();
  for (const row of (roleLinks ?? []) as unknown as Array<{ user_id: string; roles: { code: string } | null }>) {
    const arr = rolesByUser.get(row.user_id) ?? [];
    if (row.roles?.code && !arr.includes(row.roles.code)) {
      arr.push(row.roles.code);
    }
    rolesByUser.set(row.user_id, arr);
  }

  return (profiles ?? []).map((profile) => ({
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    roleCodes: rolesByUser.get(profile.id) ?? [],
  }));
}
