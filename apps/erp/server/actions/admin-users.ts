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
import type { AccessContext } from "@/lib/auth/access-context";
import { getAccessContext } from "@/lib/auth/access-context";
import { isSuperAdmin } from "@/lib/auth/role-codes";
import { getManagedTeamsContext, isCeeTeamManager } from "@/features/dashboard/queries/get-managed-teams-context";
import { sendNewUserCredentialsEmail } from "@/lib/email/send-new-user-credentials-email";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  releaseLeadGenerationAssignmentsForInactiveAgent,
  type ReleaseLeadGenerationAssignmentsForInactiveAgentSummary,
} from "@/features/lead-generation/services/release-lead-generation-assignments-for-inactive-agent";

function roleCodeFromRolesJoin(roles: unknown): string | null {
  if (!roles) {
    return null;
  }
  if (Array.isArray(roles)) {
    const x = roles[0];
    if (x && typeof x === "object" && "code" in x) {
      const c = (x as { code?: unknown }).code;
      return typeof c === "string" && c ? c : null;
    }
    return null;
  }
  if (typeof roles === "object" && "code" in roles) {
    const c = (roles as { code?: unknown }).code;
    return typeof c === "string" && c ? c : null;
  }
  return null;
}

const CEE_MANAGER_CREATABLE_ROLE_CODES = new Set([
  "sales_agent",
  "closer",
  "lead_generation_quantifier",
]);

type UsersSettingsActor =
  | { kind: "none" }
  | { kind: "super_admin" }
  | { kind: "team_manager"; teamIds: string[]; memberUserIds: Set<string> };

export type AdminAccountLifecycleStatus = "active" | "paused" | "disabled" | "deleted";

async function resolveUsersSettingsActor(
  access: Extract<AccessContext, { kind: "authenticated" }>,
): Promise<UsersSettingsActor> {
  if (isSuperAdmin(access.roleCodes)) {
    return { kind: "super_admin" };
  }
  if (await isCeeTeamManager(access.userId)) {
    const ctx = await getManagedTeamsContext(access.userId);
    if (!ctx) {
      return { kind: "none" };
    }
    const memberUserIds = new Set(ctx.members.map((m) => m.userId));
    memberUserIds.add(access.userId);
    return { kind: "team_manager", teamIds: ctx.teamIds, memberUserIds };
  }
  return { kind: "none" };
}

function appRoleCodeToCeeTeamMemberRole(roleCode: string): "agent" | "confirmateur" | "closer" {
  if (roleCode === "sales_agent") return "agent";
  if (roleCode === "closer") return "closer";
  return "agent";
}

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
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }
  const actor = await resolveUsersSettingsActor(access);
  if (actor.kind === "none") {
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

  if (actor.kind === "team_manager") {
    const roleInTeam = appRoleCodeToCeeTeamMemberRole(roleCode);
    for (const teamId of actor.teamIds) {
      const { error: memErr } = await admin.from("cee_sheet_team_members").insert({
        cee_sheet_team_id: teamId,
        user_id: userId,
        role_in_team: roleInTeam,
        is_active: true,
      });
      if (
        memErr &&
        !/duplicate key|unique constraint|cee_sheet_team_members_unique/i.test(memErr.message ?? "")
      ) {
        try {
          await admin.from("user_roles").delete().eq("user_id", userId);
        } catch {
          /* best effort */
        }
        try {
          await admin.auth.admin.deleteUser(userId);
        } catch {
          /* best effort */
        }
        return {
          ok: false,
          error: `Utilisateur créé mais rattachement à l’équipe a échoué : ${memErr.message}`,
        };
      }
    }
  }

  const emailResult = await sendNewUserCredentialsEmail({
    to: email,
    userId,
    displayName: fullName,
  });

  const baseMsg = `Utilisateur ${email} créé avec le rôle « ${roleCode} ».`;
  if (!emailResult.ok) {
    return {
      ok: true,
      message: `${baseMsg} Attention : l’e-mail d’activation du compte n’a pas pu être envoyé (${emailResult.error}).`,
    };
  }

  return {
    ok: true,
    message: `${baseMsg} Un e-mail sécurisé de configuration de mot de passe a été envoyé à ${email}.`,
  };
}

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  account_lifecycle_status: AdminAccountLifecycleStatus;
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
  account_lifecycle_status: AdminAccountLifecycleStatus;
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
    .select("id, email, full_name, phone, job_title, avatar_url, is_active, account_lifecycle_status")
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

  const role_codes = [
    ...new Set(
      (urRows ?? [])
        .map((r) => roleCodeFromRolesJoin(r.roles))
        .filter((c): c is string => !!c),
    ),
  ].sort();

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
  if (access.kind !== "authenticated") {
    return [];
  }
  const actor = await resolveUsersSettingsActor(access);
  if (actor.kind === "none") {
    return [];
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("roles").select("code, label_fr").order("label_fr", { ascending: true });

  if (error || !data) {
    return [];
  }

  if (actor.kind === "super_admin") {
    return data;
  }
  return data.filter((r) => CEE_MANAGER_CREATABLE_ROLE_CODES.has(r.code));
}

/**
 * Liste des profils + rôles (service role — appel serveur uniquement, après vérif super_admin).
 */
export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return [];
  }
  const actor = await resolveUsersSettingsActor(access);
  if (actor.kind === "none") {
    return [];
  }

  const admin = createAdminClient();

  let profilesQuery = admin
    .from("profiles")
    .select("id, email, full_name, is_active, account_lifecycle_status")
    .is("deleted_at", null);
  if (actor.kind === "team_manager") {
    profilesQuery = profilesQuery.in("id", [...actor.memberUserIds]);
  }
  const { data: profiles, error: profErr } = await profilesQuery.order("email", { ascending: true });

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
    const code = roleCodeFromRolesJoin(row.roles);
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
    account_lifecycle_status: (p.account_lifecycle_status ?? "active") as AdminAccountLifecycleStatus,
    role_codes: [...new Set(byUser.get(p.id) ?? [])].sort(),
  }));
}

const BAN_PAUSED = "876000h" as const;

type DisableAgentImpactSummary = {
  recycledAssignments: number;
  resetStockRows: number;
  unassignedOpenLeads: number;
};

type LifecycleRow = {
  id: string;
  is_active: boolean;
  account_lifecycle_status: AdminAccountLifecycleStatus | null;
  deleted_at: string | null;
};

function mapReleaseSummary(
  release: ReleaseLeadGenerationAssignmentsForInactiveAgentSummary,
): DisableAgentImpactSummary {
  return {
    recycledAssignments: release.recycledAssignments,
    resetStockRows: release.resetStockRows,
    unassignedOpenLeads: release.unassignedOpenLeads,
  };
}

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

async function loadTargetLifecycle(
  admin: ReturnType<typeof createAdminClient>,
  targetUserId: string,
): Promise<LifecycleRow | null> {
  const { data, error } = await admin
    .from("profiles")
    .select("id, is_active, account_lifecycle_status, deleted_at")
    .eq("id", targetUserId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return data as LifecycleRow;
}

async function revalidateUsersAndLeadGenerationViews(): Promise<void> {
  revalidatePath("/settings/users");
  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation/my-queue");
  revalidatePath("/lead-generation/management");
  revalidatePath("/agent");
  revalidatePath("/cockpit");
}

async function recordUserLifecycleEvent(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    userId: string;
    actorUserId: string | null;
    eventType: "account_paused" | "account_reactivated" | "account_disabled" | "account_deleted" | "assignments_released";
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await admin.from("user_lifecycle_events").insert({
    user_id: input.userId,
    actor_user_id: input.actorUserId,
    event_type: input.eventType,
    metadata_json: input.metadata ?? {},
  });
}

/**
 * Suppression opérationnelle forte (soft delete métier).
 * - plus de connexion
 * - plus de réactivation
 * - libération du portefeuille non terminal
 * - conservation de l'historique analytique
 */
export async function deleteUserAsAdmin(targetUserId: string): Promise<AdminUserMutationResult> {
  const denied = await guardSuperAdminNotSelf(targetUserId);
  if (denied) {
    return denied;
  }
  const access = await getAccessContext();
  const actorUserId = access.kind === "authenticated" ? access.userId : null;

  const admin = createAdminClient();
  const lifecycle = await loadTargetLifecycle(admin, targetUserId);
  if (!lifecycle) {
    return { ok: false, error: "Utilisateur introuvable." };
  }
  if (lifecycle.account_lifecycle_status === "deleted") {
    return { ok: true, message: "Compte déjà supprimé opérationnellement." };
  }

  const { error: authErr } = await admin.auth.admin.updateUserById(targetUserId, {
    ban_duration: BAN_PAUSED,
  });
  if (authErr) {
    return { ok: false, error: authErr.message };
  }

  let disableSummary: DisableAgentImpactSummary | null = null;
  try {
    const releaseSummary = await releaseLeadGenerationAssignmentsForInactiveAgent(targetUserId, {
      admin,
      reason: "deleted",
      actorUserId,
    });
    disableSummary = mapReleaseSummary(releaseSummary);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur de libération de portefeuille.";
    return { ok: false, error: message };
  }

  const nowIso = new Date().toISOString();
  const { error: profErr } = await admin
    .from("profiles")
    .update({
      is_active: false,
      account_lifecycle_status: "deleted",
      deleted_at: nowIso,
    })
    .eq("id", targetUserId);
  if (profErr) {
    return { ok: false, error: profErr.message };
  }

  await revalidateUsersAndLeadGenerationViews();
  await recordUserLifecycleEvent(admin, {
    userId: targetUserId,
    actorUserId,
    eventType: "account_deleted",
    metadata: { reason: "operational_soft_delete" },
  });
  return {
    ok: true,
    message: `Compte supprimé opérationnellement. Réallocation: ${disableSummary?.recycledAssignments ?? 0} assignation(s) recyclée(s), ${disableSummary?.resetStockRows ?? 0} fiche(s) remises en pool, ${disableSummary?.unassignedOpenLeads ?? 0} lead(s) CRM désassigné(s).`,
  };
}

/**
 * Supprime physiquement le compte Auth (hard delete) — réservé aux cas techniques (tests/doublons).
 */
export async function hardDeleteUserAsAdmin(targetUserId: string): Promise<AdminUserMutationResult> {
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
    return { ok: false, error: `Impossible de préparer le hard delete (notes): ${notesErr.message}` };
  }

  const { error: docsErr } = await admin
    .from("lead_documents")
    .update({ created_by: actorId })
    .eq("created_by", targetUserId);
  if (docsErr) {
    return { ok: false, error: `Impossible de préparer le hard delete (documents): ${docsErr.message}` };
  }

  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) {
    return {
      ok: false,
      error:
        error.message === "Database error deleting user"
          ? "Hard delete impossible (contraintes base). Préférez la suppression opérationnelle."
          : error.message,
    };
  }
  await revalidateUsersAndLeadGenerationViews();
  return { ok: true, message: "Hard delete effectué." };
}

/**
 * Pause temporaire (réactivable) : bloque la connexion et l'injection dispatch,
 * sans libérer le portefeuille existant.
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
  const access = await getAccessContext();
  const actorUserId = access.kind === "authenticated" ? access.userId : null;
  const lifecycle = await loadTargetLifecycle(admin, targetUserId);
  if (!lifecycle) {
    return { ok: false, error: "Utilisateur introuvable." };
  }

  const current = (lifecycle.account_lifecycle_status ?? "active") as AdminAccountLifecycleStatus;
  if (paused) {
    if (current === "disabled" || current === "deleted") {
      return { ok: false, error: "Compte non réactivable: utilisez une nouvelle création de compte." };
    }
    if (current === "paused") {
      return { ok: true, message: "Compte déjà en pause." };
    }
    const { error: authErr } = await admin.auth.admin.updateUserById(targetUserId, { ban_duration: BAN_PAUSED });
    if (authErr) return { ok: false, error: authErr.message };
    const { error: profErr } = await admin
      .from("profiles")
      .update({ is_active: false, account_lifecycle_status: "paused" })
      .eq("id", targetUserId);
    if (profErr) return { ok: false, error: profErr.message };
    await recordUserLifecycleEvent(admin, {
      userId: targetUserId,
      actorUserId,
      eventType: "account_paused",
      metadata: { reason: "manual_pause" },
    });
    await revalidateUsersAndLeadGenerationViews();
    return { ok: true, message: "Utilisateur mis en pause (gel temporaire, portefeuille conservé)." };
  }

  if (current === "disabled" || current === "deleted") {
    return { ok: false, error: "Compte non réactivable (désactivé définitivement ou supprimé)." };
  }
  if (current === "active") {
    return { ok: true, message: "Compte déjà actif." };
  }
  const { error: authErr } = await admin.auth.admin.updateUserById(targetUserId, { ban_duration: "none" });
  if (authErr) return { ok: false, error: authErr.message };
  const { error: profErr } = await admin
    .from("profiles")
    .update({ is_active: true, account_lifecycle_status: "active" })
    .eq("id", targetUserId);
  if (profErr) return { ok: false, error: profErr.message };
  await recordUserLifecycleEvent(admin, {
    userId: targetUserId,
    actorUserId,
    eventType: "account_reactivated",
    metadata: { reason: "manual_reactivation" },
  });
  await revalidateUsersAndLeadGenerationViews();
  return { ok: true, message: "Utilisateur réactivé." };
}

/**
 * Désactivation définitive (irréversible): compte bloqué, plus de dispatch, portefeuille vivant libéré.
 */
export async function disableUserPermanentlyAsAdmin(targetUserId: string): Promise<AdminUserMutationResult> {
  const denied = await guardSuperAdminNotSelf(targetUserId);
  if (denied) {
    return denied;
  }
  const admin = createAdminClient();
  const access = await getAccessContext();
  const actorUserId = access.kind === "authenticated" ? access.userId : null;
  const lifecycle = await loadTargetLifecycle(admin, targetUserId);
  if (!lifecycle) {
    return { ok: false, error: "Utilisateur introuvable." };
  }
  const current = (lifecycle.account_lifecycle_status ?? "active") as AdminAccountLifecycleStatus;
  if (current === "disabled") {
    return { ok: true, message: "Compte déjà désactivé définitivement." };
  }
  if (current === "deleted") {
    return { ok: false, error: "Compte supprimé opérationnellement: action impossible." };
  }

  const { error: authErr } = await admin.auth.admin.updateUserById(targetUserId, { ban_duration: BAN_PAUSED });
  if (authErr) {
    return { ok: false, error: authErr.message };
  }

  let disableSummary: DisableAgentImpactSummary | null = null;
  try {
    const releaseSummary = await releaseLeadGenerationAssignmentsForInactiveAgent(targetUserId, {
      admin,
      reason: "disabled",
      actorUserId,
    });
    disableSummary = mapReleaseSummary(releaseSummary);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur de libération de portefeuille.";
    return { ok: false, error: message };
  }

  const { error: profErr } = await admin
    .from("profiles")
    .update({ is_active: false, account_lifecycle_status: "disabled" })
    .eq("id", targetUserId);
  if (profErr) {
    return { ok: false, error: profErr.message };
  }

  await recordUserLifecycleEvent(admin, {
    userId: targetUserId,
    actorUserId,
    eventType: "account_disabled",
    metadata: { reason: "manual_disable" },
  });
  await revalidateUsersAndLeadGenerationViews();
  return {
    ok: true,
    message: `Utilisateur désactivé définitivement. Réallocation: ${disableSummary?.recycledAssignments ?? 0} assignation(s) recyclée(s), ${disableSummary?.resetStockRows ?? 0} fiche(s) remises en pool, ${disableSummary?.unassignedOpenLeads ?? 0} lead(s) CRM désassigné(s).`,
  };
}
