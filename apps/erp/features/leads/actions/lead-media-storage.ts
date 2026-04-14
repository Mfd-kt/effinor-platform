"use server";

import {
  buildLeadMediaObjectFileName,
  isLeadMediaKind,
  LEAD_MEDIA_BUCKET,
  LEAD_MEDIA_MAX_BYTES,
  parseLeadMediaPublicStorageUrl,
  type LeadMediaKind,
} from "@/features/leads/lib/lead-media-shared";
import { createClient } from "@/lib/supabase/server";

export async function uploadLeadMediaFilesAction(
  formData: FormData,
): Promise<{ urls: string[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { urls: [], error: "Session expirée, reconnectez-vous." };
  }

  const leadId = formData.get("leadId");
  const kindRaw = formData.get("kind");
  if (typeof leadId !== "string" || !leadId) {
    return { urls: [], error: "Lead invalide." };
  }
  if (typeof kindRaw !== "string" || !isLeadMediaKind(kindRaw)) {
    return { urls: [], error: "Type de média invalide." };
  }
  const kind: LeadMediaKind = kindRaw;

  /** Un fichier par appel (évite « Unexpected end of form » avec plusieurs fichiers dans un même FormData / Server Action). */
  const file = formData.get("files");
  if (!(file instanceof File)) {
    return { urls: [], error: "Aucun fichier reçu." };
  }

  if (file.size > LEAD_MEDIA_MAX_BYTES) {
    return { urls: [], error: `Fichier trop volumineux : ${file.name} (max 50 Mo).` };
  }

  const batchBase = formData.get("batchBase");
  const fileIndex = formData.get("fileIndex");
  const uniqueSuffix =
    typeof batchBase === "string" &&
    batchBase.length > 0 &&
    typeof fileIndex === "string"
      ? `${batchBase}_${fileIndex}`
      : `${Date.now()}_0`;

  const objectName = buildLeadMediaObjectFileName(leadId, kind, file.name, uniqueSuffix);
  const path = `leads/${leadId}/${kind}/${objectName}`;
  const { error } = await supabase.storage.from(LEAD_MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    return { urls: [], error: error.message };
  }
  const { data } = supabase.storage.from(LEAD_MEDIA_BUCKET).getPublicUrl(path);
  return { urls: [data.publicUrl] };
}

export async function removeLeadMediaFileAction(
  publicUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Session expirée, reconnectez-vous." };
  }

  const parsed = parseLeadMediaPublicStorageUrl(publicUrl);
  if (!parsed) {
    return { ok: true };
  }
  const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.objectPath]);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
