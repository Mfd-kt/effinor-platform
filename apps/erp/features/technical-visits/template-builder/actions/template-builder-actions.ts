"use server";

import { revalidatePath } from "next/cache";

import { buildInitialDraftSchema, buildNextDraftSchemaFromPublished } from "../lib/build-initial-draft-schema";
import {
  archiveTechnicalVisitTemplateVersionSchema,
  createTechnicalVisitTemplateMasterSchema,
  parseVisitTemplateBuilderJson,
  publishTechnicalVisitTemplateVersionSchema,
  updateTechnicalVisitTemplateMasterSchema,
  updateTechnicalVisitTemplateVersionSchemaInput,
  validatePublishableTemplateSchema,
  visitTemplateBuilderSchema,
} from "../schemas/visit-template-builder.schema";
import { isCodeRegistryTemplateKey } from "@/features/technical-visits/templates/registry";
import { requireCeeAdminAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database.types";
import { z } from "zod";

const deleteTechnicalVisitTemplateSchema = z.object({
  templateId: z.string().uuid("Identifiant template invalide."),
});

const ADMIN_BASE = "/admin/technical-visit-templates";

function revalidateTemplatePaths(templateId?: string, versionId?: string) {
  revalidatePath(ADMIN_BASE);
  revalidatePath("/admin/cee-sheets");
  if (templateId) {
    revalidatePath(`${ADMIN_BASE}/${templateId}`);
    if (versionId) {
      revalidatePath(`${ADMIN_BASE}/${templateId}/versions/${versionId}`);
    }
  }
}

export type TemplateBuilderActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; message: string };

export async function createTechnicalVisitTemplate(
  input: unknown,
): Promise<TemplateBuilderActionResult<{ templateId: string; versionId: string }>> {
  const parsed = createTechnicalVisitTemplateMasterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  await requireCeeAdminAccess();

  const key = parsed.data.template_key.trim();
  if (isCodeRegistryTemplateKey(key)) {
    return {
      ok: false,
      message: "Cette clé est réservée par un template applicatif (registry code). Choisissez une autre clé.",
    };
  }

  const supabase = await createClient();
  const { data: dup } = await supabase
    .from("technical_visit_templates")
    .select("id")
    .eq("template_key", key)
    .maybeSingle();
  if (dup?.id) {
    return { ok: false, message: "Une template avec cette clé technique existe déjà." };
  }

  const draftSchema = buildInitialDraftSchema(key, parsed.data.label);
  const schemaJson = JSON.parse(JSON.stringify(draftSchema)) as Json;

  const { data: master, error: insMaster } = await supabase
    .from("technical_visit_templates")
    .insert({
      template_key: key,
      label: parsed.data.label.trim(),
      description: parsed.data.description?.trim() || null,
      cee_sheet_id: parsed.data.cee_sheet_id ?? null,
    })
    .select("id")
    .single();

  if (insMaster || !master?.id) {
    return { ok: false, message: insMaster?.message ?? "Création de la template impossible." };
  }

  const { data: ver, error: insVer } = await supabase
    .from("technical_visit_template_versions")
    .insert({
      template_id: master.id,
      version_number: 1,
      status: "draft",
      schema_json: schemaJson,
    })
    .select("id")
    .single();

  if (insVer || !ver?.id) {
    await supabase.from("technical_visit_templates").delete().eq("id", master.id);
    return { ok: false, message: insVer?.message ?? "Création de la première version impossible." };
  }

  revalidateTemplatePaths(master.id, ver.id);
  return { ok: true, data: { templateId: master.id, versionId: ver.id } };
}

export async function updateTechnicalVisitTemplateMeta(
  input: unknown,
): Promise<TemplateBuilderActionResult> {
  const parsed = updateTechnicalVisitTemplateMasterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();

  const patch: Database["public"]["Tables"]["technical_visit_templates"]["Update"] = {
    label: parsed.data.label.trim(),
    description: parsed.data.description?.trim() || null,
    cee_sheet_id: parsed.data.cee_sheet_id ?? null,
  };
  if (parsed.data.is_active !== undefined) {
    patch.is_active = parsed.data.is_active;
  }

  const { error } = await supabase
    .from("technical_visit_templates")
    .update(patch)
    .eq("id", parsed.data.templateId);

  if (error) {
    return { ok: false, message: error.message };
  }
  revalidateTemplatePaths(parsed.data.templateId);
  return { ok: true };
}

export async function updateTechnicalVisitTemplateVersionSchema(
  input: unknown,
): Promise<TemplateBuilderActionResult> {
  const parsed = updateTechnicalVisitTemplateVersionSchemaInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();

  const { data: row, error: fetchErr } = await supabase
    .from("technical_visit_template_versions")
    .select("id, status, version_number, template_id")
    .eq("id", parsed.data.versionId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, message: fetchErr?.message ?? "Version introuvable." };
  }
  if (row.status !== "draft") {
    return { ok: false, message: "Seules les versions en brouillon sont modifiables." };
  }

  const { data: master, error: mErr } = await supabase
    .from("technical_visit_templates")
    .select("template_key, label")
    .eq("id", row.template_id)
    .maybeSingle();

  if (mErr || !master) {
    return { ok: false, message: "Template parent introuvable." };
  }

  let payload;
  try {
    payload = parseVisitTemplateBuilderJson(parsed.data.schema_json);
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Schéma JSON invalide.",
    };
  }

  if (payload.template_key.trim() !== master.template_key.trim()) {
    return {
      ok: false,
      message: "La clé dans le schéma doit correspondre à la clé technique de la template.",
    };
  }
  if (payload.version !== row.version_number) {
    return {
      ok: false,
      message: `Le numéro de version dans le JSON (${payload.version}) doit être ${row.version_number}.`,
    };
  }
  if (payload.label.trim().length === 0) {
    return { ok: false, message: "Le libellé du formulaire (label) est obligatoire." };
  }

  const { error: upErr } = await supabase
    .from("technical_visit_template_versions")
    .update({ schema_json: JSON.parse(JSON.stringify(payload)) as Json })
    .eq("id", row.id)
    .eq("status", "draft");

  if (upErr) {
    return { ok: false, message: upErr.message };
  }
  revalidateTemplatePaths(row.template_id, row.id);
  return { ok: true };
}

export async function publishTechnicalVisitTemplateVersion(
  input: unknown,
): Promise<TemplateBuilderActionResult> {
  const parsed = publishTechnicalVisitTemplateVersionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();

  const { data: row, error: fetchErr } = await supabase
    .from("technical_visit_template_versions")
    .select("id, status, version_number, schema_json, template_id")
    .eq("id", parsed.data.versionId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, message: fetchErr?.message ?? "Version introuvable." };
  }
  if (row.status !== "draft") {
    return { ok: false, message: "Seule une version brouillon peut être publiée." };
  }

  const { data: master, error: mErr } = await supabase
    .from("technical_visit_templates")
    .select("template_key, label, is_active")
    .eq("id", row.template_id)
    .maybeSingle();

  if (mErr || !master) {
    return { ok: false, message: "Template parent introuvable." };
  }
  if (!master.is_active) {
    return { ok: false, message: "Réactivez la template (is_active) avant publication." };
  }

  let payload;
  try {
    payload = visitTemplateBuilderSchema.parse(row.schema_json);
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Schéma invalide.",
    };
  }

  const pubErr = validatePublishableTemplateSchema(payload);
  if (pubErr) {
    return { ok: false, message: pubErr };
  }

  if (payload.template_key.trim() !== master.template_key.trim()) {
    return { ok: false, message: "Incohérence clé technique (schéma vs master)." };
  }
  if (payload.version !== row.version_number) {
    return { ok: false, message: "Incohérence numéro de version (schéma vs ligne)." };
  }

  const { error: upErr } = await supabase
    .from("technical_visit_template_versions")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("status", "draft");

  if (upErr) {
    return { ok: false, message: upErr.message };
  }
  revalidateTemplatePaths(row.template_id, row.id);
  return { ok: true };
}

export async function archiveTechnicalVisitTemplateVersion(
  input: unknown,
): Promise<TemplateBuilderActionResult> {
  const parsed = archiveTechnicalVisitTemplateVersionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();

  const { data: row, error: fetchErr } = await supabase
    .from("technical_visit_template_versions")
    .select("id, status, template_id")
    .eq("id", parsed.data.versionId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, message: fetchErr?.message ?? "Version introuvable." };
  }
  if (row.status !== "published") {
    return { ok: false, message: "Seules les versions publiées peuvent être archivées." };
  }

  const { error: upErr } = await supabase
    .from("technical_visit_template_versions")
    .update({ status: "archived" })
    .eq("id", row.id);

  if (upErr) {
    return { ok: false, message: upErr.message };
  }
  revalidateTemplatePaths(row.template_id, row.id);
  return { ok: true };
}

export async function createTechnicalVisitTemplateNextDraftVersion(
  templateId: string,
): Promise<TemplateBuilderActionResult<{ versionId: string }>> {
  const tid = templateId?.trim();
  if (!tid) {
    return { ok: false, message: "Identifiant template manquant." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();

  const { data: master, error: mErr } = await supabase
    .from("technical_visit_templates")
    .select("id, template_key, label")
    .eq("id", tid)
    .maybeSingle();

  if (mErr || !master) {
    return { ok: false, message: "Template introuvable." };
  }

  const { data: versions, error: vErr } = await supabase
    .from("technical_visit_template_versions")
    .select("version_number, status, schema_json")
    .eq("template_id", master.id)
    .order("version_number", { ascending: false });

  if (vErr || !versions?.length) {
    return { ok: false, message: "Aucune version existante." };
  }

  const hasDraft = versions.some((v) => v.status === "draft");
  if (hasDraft) {
    return { ok: false, message: "Une version brouillon existe déjà. Publiez-la ou supprimez-la avant d’en créer une autre." };
  }

  const latestPublished = versions.find((v) => v.status === "published");
  if (!latestPublished?.schema_json) {
    return {
      ok: false,
      message: "Créez d’abord une version publiée pour en dériver une nouvelle.",
    };
  }

  let prevPayload;
  try {
    prevPayload = visitTemplateBuilderSchema.parse(latestPublished.schema_json);
  } catch {
    return { ok: false, message: "Impossible de lire la dernière version publiée." };
  }

  const nextNum = versions[0]!.version_number + 1;
  const nextSchema = buildNextDraftSchemaFromPublished(
    master.template_key,
    master.label,
    nextNum,
    prevPayload,
  );

  const { data: inserted, error: insErr } = await supabase
    .from("technical_visit_template_versions")
    .insert({
      template_id: master.id,
      version_number: nextNum,
      status: "draft",
      schema_json: JSON.parse(JSON.stringify(nextSchema)) as Json,
    })
    .select("id")
    .single();

  if (insErr || !inserted?.id) {
    return { ok: false, message: insErr?.message ?? "Création de la version impossible." };
  }

  revalidateTemplatePaths(master.id, inserted.id);
  return { ok: true, data: { versionId: inserted.id } };
}

/**
 * Supprime un gabarit builder et ses versions (CASCADE).
 * Refusé si des fiches CEE ou des visites techniques actives référencent encore la clé.
 */
export async function deleteTechnicalVisitTemplate(
  input: unknown,
): Promise<TemplateBuilderActionResult> {
  const parsed = deleteTechnicalVisitTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  await requireCeeAdminAccess();
  const supabase = await createClient();

  const { data: master, error: mErr } = await supabase
    .from("technical_visit_templates")
    .select("id, template_key")
    .eq("id", parsed.data.templateId)
    .maybeSingle();

  if (mErr || !master) {
    return { ok: false, message: mErr?.message ?? "Template introuvable." };
  }

  const key = master.template_key.trim();

  const { count: ceeCount, error: ceeErr } = await supabase
    .from("cee_sheets")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("technical_visit_template_key", key);

  if (ceeErr) {
    return { ok: false, message: ceeErr.message };
  }
  if ((ceeCount ?? 0) > 0) {
    return {
      ok: false,
      message: `Impossible de supprimer : ${ceeCount} fiche(s) CEE référencent encore ce gabarit. Retirez la liaison (clé / version) dans l’administration des fiches CEE.`,
    };
  }

  const { count: vtCount, error: vtErr } = await supabase
    .from("technical_visits")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("visit_template_key", key);

  if (vtErr) {
    return { ok: false, message: vtErr.message };
  }
  if ((vtCount ?? 0) > 0) {
    return {
      ok: false,
      message: `Impossible de supprimer : ${vtCount} visite(s) technique(s) utilisent encore ce gabarit.`,
    };
  }

  const { error: delErr } = await supabase.from("technical_visit_templates").delete().eq("id", master.id);

  if (delErr) {
    return { ok: false, message: delErr.message };
  }

  revalidateTemplatePaths();
  return { ok: true };
}
