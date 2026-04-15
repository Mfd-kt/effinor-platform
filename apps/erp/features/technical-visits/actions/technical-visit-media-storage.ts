"use server";

import {
  buildTechnicalVisitMediaObjectFileName,
  isTechnicalVisitMediaKind,
  TECHNICAL_VISIT_MEDIA_BUCKET,
  TECHNICAL_VISIT_MEDIA_MAX_BYTES,
  parseTechnicalVisitMediaPublicStorageUrl,
  type TechnicalVisitMediaKind,
} from "@/features/technical-visits/lib/technical-visit-media-shared";
import {
  assertTechnicalVisitNotTechnicianRestrictedById,
  visitIdFromTechnicalVisitStorageObjectPath,
} from "@/features/technical-visits/access/technician-mutation-guard";
import { createClient } from "@/lib/supabase/server";

export async function uploadTechnicalVisitMediaFilesAction(
  formData: FormData,
): Promise<{ urls: string[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { urls: [], error: "Session expirée, reconnectez-vous." };
  }

  const visitId = formData.get("visitId");
  const kindRaw = formData.get("kind");
  if (typeof visitId !== "string" || !visitId) {
    return { urls: [], error: "Visite technique invalide." };
  }

  const uploadGate = await assertTechnicalVisitNotTechnicianRestrictedById(supabase, visitId);
  if (!uploadGate.ok) {
    return { urls: [], error: uploadGate.message };
  }

  if (typeof kindRaw !== "string" || !isTechnicalVisitMediaKind(kindRaw)) {
    return { urls: [], error: "Type de média invalide." };
  }
  const kind: TechnicalVisitMediaKind = kindRaw;

  const file = formData.get("files");
  if (!(file instanceof File)) {
    return { urls: [], error: "Aucun fichier reçu." };
  }

  if (file.size > TECHNICAL_VISIT_MEDIA_MAX_BYTES) {
    return { urls: [], error: `Fichier trop volumineux : ${file.name} (max 50 Mo).` };
  }

  const batchBase = formData.get("batchBase");
  const fileIndex = formData.get("fileIndex");
  const subFolderRaw = formData.get("subFolder");
  const subFolder = typeof subFolderRaw === "string" && /^[a-zA-Z0-9_-]+$/.test(subFolderRaw) ? subFolderRaw : null;
  const uniqueSuffix =
    typeof batchBase === "string" &&
    batchBase.length > 0 &&
    typeof fileIndex === "string"
      ? `${batchBase}_${fileIndex}`
      : `${Date.now()}_0`;

  const objectName = buildTechnicalVisitMediaObjectFileName(visitId, kind, file.name, uniqueSuffix);
  const path = subFolder
    ? `technical-visits/${visitId}/${kind}/${subFolder}/${objectName}`
    : `technical-visits/${visitId}/${kind}/${objectName}`;
  const { error } = await supabase.storage.from(TECHNICAL_VISIT_MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    return { urls: [], error: error.message };
  }
  const { data } = supabase.storage.from(TECHNICAL_VISIT_MEDIA_BUCKET).getPublicUrl(path);
  return { urls: [data.publicUrl] };
}

export async function removeTechnicalVisitMediaFileAction(
  publicUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Session expirée, reconnectez-vous." };
  }

  const parsed = parseTechnicalVisitMediaPublicStorageUrl(publicUrl);
  if (!parsed) {
    return { ok: true };
  }

  const vtId = visitIdFromTechnicalVisitStorageObjectPath(parsed.objectPath);
  if (vtId) {
    const removeGate = await assertTechnicalVisitNotTechnicianRestrictedById(supabase, vtId);
    if (!removeGate.ok) {
      return { ok: false, error: removeGate.message };
    }
  }

  const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.objectPath]);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
