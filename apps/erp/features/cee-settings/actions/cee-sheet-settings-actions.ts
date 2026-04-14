"use server";

import { revalidatePath } from "next/cache";

import { CEE_SHEET_PDF_BUCKET } from "@/features/cee-settings/lib/cee-sheet-pdf-bucket";
import { CeeSheetUpsertSchema, IdSchema } from "@/features/cee-settings/schemas/cee-settings.schema";
import { getAccessContext } from "@/lib/auth/access-context";
import { isSuperAdmin } from "@/lib/auth/role-codes";
import { createClient } from "@/lib/supabase/server";

export type UpsertCeeSheetResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function upsertCeeSheet(input: unknown): Promise<UpsertCeeSheetResult> {
  const parsed = CeeSheetUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const row = {
    code: data.code.trim(),
    label: data.label.trim(),
    description: data.description?.trim() || null,
    sort_order: data.sort_order ?? 0,
    simulator_key: data.simulator_key?.trim() || null,
    presentation_template_key: data.presentation_template_key?.trim() || null,
    agreement_template_key: data.agreement_template_key?.trim() || null,
    workflow_key: data.workflow_key?.trim() || null,
    requires_technical_visit: data.requires_technical_visit ?? false,
    requires_quote: data.requires_quote ?? true,
    is_commercial_active: data.is_commercial_active ?? true,
    control_points: data.control_points?.trim() || null,
  };

  if (data.id) {
    const { error } = await supabase.from("cee_sheets").update(row).eq("id", data.id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/settings/cee");
    return { ok: true, id: data.id };
  }

  const { data: inserted, error } = await supabase.from("cee_sheets").insert(row).select("id").single();
  if (error) return { ok: false, message: error.message };
  if (!inserted?.id) return { ok: false, message: "Aucun identifiant retourné." };

  revalidatePath("/settings/cee");
  return { ok: true, id: inserted.id };
}

function sanitizePdfFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
  return base || "fiche.pdf";
}

export async function uploadCeeSheetOfficialPdf(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, message: "Accès refusé." };
  }

  const sheetIdRaw = formData.get("sheetId");
  const file = formData.get("file");
  if (typeof sheetIdRaw !== "string" || !sheetIdRaw) {
    return { ok: false, message: "Identifiant fiche manquant." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Fichier PDF requis." };
  }
  if (file.type !== "application/pdf") {
    return { ok: false, message: "Seuls les fichiers PDF sont acceptés." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("cee_sheets")
    .select("official_pdf_path")
    .eq("id", sheetIdRaw)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr) return { ok: false, message: fetchErr.message };
  if (!existing) return { ok: false, message: "Fiche introuvable." };

  const safeName = sanitizePdfFileName(file.name);
  const path = `${sheetIdRaw}/${Date.now()}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage.from(CEE_SHEET_PDF_BUCKET).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (upErr) return { ok: false, message: upErr.message };

  if (existing.official_pdf_path) {
    await supabase.storage.from(CEE_SHEET_PDF_BUCKET).remove([existing.official_pdf_path]);
  }

  const { error: dbErr } = await supabase
    .from("cee_sheets")
    .update({
      official_pdf_path: path,
      official_pdf_file_name: file.name.trim().slice(0, 500) || safeName,
    })
    .eq("id", sheetIdRaw);

  if (dbErr) {
    await supabase.storage.from(CEE_SHEET_PDF_BUCKET).remove([path]);
    return { ok: false, message: dbErr.message };
  }

  revalidatePath("/settings/cee");
  return { ok: true };
}

export async function removeCeeSheetOfficialPdf(
  input: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = IdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Identifiant invalide." };
  }
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, message: "Accès refusé." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("cee_sheets")
    .select("official_pdf_path")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (fetchErr) return { ok: false, message: fetchErr.message };
  if (row?.official_pdf_path) {
    await supabase.storage.from(CEE_SHEET_PDF_BUCKET).remove([row.official_pdf_path]);
  }

  const { error } = await supabase
    .from("cee_sheets")
    .update({ official_pdf_path: null, official_pdf_file_name: null })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/settings/cee");
  return { ok: true };
}

export async function getCeeSheetOfficialPdfSignedUrl(
  sheetId: string,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, message: "Accès refusé." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("cee_sheets")
    .select("official_pdf_path")
    .eq("id", sheetId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr) return { ok: false, message: fetchErr.message };
  if (!row?.official_pdf_path) {
    return { ok: false, message: "Aucun PDF enregistré pour cette fiche." };
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(CEE_SHEET_PDF_BUCKET)
    .createSignedUrl(row.official_pdf_path, 3600);

  if (signErr || !signed?.signedUrl) {
    return { ok: false, message: signErr?.message ?? "Impossible de générer le lien de téléchargement." };
  }

  return { ok: true, url: signed.signedUrl };
}

export async function softDeleteCeeSheet(input: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = IdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Identifiant invalide." };
  }
  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("cee_sheets")
    .select("official_pdf_path")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (fetchErr) return { ok: false, message: fetchErr.message };
  if (row?.official_pdf_path) {
    await supabase.storage.from(CEE_SHEET_PDF_BUCKET).remove([row.official_pdf_path]);
  }
  const { error } = await supabase
    .from("cee_sheets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/settings/cee");
  return { ok: true };
}
