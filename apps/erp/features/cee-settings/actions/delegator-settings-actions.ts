"use server";

import { revalidatePath } from "next/cache";

import { REFERENCE_DOCS_BUCKET } from "@/features/cee-settings/lib/reference-docs-bucket";
import { sanitizeReferencePdfFileName } from "@/features/cee-settings/lib/reference-pdf";
import { DelegatorUpsertSchema, IdSchema } from "@/features/cee-settings/schemas/cee-settings.schema";
import { getAccessContext } from "@/lib/auth/access-context";
import { isSuperAdmin } from "@/lib/auth/role-codes";
import { createClient } from "@/lib/supabase/server";

export type UpsertDelegatorResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function upsertDelegator(input: unknown): Promise<UpsertDelegatorResult> {
  const parsed = DelegatorUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const row = {
    name: data.name.trim(),
    company_name: data.company_name?.trim() || null,
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    contact_name: data.contact_name?.trim() || null,
    contact_phone: data.contact_phone?.trim() || null,
    contact_email: data.contact_email?.trim() || null,
    siret: data.siret?.trim() || null,
    address: data.address?.trim() || null,
    contract_start_date: data.contract_start_date?.trim() || null,
    invoice_note: data.invoice_note?.trim() || null,
    prime_per_kwhc_note: data.prime_per_kwhc_note?.trim() || null,
    notes: data.notes?.trim() || null,
    control_points: data.control_points?.trim() || null,
  };

  if (data.id) {
    const { error } = await supabase.from("delegators").update(row).eq("id", data.id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/settings/cee");
    return { ok: true, id: data.id };
  }

  const { data: inserted, error } = await supabase.from("delegators").insert(row).select("id").single();
  if (error) return { ok: false, message: error.message };
  if (!inserted?.id) return { ok: false, message: "Aucun identifiant retourné." };

  revalidatePath("/settings/cee");
  return { ok: true, id: inserted.id };
}

export async function uploadDelegatorOfficialPdf(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, message: "Accès refusé." };
  }

  const idRaw = formData.get("delegatorId");
  const file = formData.get("file");
  if (typeof idRaw !== "string" || !idRaw) {
    return { ok: false, message: "Identifiant manquant." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Fichier PDF requis." };
  }
  if (file.type !== "application/pdf") {
    return { ok: false, message: "Seuls les fichiers PDF sont acceptés." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("delegators")
    .select("official_pdf_path")
    .eq("id", idRaw)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr) return { ok: false, message: fetchErr.message };
  if (!existing) return { ok: false, message: "Délégataire introuvable." };

  const safeName = sanitizeReferencePdfFileName(file.name);
  const path = `delegators/${idRaw}/${Date.now()}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage.from(REFERENCE_DOCS_BUCKET).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (upErr) return { ok: false, message: upErr.message };

  if (existing.official_pdf_path) {
    await supabase.storage.from(REFERENCE_DOCS_BUCKET).remove([existing.official_pdf_path]);
  }

  const { error: dbErr } = await supabase
    .from("delegators")
    .update({
      official_pdf_path: path,
      official_pdf_file_name: file.name.trim().slice(0, 500) || safeName,
    })
    .eq("id", idRaw);

  if (dbErr) {
    await supabase.storage.from(REFERENCE_DOCS_BUCKET).remove([path]);
    return { ok: false, message: dbErr.message };
  }

  revalidatePath("/settings/cee");
  return { ok: true };
}

export async function removeDelegatorOfficialPdf(
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
    .from("delegators")
    .select("official_pdf_path")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (fetchErr) return { ok: false, message: fetchErr.message };
  if (row?.official_pdf_path) {
    await supabase.storage.from(REFERENCE_DOCS_BUCKET).remove([row.official_pdf_path]);
  }

  const { error } = await supabase
    .from("delegators")
    .update({ official_pdf_path: null, official_pdf_file_name: null })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/settings/cee");
  return { ok: true };
}

export async function getDelegatorOfficialPdfSignedUrl(
  delegatorId: string,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, message: "Accès refusé." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("delegators")
    .select("official_pdf_path")
    .eq("id", delegatorId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr) return { ok: false, message: fetchErr.message };
  if (!row?.official_pdf_path) {
    return { ok: false, message: "Aucun PDF enregistré." };
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(REFERENCE_DOCS_BUCKET)
    .createSignedUrl(row.official_pdf_path, 3600);

  if (signErr || !signed?.signedUrl) {
    return { ok: false, message: signErr?.message ?? "Impossible de générer le lien." };
  }

  return { ok: true, url: signed.signedUrl };
}

export async function softDeleteDelegator(input: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = IdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Identifiant invalide." };
  }
  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("delegators")
    .select("official_pdf_path")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (fetchErr) return { ok: false, message: fetchErr.message };
  if (row?.official_pdf_path) {
    await supabase.storage.from(REFERENCE_DOCS_BUCKET).remove([row.official_pdf_path]);
  }
  const { error } = await supabase
    .from("delegators")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/settings/cee");
  return { ok: true };
}
