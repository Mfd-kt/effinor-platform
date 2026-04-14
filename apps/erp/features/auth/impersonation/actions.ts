"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

import {
  IMPERSONATION_COOKIE_NAME,
  IMPERSONATION_COOKIE_PAYLOAD_VERSION,
  IMPERSONATION_MAX_AGE_SEC,
} from "@/lib/auth/impersonation/constants";
import { parseImpersonationCookie, serializeImpersonationCookie } from "@/lib/auth/impersonation/cookie";
import {
  insertImpersonationAuditStarted,
  insertImpersonationAuditStopped,
} from "@/lib/auth/impersonation/audit-log";
import { isSuperAdmin } from "@/lib/auth/role-codes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ImpersonationSearchRow = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  role_codes: string[];
};

function clientIp(h: Headers): string | null {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

async function requireActorSuperAdmin(): Promise<
  | { ok: true; actorUserId: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Session requise." };
  }

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user.id);

  const roleIds = [...new Set((roleRows ?? []).map((r) => r.role_id))];
  if (roleIds.length === 0) {
    return { ok: false, error: "Accès refusé." };
  }

  const { data: rolesData } = await supabase.from("roles").select("code").in("id", roleIds);
  const roleCodes = [...new Set((rolesData ?? []).map((r) => r.code).filter(Boolean))];
  if (!isSuperAdmin(roleCodes)) {
    return { ok: false, error: "Réservé au super administrateur." };
  }

  return { ok: true, actorUserId: user.id };
}

/**
 * Recherche d’utilisateurs actifs pour l’impersonation (service_role).
 */
export async function searchImpersonationTargets(input: {
  q: string;
  roleCode: string | null;
}): Promise<{ ok: true; rows: ImpersonationSearchRow[] } | { ok: false; error: string }> {
  const gate = await requireActorSuperAdmin();
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const q = input.q.trim().toLowerCase();
  const admin = createAdminClient();

  let profileQuery = admin
    .from("profiles")
    .select("id, email, full_name, is_active, deleted_at")
    .eq("is_active", true)
    .is("deleted_at", null)
    .limit(40);

  if (q.length > 0) {
    profileQuery = profileQuery.or(
      `email.ilike.%${q}%,full_name.ilike.%${q}%`,
    );
  }

  const { data: profiles, error: pErr } = await profileQuery;
  if (pErr) {
    return { ok: false, error: pErr.message };
  }

  const ids = (profiles ?? []).map((p) => p.id);
  if (ids.length === 0) {
    return { ok: true, rows: [] };
  }

  const { data: urRows, error: urErr } = await admin
    .from("user_roles")
    .select("user_id, role_id, roles!inner(code)")
    .in("user_id", ids);

  if (urErr) {
    return { ok: false, error: urErr.message };
  }

  const rolesByUser = new Map<string, string[]>();
  for (const row of urRows ?? []) {
    const uid = row.user_id as string;
    const role = row.roles as { code?: string } | null;
    const code = role?.code;
    if (!code) continue;
    const arr = rolesByUser.get(uid) ?? [];
    arr.push(code);
    rolesByUser.set(uid, arr);
  }

  let list: ImpersonationSearchRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    is_active: p.is_active,
    role_codes: [...new Set(rolesByUser.get(p.id) ?? [])].sort(),
  }));

  if (input.roleCode?.trim()) {
    const rc = input.roleCode.trim();
    list = list.filter((r) => r.role_codes.includes(rc));
  }

  list = list.filter((r) => !r.role_codes.includes("super_admin"));
  list = list.filter((r) => r.id !== gate.actorUserId);

  return { ok: true, rows: list.slice(0, 25) };
}

export type StartImpersonationResult = { ok: true } | { ok: false; error: string };

export async function startImpersonation(targetUserId: string): Promise<StartImpersonationResult> {
  const gate = await requireActorSuperAdmin();
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const tid = targetUserId.trim();
  if (!tid || tid === gate.actorUserId) {
    return { ok: false, error: "Utilisateur cible invalide." };
  }

  const admin = createAdminClient();
  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("id, is_active, deleted_at")
    .eq("id", tid)
    .maybeSingle();

  if (profErr || !profile) {
    return { ok: false, error: "Profil introuvable." };
  }
  if (!profile.is_active || profile.deleted_at != null) {
    return { ok: false, error: "Ce compte est inactif ou supprimé." };
  }

  const { data: ur } = await admin
    .from("user_roles")
    .select("role_id, roles!inner(code)")
    .eq("user_id", tid);

  const targetRoles = [...new Set((ur ?? []).map((r) => (r.roles as { code: string }).code))];
  if (targetRoles.includes("super_admin")) {
    return { ok: false, error: "Impossible d’imiter un super administrateur." };
  }

  const now = Date.now();
  const exp = now + IMPERSONATION_MAX_AGE_SEC * 1000;
  const payload = {
    v: IMPERSONATION_COOKIE_PAYLOAD_VERSION,
    actorId: gate.actorUserId,
    targetId: tid,
    iat: now,
    exp,
  } as const;

  let token: string;
  try {
    token = serializeImpersonationCookie(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Configuration impersonation manquante.";
    return { ok: false, error: msg };
  }

  const h = await headers();
  const startedAtIso = new Date(now).toISOString();
  await insertImpersonationAuditStarted({
    actorUserId: gate.actorUserId,
    impersonatedUserId: tid,
    startedAt: startedAtIso,
    ipAddress: clientIp(h),
    userAgent: h.get("user-agent"),
  });

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IMPERSONATION_MAX_AGE_SEC,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function stopImpersonation(): Promise<StartImpersonationResult> {
  const gate = await requireActorSuperAdmin();
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;
  const payload = parseImpersonationCookie(raw);
  const h = await headers();
  const endedAt = new Date().toISOString();

  if (payload && payload.actorId === gate.actorUserId) {
    await insertImpersonationAuditStopped({
      actorUserId: gate.actorUserId,
      impersonatedUserId: payload.targetId,
      endedAt,
      startedAtMs: payload.iat,
      ipAddress: clientIp(h),
      userAgent: h.get("user-agent"),
    });
  }

  cookieStore.delete(IMPERSONATION_COOKIE_NAME);

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Pour `<form action={…}>` (signature Next : Promise<void>). */
export async function submitStopImpersonationForm(): Promise<void> {
  await stopImpersonation();
}
