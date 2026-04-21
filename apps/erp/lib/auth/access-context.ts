import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types/database.types";
import { IMPERSONATION_COOKIE_NAME } from "@/lib/auth/impersonation/constants";
import { parseImpersonationCookie } from "@/lib/auth/impersonation/cookie";
import { isSuperAdmin } from "@/lib/auth/role-codes";
import { createClient } from "@/lib/supabase/server";

type Supabase = SupabaseClient<Database>;

export type ImpersonationState = {
  targetUserId: string;
  startedAtMs: number;
  actorEmail: string | null;
  actorFullName: string | null;
};

export type AccessContext =
  | { kind: "guest" }
  | {
      kind: "authenticated";
      /** Sujet métier effectif (utilisateur impersonné ou acteur). */
      userId: string;
      /** Identité réelle (JWT Supabase). */
      actorUserId: string;
      roleCodes: readonly string[];
      /** Rôles du compte réel (JWT), pour contrôles réservés au super_admin. */
      actorRoleCodes: readonly string[];
      email: string | null;
      fullName: string | null;
      permissionCodes: readonly string[];
      impersonation: ImpersonationState | null;
    };

async function fetchRoleCodesForUserId(
  supabase: Supabase,
  userId: string,
): Promise<string[]> {
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);

  const roleIds = [...new Set((roleRows ?? []).map((r) => r.role_id))];
  if (roleIds.length === 0) {
    return [];
  }

  const { data: rolesData } = await supabase.from("roles").select("code").in("id", roleIds);
  return [...new Set((rolesData ?? []).map((r) => r.code).filter(Boolean))].sort();
}

async function fetchPermissionCodesForRoleIds(
  supabase: Supabase,
  roleIds: string[],
): Promise<string[]> {
  if (roleIds.length === 0) {
    return [];
  }

  const { data: rpRows, error: rpErr } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .in("role_id", roleIds);

  if (rpErr || !rpRows?.length) {
    return [];
  }

  const permIds = [...new Set(rpRows.map((r) => r.permission_id))];
  const { data: permRows, error: pErr } = await supabase
    .from("permissions")
    .select("code")
    .in("id", permIds);

  if (pErr || !permRows?.length) {
    return [];
  }

  return [...new Set(permRows.map((p) => p.code))].sort();
}

async function loadUserAccessSlice(
  supabase: Supabase,
  userId: string,
): Promise<{
  email: string | null;
  fullName: string | null;
  roleCodes: string[];
  permissionCodes: string[];
}> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);

  const roleIds = [...new Set((roleRows ?? []).map((r) => r.role_id))];
  let roleCodes: string[] = [];
  if (roleIds.length > 0) {
    const { data: rolesData } = await supabase.from("roles").select("code").in("id", roleIds);
    roleCodes = [...new Set((rolesData ?? []).map((r) => r.code).filter(Boolean))].sort();
  }

  const permissionCodes = await fetchPermissionCodesForRoleIds(supabase, roleIds);

  return {
    email: profile?.email ?? null,
    fullName: profile?.full_name ?? null,
    roleCodes,
    permissionCodes,
  };
}

async function clearImpersonationCookieBestEffort(): Promise<void> {
  try {
    const store = await cookies();
    store.delete(IMPERSONATION_COOKIE_NAME);
  } catch {
    /* lecture seule */
  }
}

/**
 * Profil courant + rôles : l’utilisateur effectif peut être celui d’une impersonation (super_admin).
 */
export async function getAccessContext(): Promise<AccessContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { kind: "guest" };
  }

  const actorUserId = user.id;
  const actorRoleCodes = await fetchRoleCodesForUserId(supabase, actorUserId);
  const actorIsSuperAdmin = isSuperAdmin(actorRoleCodes);

  let effectiveUserId = actorUserId;
  let impersonation: ImpersonationState | null = null;

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;
  const cookiePayload = parseImpersonationCookie(rawCookie);

  if (cookiePayload) {
    if (
      !actorIsSuperAdmin ||
      cookiePayload.actorId !== actorUserId ||
      cookiePayload.targetId === actorUserId
    ) {
      await clearImpersonationCookieBestEffort();
    } else {
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("id, is_active, account_lifecycle_status, deleted_at")
        .eq("id", cookiePayload.targetId)
        .maybeSingle();

      if (
        !targetProfile ||
        !targetProfile.is_active ||
        targetProfile.account_lifecycle_status !== "active" ||
        targetProfile.deleted_at != null
      ) {
        await clearImpersonationCookieBestEffort();
      } else {
        const targetRoles = await fetchRoleCodesForUserId(supabase, cookiePayload.targetId);
        if (targetRoles.includes("super_admin")) {
          await clearImpersonationCookieBestEffort();
        } else {
          effectiveUserId = cookiePayload.targetId;
          const { data: actorProfile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", actorUserId)
            .maybeSingle();
          impersonation = {
            targetUserId: cookiePayload.targetId,
            startedAtMs: cookiePayload.iat,
            actorEmail: actorProfile?.email ?? user.email ?? null,
            actorFullName: actorProfile?.full_name ?? null,
          };
        }
      }
    }
  }

  const slice = await loadUserAccessSlice(supabase, effectiveUserId);

  return {
    kind: "authenticated",
    userId: effectiveUserId,
    actorUserId,
    actorRoleCodes,
    email: slice.email,
    fullName: slice.fullName,
    roleCodes: slice.roleCodes,
    permissionCodes: slice.permissionCodes,
    impersonation,
  };
}

export async function getCurrentUserProfileWithRoles(): Promise<AccessContext> {
  return getAccessContext();
}

/** Alias explicite (documentation / imports métier). */
export const getAccessContextWithImpersonation = getAccessContext;
