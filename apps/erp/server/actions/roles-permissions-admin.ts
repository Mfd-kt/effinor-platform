"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAccessContext } from "@/lib/auth/access-context";
import { isSuperAdmin } from "@/lib/auth/role-codes";
import { MATRIX_PERMISSION_CODE_SET } from "@/lib/constants/permission-matrix";
import { createAdminClient } from "@/lib/supabase/admin";

export type RolesPermissionsMutationResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function guardSuperAdmin(): Promise<RolesPermissionsMutationResult | null> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, error: "Accès refusé." };
  }
  return null;
}

const labelSchema = z.string().min(1, "Libellé requis.").max(200);

const roleCodeCreateSchema = z
  .string()
  .trim()
  .min(2, "Le code doit contenir au moins 2 caractères.")
  .max(48, "48 caractères maximum.")
  .regex(/^[a-z][a-z0-9_]*$/, "Format : minuscules, chiffres et _ ; commencer par une lettre.");
export async function updateRoleLabel(roleId: string, formData: FormData): Promise<RolesPermissionsMutationResult> {
  const denied = await guardSuperAdmin();
  if (denied) {
    return denied;
  }
  if (!z.string().uuid().safeParse(roleId).success) {
    return { ok: false, error: "Rôle invalide." };
  }

  const parsed = labelSchema.safeParse(String(formData.get("label_fr") ?? "").trim());
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Libellé invalide." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("roles").update({ label_fr: parsed.data }).eq("id", roleId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings/roles");
  return { ok: true, message: "Libellé du rôle enregistré." };
}

/**
 * Crée un rôle en base (code unique, format snake_case applicatif).
 */
export async function createRole(formData: FormData): Promise<RolesPermissionsMutationResult> {
  const denied = await guardSuperAdmin();
  if (denied) {
    return denied;
  }

  const codeParsed = roleCodeCreateSchema.safeParse(String(formData.get("code") ?? ""));
  if (!codeParsed.success) {
    return { ok: false, error: codeParsed.error.issues[0]?.message ?? "Code invalide." };
  }
  const code = codeParsed.data;

  const parsed = labelSchema.safeParse(String(formData.get("label_fr") ?? "").trim());
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Libellé invalide." };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin.from("roles").select("id").eq("code", code).maybeSingle();
  if (existing) {
    return { ok: false, error: "Un rôle avec ce code existe déjà." };
  }

  const { error } = await admin.from("roles").insert({ code, label_fr: parsed.data });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings/roles");
  revalidatePath("/settings/users");
  return { ok: true, message: `Rôle « ${code} » créé.` };
}

/**
 * Supprime un rôle sans utilisateurs affectés. `super_admin` est protégé.
 */
export async function deleteRole(formData: FormData): Promise<RolesPermissionsMutationResult> {
  const denied = await guardSuperAdmin();
  if (denied) {
    return denied;
  }

  const roleId = String(formData.get("roleId") ?? "").trim();
  if (!z.string().uuid().safeParse(roleId).success) {
    return { ok: false, error: "Rôle invalide." };
  }

  const admin = createAdminClient();
  const { data: row } = await admin.from("roles").select("code").eq("id", roleId).maybeSingle();
  if (!row) {
    return { ok: false, error: "Rôle introuvable." };
  }
  if (row.code === "super_admin") {
    return { ok: false, error: "Le rôle super administrateur ne peut pas être supprimé." };
  }

  const { count, error: countErr } = await admin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role_id", roleId);

  if (countErr) {
    return { ok: false, error: countErr.message };
  }
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `Ce rôle est encore attribué à ${count} utilisateur(s). Retirez-le d’abord dans Utilisateurs.`,
    };
  }

  const { error: delErr } = await admin.from("roles").delete().eq("id", roleId);
  if (delErr) {
    return { ok: false, error: delErr.message };
  }

  revalidatePath("/settings/roles");
  revalidatePath("/settings/users");
  return { ok: true, message: `Rôle « ${row.code} » supprimé.` };
}

export async function updatePermission(permissionId: string, formData: FormData): Promise<RolesPermissionsMutationResult> {
  const denied = await guardSuperAdmin();
  if (denied) {
    return denied;
  }
  if (!z.string().uuid().safeParse(permissionId).success) {
    return { ok: false, error: "Permission invalide." };
  }

  const admin = createAdminClient();
  const { data: permRow } = await admin.from("permissions").select("code").eq("id", permissionId).maybeSingle();
  if (!permRow || !MATRIX_PERMISSION_CODE_SET.has(permRow.code)) {
    return { ok: false, error: "Cette permission n’existe pas ou n’est plus gérée." };
  }

  const labelParsed = labelSchema.safeParse(String(formData.get("label_fr") ?? "").trim());
  if (!labelParsed.success) {
    return { ok: false, error: labelParsed.error.issues[0]?.message ?? "Libellé invalide." };
  }

  const descRaw = String(formData.get("description") ?? "").trim();
  const description = descRaw === "" ? null : descRaw.slice(0, 2000);

  const { error } = await admin
    .from("permissions")
    .update({ label_fr: labelParsed.data, description })
    .eq("id", permissionId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings/roles");
  return { ok: true, message: "Permission mise à jour." };
}

/**
 * Remplace l’ensemble des permissions attachées à un rôle.
 */
export async function setRolePermissions(roleId: string, formData: FormData): Promise<RolesPermissionsMutationResult> {
  const denied = await guardSuperAdmin();
  if (denied) {
    return denied;
  }
  if (!z.string().uuid().safeParse(roleId).success) {
    return { ok: false, error: "Rôle invalide." };
  }

  const raw = formData.getAll("permissionIds");
  const permissionIds = [...new Set(raw.map(String).filter((id) => z.string().uuid().safeParse(id).success))];

  const admin = createAdminClient();

  const { data: roleRow } = await admin.from("roles").select("id").eq("id", roleId).maybeSingle();
  if (!roleRow) {
    return { ok: false, error: "Rôle introuvable." };
  }

  const { error: delErr } = await admin.from("role_permissions").delete().eq("role_id", roleId);
  if (delErr) {
    return { ok: false, error: delErr.message };
  }

  if (permissionIds.length > 0) {
    const { data: validPerms } = await admin.from("permissions").select("id, code").in("id", permissionIds);
    const inserts = (validPerms ?? [])
      .filter((p) => MATRIX_PERMISSION_CODE_SET.has(p.code))
      .map((p) => ({
        role_id: roleId,
        permission_id: p.id,
      }));

    if (inserts.length > 0) {
      const { error: insErr } = await admin.from("role_permissions").insert(inserts);
      if (insErr) {
        return { ok: false, error: insErr.message };
      }
    }
  }

  revalidatePath("/settings/roles");
  return { ok: true, message: "Permissions du rôle enregistrées." };
}
