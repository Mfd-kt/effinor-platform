"use server";

import { revalidatePath } from "next/cache";

import {
  AdminCeeSheetSchema,
  AdminCeeSheetTeamMemberCreateSchema,
  AdminCeeSheetTeamMemberUpdateSchema,
  AdminCeeSheetTeamSchema,
  AdminCeeSheetToggleSchema,
} from "@/features/cee-workflows/schemas/admin-cee-sheet.schema";
import { requireCeeAdminAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

function revalidateAdminCee() {
  revalidatePath("/admin/cee-sheets");
  revalidatePath("/settings/cee");
}

type AdminActionResult<T = string> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export async function createCeeSheet(input: unknown): Promise<AdminActionResult<string>> {
  const parsed = AdminCeeSheetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();

  const payload = {
    code: parsed.data.code.trim(),
    label: parsed.data.name.trim(),
    category: parsed.data.category?.trim() || null,
    sort_order: parsed.data.sort_order ?? 100,
    is_commercial_active: parsed.data.is_commercial_active ?? true,
    simulator_key: parsed.data.simulator_key.trim(),
    presentation_template_key: parsed.data.presentation_template_key.trim(),
    agreement_template_key: parsed.data.agreement_template_key.trim(),
    workflow_key: parsed.data.workflow_key?.trim() || null,
    requires_technical_visit: parsed.data.requires_technical_visit ?? false,
    requires_quote: parsed.data.requires_quote ?? true,
    description: parsed.data.description?.trim() || null,
    control_points: parsed.data.control_points?.trim() || null,
    internal_notes: parsed.data.internal_notes?.trim() || null,
  };

  const { data, error } = await supabase.from("cee_sheets").insert(payload).select("id").single();
  if (error || !data) {
    return { ok: false, message: error?.message ?? "Impossible de créer la fiche." };
  }
  revalidateAdminCee();
  return { ok: true, data: data.id };
}

export async function updateCeeSheet(input: unknown): Promise<AdminActionResult<string>> {
  const parsed = AdminCeeSheetSchema.safeParse(input);
  if (!parsed.success || !parsed.data.id) {
    return { ok: false, message: parsed.success ? "Identifiant fiche requis." : parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();

  const payload = {
    code: parsed.data.code.trim(),
    label: parsed.data.name.trim(),
    category: parsed.data.category?.trim() || null,
    sort_order: parsed.data.sort_order ?? 100,
    is_commercial_active: parsed.data.is_commercial_active ?? true,
    simulator_key: parsed.data.simulator_key.trim(),
    presentation_template_key: parsed.data.presentation_template_key.trim(),
    agreement_template_key: parsed.data.agreement_template_key.trim(),
    workflow_key: parsed.data.workflow_key?.trim() || null,
    requires_technical_visit: parsed.data.requires_technical_visit ?? false,
    requires_quote: parsed.data.requires_quote ?? true,
    description: parsed.data.description?.trim() || null,
    control_points: parsed.data.control_points?.trim() || null,
    internal_notes: parsed.data.internal_notes?.trim() || null,
  };

  const { data: updated, error } = await supabase
    .from("cee_sheets")
    .update(payload)
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();
  if (error) {
    return { ok: false, message: error.message };
  }
  if (!updated) {
    return {
      ok: false,
      message: "Aucune ligne mise à jour (fiche introuvable ou droits insuffisants).",
    };
  }
  revalidateAdminCee();
  return { ok: true, data: parsed.data.id };
}

export async function toggleCeeSheetActive(input: unknown): Promise<AdminActionResult<string>> {
  const parsed = AdminCeeSheetToggleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cee_sheets")
    .update({ is_commercial_active: parsed.data.isCommercialActive })
    .eq("id", parsed.data.sheetId);
  if (error) {
    return { ok: false, message: error.message };
  }
  revalidateAdminCee();
  return { ok: true, data: parsed.data.sheetId };
}

export async function createCeeSheetTeam(input: unknown): Promise<AdminActionResult<string>> {
  const parsed = AdminCeeSheetTeamSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("cee_sheet_teams")
    .select("id")
    .eq("cee_sheet_id", parsed.data.sheetId)
    .eq("is_active", true)
    .maybeSingle();
  if (existing?.id) {
    return { ok: false, message: "Une équipe active existe déjà pour cette fiche." };
  }

  const { data, error } = await supabase
    .from("cee_sheet_teams")
    .insert({
      cee_sheet_id: parsed.data.sheetId,
      name: parsed.data.teamName.trim(),
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Impossible de créer l'équipe." };
  }
  revalidateAdminCee();
  return { ok: true, data: data.id };
}

export async function updateCeeSheetTeam(input: unknown): Promise<AdminActionResult<string>> {
  const parsed = AdminCeeSheetTeamSchema.extend({ teamId: AdminCeeSheetTeamSchema.shape.sheetId }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cee_sheet_teams")
    .update({ name: parsed.data.teamName.trim() })
    .eq("id", parsed.data.teamId);
  if (error) {
    return { ok: false, message: error.message };
  }
  revalidateAdminCee();
  return { ok: true, data: parsed.data.teamId };
}

export async function addCeeSheetTeamMember(input: unknown): Promise<AdminActionResult<string>> {
  const parsed = AdminCeeSheetTeamMemberCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("cee_sheet_team_members")
    .select("id")
    .eq("cee_sheet_team_id", parsed.data.teamId)
    .eq("user_id", parsed.data.userId)
    .eq("role_in_team", parsed.data.roleInTeam)
    .maybeSingle();
  if (existing?.id) {
    return { ok: false, message: "Cet utilisateur a déjà ce rôle dans l'équipe." };
  }

  const { data, error } = await supabase
    .from("cee_sheet_team_members")
    .insert({
      cee_sheet_team_id: parsed.data.teamId,
      user_id: parsed.data.userId,
      role_in_team: parsed.data.roleInTeam,
      is_active: parsed.data.isActive ?? true,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Impossible d'ajouter le membre." };
  }
  revalidateAdminCee();
  return { ok: true, data: data.id };
}

export async function updateCeeSheetTeamMember(input: unknown): Promise<AdminActionResult<string>> {
  const parsed = AdminCeeSheetTeamMemberUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();
  const payload: { role_in_team?: string; is_active?: boolean } = {};
  if (parsed.data.roleInTeam !== undefined) {
    payload.role_in_team = parsed.data.roleInTeam;
  }
  if (parsed.data.isActive !== undefined) {
    payload.is_active = parsed.data.isActive;
  }
  const { error } = await supabase
    .from("cee_sheet_team_members")
    .update(payload)
    .eq("id", parsed.data.memberId);
  if (error) {
    return { ok: false, message: error.message };
  }
  revalidateAdminCee();
  return { ok: true, data: parsed.data.memberId };
}

export async function removeCeeSheetTeamMember(input: unknown): Promise<AdminActionResult<string>> {
  const parsed = AdminCeeSheetTeamMemberUpdateSchema.pick({ memberId: true }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Identifiant invalide." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();
  const { error } = await supabase.from("cee_sheet_team_members").delete().eq("id", parsed.data.memberId);
  if (error) {
    return { ok: false, message: error.message };
  }
  revalidateAdminCee();
  return { ok: true, data: parsed.data.memberId };
}
