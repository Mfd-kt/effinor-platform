"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { UploadMyAvatarResult } from "@/features/account/actions/upload-my-avatar";
import {
  AVATAR_MAX_BYTES,
  AVATARS_BUCKET,
  avatarObjectPath,
  isAllowedAvatarMime,
} from "@/features/account/lib/avatar-storage";
import { getAccessContext } from "@/lib/auth/access-context";
import { isSuperAdmin } from "@/lib/auth/role-codes";
import { sendNewUserCredentialsEmail } from "@/lib/email/send-new-user-credentials-email";
import { createAdminClient } from "@/lib/supabase/admin";

const createUserSchema = z.object({
  email: z.string().email("E-mail invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  fullName: z.string().max(200).optional().nullable(),
  roleCode: z.string().min(1, "Choisissez un rôle."),
});

export type CreateUserWithRoleResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function createUserWithRole(formData: FormData): Promise<CreateUserWithRoleResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = createUserSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    fullName: (() => {
      const v = String(formData.get("fullName") ?? "").trim();
      return v === "" ? null : v;
    })(),
    roleCode: String(formData.get("roleCode") ?? "").trim(),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Données invalides." };
  }

  const { email, password, fullName, roleCode } = parsed.data;

  const admin = createAdminClient();

  const { data: roleRow, error: roleErr } = await admin
    .from("roles")
    .select("id")
    .eq("code", roleCode)
    .maybeSingle();

  if (roleErr || !roleRow) {
    return { ok: false, error: "Rôle inconnu ou base des rôles inaccessible." };
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  if (createErr || !created.user) {
    const msg = createErr?.message ?? "Création impossible.";
    if (/already registered|already exists|User already/i.test(msg)) {
      return { ok: false, error: "Un compte existe déjà avec cet e-mail." };
    }
    return { ok: false, error: msg };
  }

  const userId = created.user.id;

  const { error: urErr } = await admin.from("user_roles").insert({
    user_id: userId,
    role_id: roleRow.id,
  });

  if (urErr) {
    try {
      await admin.auth.admin.deleteUser(userId);
    } catch {
      /* best effort rollback */
    }
    return { ok: false, error: `Utilisateur créé mais attribution du rôle échouée : ${urErr.message}` };
  }

  if (fullName) {
    await admin.from("profiles").update({ full_name: fullName }).eq("id", userId);
  }

  const emailResult = await sendNewUserCredentialsEmail({
    to: email,
    password,
    displayName: fullName,
  });

  const baseMsg = `Utilisateur ${email} créé avec le rôle « ${roleCode} ».`;
  if (!emailResult.ok) {
    return {
      ok: true,
      message: `${baseMsg} Attention : l’e-mail avec les identifiants n’a pas pu être envoyé (${emailResult.error}). Communiquez-lui ses accès par un autre canal sécurisé.`,
    };
  }

  return {
    ok: true,
    message: `${baseMsg} Un e-mail avec l’e-mail et le mot de passe de connexion a été envoyé à ${email}.`,
  };
}

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  role_codes: string[];
};

export type AdminUserProfileForEdit = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  job_title: string | null;
  avatar_url: string | null;
  is_active: boolean;
  /** Rôles applicatifs (`public.user_roles`). */
  role_codes: string[];
};

/** Catalogue `public.roles` pour l’UI (cases à cocher, listes déroulantes). */
export type RoleCatalogRow = { code: string; label_fr: string };

/**
 * Profil détaillé pour l’écran d’édition (super administrateur uniquement).
 */
export async function getAdminUserProfileById(userId: string): Promise<AdminUserProfileForEdit | null> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return null;
  }
  if (!z.string().uuid().safeParse(userId).success) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, full_name, phone, job_title, avatar_url, is_active")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const { data: urRows } = await admin
    .from("user_roles")
    .select("roles ( code )")
    .eq("user_id", userId);

  const role_codes = [...new Set(
    (urRows ?? [])
      .map((r) => (r.roles as { code: string } | null)?.code)
      .filter((c): c is string => !!c),
  )].sort();

  return { ...(data as Omit<AdminUserProfileForEdit, "role_codes">), role_codes };
}

const adminUpdateProfileSchema = z.object({
  email: z.string().email("E-mail invalide."),
  fullName: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  jobTitle: z.string().max(120).optional().nullable(),
});

function trimFormOptional(key: string, formData: FormData): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v === "" ? null : v;
}

/**
 * Met à jour le profil applicatif (et l’e-mail Auth si modifié).
 */
export async function updateUserProfileAsAdmin(
  targetUserId: string,
  formData: FormData,
): Promise<AdminUserMutationResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, error: "Accès refusé." };
  }
  if (!z.string().uuid().safeParse(targetUserId).success) {
    return { ok: false, error: "Identifiant invalide." };
  }

  const parsed = adminUpdateProfileSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    fullName: trimFormOptional("fullName", formData),
    phone: trimFormOptional("phone", formData),
    jobTitle: trimFormOptional("jobTitle", formData),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Données invalides." };
  }

  const admin = createAdminClient();

  const { data: existing, error: fetchErr } = await admin
    .from("profiles")
    .select("email")
    .eq("id", targetUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !existing) {
    return { ok: false, error: "Profil introuvable." };
  }

  const newEmail = parsed.data.email;
  const emailChanged = newEmail.toLowerCase() !== existing.email.toLowerCase();

  if (emailChanged) {
    const { error: authErr } = await admin.auth.admin.updateUserById(targetUserId, {
      email: newEmail,
      email_confirm: true,
    });
    if (authErr) {
      return { ok: false, error: authErr.message };
    }
  }

  const { error: profErr } = await admin
    .from("profiles")
    .update({
      email: newEmail,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      job_title: parsed.data.jobTitle,
    })
    .eq("id", targetUserId);

  if (profErr) {
    return { ok: false, error: profErr.message };
  }

  revalidatePath("/settings/users");
  revalidatePath(`/settings/users/${targetUserId}`);
  return { ok: true, message: "Profil enregistré." };
}

const adminSetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

/**
 * Définit un nouveau mot de passe Auth pour l’utilisateur cible (super administrateur uniquement).
 */
export async function setUserPasswordAsAdmin(
  targetUserId: string,
  formData: FormData,
): Promise<AdminUserMutationResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, error: "Accès refusé." };
  }
  if (!z.string().uuid().safeParse(targetUserId).success) {
    return { ok: false, error: "Identifiant invalide." };
  }

  const admin = createAdminClient();
  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("id")
    .eq("id", targetUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (profErr || !profile) {
    return { ok: false, error: "Profil introuvable." };
  }

  const parsed = adminSetPasswordSchema.safeParse({
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Données invalides." };
  }

  const { error: authErr } = await admin.auth.admin.updateUserById(targetUserId, {
    password: parsed.data.newPassword,
  });

  if (authErr) {
    return { ok: false, error: authErr.message };
  }

  revalidatePath("/settings/users");
  revalidatePath(`/settings/users/${targetUserId}`);
  return { ok: true, message: "Mot de passe mis à jour." };
}

/**
 * Remplace les rôles métier (`user_roles`) pour l’utilisateur cible.
 * Interdit sur votre propre compte (comme pause / suppression).
 */
export async function updateUserRolesAsAdmin(
  targetUserId: string,
  formData: FormData,
): Promise<AdminUserMutationResult> {
  const denied = await guardSuperAdminNotSelf(targetUserId);
  if (denied) {
    return denied;
  }

  const raw = formData.getAll("roleCodes");
  const selected = [...new Set(raw.map(String).filter(Boolean))];

  if (selected.length === 0) {
    return { ok: false, error: "Sélectionnez au moins un rôle." };
  }

  const admin = createAdminClient();

  const { data: roleRows, error: rolesErr } = await admin.from("roles").select("id, code").in("code", selected);

  if (rolesErr || !roleRows || roleRows.length !== selected.length) {
    return { ok: false, error: "Rôle introuvable en base." };
  }

  const { error: delErr } = await admin.from("user_roles").delete().eq("user_id", targetUserId);
  if (delErr) {
    return { ok: false, error: delErr.message };
  }

  const inserts = roleRows.map((r) => ({ user_id: targetUserId, role_id: r.id }));
  const { error: insErr } = await admin.from("user_roles").insert(inserts);
  if (insErr) {
    return { ok: false, error: insErr.message };
  }

  revalidatePath("/settings/users");
  revalidatePath(`/settings/users/${targetUserId}`);
  return { ok: true, message: "Rôles enregistrés." };
}

/**
 * Envoie une photo de profil pour un autre utilisateur (Storage + `profiles.avatar_url`).
 * Le client service role contourne les politiques « dossier = auth.uid() ».
 */
export async function uploadUserAvatarAsAdmin(
  targetUserId: string,
  formData: FormData,
): Promise<UploadMyAvatarResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, error: "Accès refusé." };
  }
  if (!z.string().uuid().safeParse(targetUserId).success) {
    return { ok: false, error: "Identifiant invalide." };
  }

  const admin = createAdminClient();

  const { data: profile, error: profFetchErr } = await admin
    .from("profiles")
    .select("id")
    .eq("id", targetUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (profFetchErr || !profile) {
    return { ok: false, error: "Profil introuvable." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choisissez une image (JPEG, PNG ou WebP)." };
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: "Image trop volumineuse (max 2 Mo)." };
  }

  if (!isAllowedAvatarMime(file.type)) {
    return { ok: false, error: "Format accepté : JPEG, PNG ou WebP." };
  }

  const path = avatarObjectPath(targetUserId);
  const { error: upErr } = await admin.storage.from(AVATARS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });

  if (upErr) {
    const raw = upErr.message ?? "";
    if (/bucket not found|Bucket not found|No such bucket/i.test(raw)) {
      return {
        ok: false,
        error:
          "Bucket Storage « avatars » absent. Exécutez la migration supabase/migrations/20260403150000_storage_bucket_avatars.sql.",
      };
    }
    return { ok: false, error: raw };
  }

  const { data: urlData } = admin.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  const { error: profErr } = await admin
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", targetUserId);

  if (profErr) {
    return { ok: false, error: profErr.message };
  }

  revalidatePath("/settings/users");
  revalidatePath(`/settings/users/${targetUserId}`);
  if (access.userId === targetUserId) {
    revalidatePath("/account");
    revalidatePath("/", "layout");
  }

  return { ok: true, publicUrl };
}

export type AdminUserMutationResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * Rôles disponibles en base (ordre libellé), pour formulaires admin.
 */
export async function listRolesForAdmin(): Promise<RoleCatalogRow[]> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return [];
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("roles").select("code, label_fr").order("label_fr", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Liste des profils + rôles (service role — appel serveur uniquement, après vérif super_admin).
 */
export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return [];
  }

  const admin = createAdminClient();

  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .select("id, email, full_name, is_active")
    .is("deleted_at", null)
    .order("email", { ascending: true });

  if (profErr || !profiles?.length) {
    return [];
  }

  const ids = profiles.map((p) => p.id);
  const { data: urRows } = await admin
    .from("user_roles")
    .select("user_id, roles ( code )")
    .in("user_id", ids);

  const byUser = new Map<string, string[]>();
  for (const row of urRows ?? []) {
    const code = (row.roles as { code: string } | null)?.code;
    if (!code) {
      continue;
    }
    const list = byUser.get(row.user_id) ?? [];
    list.push(code);
    byUser.set(row.user_id, list);
  }

  return profiles.map((p) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    is_active: p.is_active,
    role_codes: [...new Set(byUser.get(p.id) ?? [])].sort(),
  }));
}

const BAN_PAUSED = "876000h" as const;

async function guardSuperAdminNotSelf(targetUserId: string): Promise<AdminUserMutationResult | null> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, error: "Accès refusé." };
  }
  if (access.userId === targetUserId) {
    return { ok: false, error: "Cette action sur votre propre compte n’est pas autorisée." };
  }
  return null;
}

/**
 * Supprime le compte Auth + profil (cascade). Réservé au super administrateur.
 *
 * Les tables `lead_internal_notes` et `lead_documents` référencent l’auteur avec
 * `ON DELETE RESTRICT` : on réattribue ces lignes au super-admin qui supprime le compte,
 * sinon la suppression du profil échoue (message générique type « Database error deleting user »).
 */
export async function deleteUserAsAdmin(targetUserId: string): Promise<AdminUserMutationResult> {
  const denied = await guardSuperAdminNotSelf(targetUserId);
  if (denied) {
    return denied;
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !access.userId) {
    return { ok: false, error: "Session invalide." };
  }
  const actorId = access.userId;

  const admin = createAdminClient();

  const { error: notesErr } = await admin
    .from("lead_internal_notes")
    .update({ created_by: actorId })
    .eq("created_by", targetUserId);

  if (notesErr) {
    return {
      ok: false,
      error:
        "Impossible de préparer la suppression (notes internes). " +
        (notesErr.message || "Erreur base de données."),
    };
  }

  const { error: docsErr } = await admin
    .from("lead_documents")
    .update({ created_by: actorId })
    .eq("created_by", targetUserId);

  if (docsErr) {
    return {
      ok: false,
      error:
        "Impossible de préparer la suppression (documents d’étude). " +
        (docsErr.message || "Erreur base de données."),
    };
  }

  const { error } = await admin.auth.admin.deleteUser(targetUserId);

  if (error) {
    return {
      ok: false,
      error:
        error.message === "Database error deleting user"
          ? "La suppression a échoué (contraintes base de données ou compte introuvable)."
          : error.message,
    };
  }

  revalidatePath("/settings/users");
  return { ok: true, message: "Utilisateur supprimé." };
}

/**
 * Met en pause (bannissement Auth + `profiles.is_active`) ou réactive l’utilisateur.
 */
export async function setUserPausedAsAdmin(
  targetUserId: string,
  paused: boolean,
): Promise<AdminUserMutationResult> {
  const denied = await guardSuperAdminNotSelf(targetUserId);
  if (denied) {
    return denied;
  }

  const admin = createAdminClient();

  const { error: authErr } = await admin.auth.admin.updateUserById(targetUserId, {
    ban_duration: paused ? BAN_PAUSED : "none",
  });

  if (authErr) {
    return { ok: false, error: authErr.message };
  }

  const { error: profErr } = await admin
    .from("profiles")
    .update({ is_active: !paused })
    .eq("id", targetUserId);

  if (profErr) {
    return { ok: false, error: profErr.message };
  }

  revalidatePath("/settings/users");
  return {
    ok: true,
    message: paused ? "Utilisateur mis en pause (connexion bloquée)." : "Utilisateur réactivé.",
  };
}
