"use server";

import { revalidatePath } from "next/cache";

import { refreshTechnicalVisitAlerts } from "@/features/technical-visits/alerts/sync-technical-visit-alerts";
import {
  assertTechnicalVisitAudioNoteManageAllowed,
  assertTechnicalVisitAudioUploadAllowed,
} from "@/features/technical-visits/access/technical-visit-audio-guards";
import {
  buildTechnicalVisitAudioNoteStoragePath,
  isAllowedTechnicalVisitAudioMime,
  TECHNICAL_VISIT_AUDIO_MAX_BYTES,
  TECHNICAL_VISIT_AUDIO_MAX_DURATION_SECONDS,
} from "@/features/technical-visits/lib/technical-visit-audio-notes-shared";
import { transcribeTechnicalVisitAudioFile } from "@/features/technical-visits/lib/transcribe-technical-visit-audio";
import { TECHNICAL_VISIT_MEDIA_BUCKET } from "@/features/technical-visits/lib/technical-visit-media-shared";
import { createClient } from "@/lib/supabase/server";

function revalidateVisit(visitId: string) {
  revalidatePath(`/technical-visits/${visitId}`);
}

export async function uploadTechnicalVisitAudioNoteAction(
  formData: FormData,
): Promise<{ ok: true; noteId: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Session expirée, reconnectez-vous." };
  }

  const visitIdRaw = formData.get("visitId");
  const visitId = typeof visitIdRaw === "string" ? visitIdRaw.trim() : "";
  if (!visitId) {
    return { ok: false, error: "Visite technique invalide." };
  }

  const uploadGate = await assertTechnicalVisitAudioUploadAllowed(supabase, visitId);
  if (!uploadGate.ok) {
    return { ok: false, error: uploadGate.message };
  }

  const file = formData.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucun enregistrement audio reçu." };
  }

  if (file.size > TECHNICAL_VISIT_AUDIO_MAX_BYTES) {
    return {
      ok: false,
      error: `Fichier trop volumineux (max ${Math.round(TECHNICAL_VISIT_AUDIO_MAX_BYTES / (1024 * 1024))} Mo).`,
    };
  }

  const mime = file.type?.trim() || "audio/webm";
  if (!isAllowedTechnicalVisitAudioMime(mime)) {
    return { ok: false, error: "Format audio non pris en charge pour cette version." };
  }

  const durationRaw = formData.get("durationSeconds");
  let durationSeconds: number | null = null;
  if (typeof durationRaw === "string" && durationRaw.trim()) {
    const n = Number(durationRaw);
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, error: "Durée d’enregistrement invalide." };
    }
    if (n > TECHNICAL_VISIT_AUDIO_MAX_DURATION_SECONDS) {
      return {
        ok: false,
        error: `Enregistrement trop long (max ${TECHNICAL_VISIT_AUDIO_MAX_DURATION_SECONDS / 60} min).`,
      };
    }
    durationSeconds = n;
  }

  const noteId = crypto.randomUUID();

  const { error: insertError } = await supabase.from("technical_visit_audio_notes").insert({
    id: noteId,
    technical_visit_id: visitId,
    created_by_user_id: user.id,
    mime_type: mime,
    duration_seconds: durationSeconds,
    transcription_status: "uploading",
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  const objectPath = buildTechnicalVisitAudioNoteStoragePath(visitId, noteId, mime);
  const { error: uploadError } = await supabase.storage.from(TECHNICAL_VISIT_MEDIA_BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: mime,
  });

  if (uploadError) {
    await supabase.from("technical_visit_audio_notes").delete().eq("id", noteId);
    return { ok: false, error: uploadError.message };
  }

  const { data: pub } = supabase.storage.from(TECHNICAL_VISIT_MEDIA_BUCKET).getPublicUrl(objectPath);

  const { error: readyError } = await supabase
    .from("technical_visit_audio_notes")
    .update({
      audio_storage_path: objectPath,
      audio_public_url: pub.publicUrl,
      transcription_status: "transcribing",
      transcription_error: null,
    })
    .eq("id", noteId);

  if (readyError) {
    await supabase.storage.from(TECHNICAL_VISIT_MEDIA_BUCKET).remove([objectPath]);
    await supabase.from("technical_visit_audio_notes").delete().eq("id", noteId);
    return { ok: false, error: readyError.message };
  }

  const tx = await transcribeTechnicalVisitAudioFile(file);
  if ("error" in tx) {
    await supabase
      .from("technical_visit_audio_notes")
      .update({
        transcription_status: "failed",
        transcription_error: tx.error,
      })
      .eq("id", noteId);
    await refreshTechnicalVisitAlerts(supabase, visitId);
    revalidateVisit(visitId);
    return { ok: true, noteId };
  }

  await supabase
    .from("technical_visit_audio_notes")
    .update({
      transcription_status: "transcribed",
      transcription_text: tx.text,
      transcription_error: null,
    })
    .eq("id", noteId);

  await refreshTechnicalVisitAlerts(supabase, visitId);
  revalidateVisit(visitId);
  return { ok: true, noteId };
}

export async function updateTechnicalVisitAudioTranscriptionAction(
  noteId: string,
  text: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Session expirée, reconnectez-vous." };
  }

  const { data: note, error: noteError } = await supabase
    .from("technical_visit_audio_notes")
    .select("id, technical_visit_id, transcription_status")
    .eq("id", noteId)
    .maybeSingle();

  if (noteError) {
    return { ok: false, error: noteError.message };
  }
  if (!note) {
    return { ok: false, error: "Note vocale introuvable." };
  }

  const manage = await assertTechnicalVisitAudioNoteManageAllowed(supabase, note.technical_visit_id);
  if (!manage.ok) {
    return { ok: false, error: manage.message };
  }

  if (note.transcription_status !== "transcribed" && note.transcription_status !== "failed") {
    return { ok: false, error: "La transcription n’est pas encore disponible pour édition." };
  }

  const { error: updateError } = await supabase
    .from("technical_visit_audio_notes")
    .update({
      transcription_text: text.trim() || null,
      transcription_status: "transcribed",
      transcription_error: null,
    })
    .eq("id", noteId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await refreshTechnicalVisitAlerts(supabase, note.technical_visit_id);
  revalidateVisit(note.technical_visit_id);
  return { ok: true };
}

export async function retryTechnicalVisitAudioTranscriptionAction(
  noteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Session expirée, reconnectez-vous." };
  }

  const { data: note, error: noteError } = await supabase
    .from("technical_visit_audio_notes")
    .select("id, technical_visit_id, mime_type, audio_storage_path, transcription_status")
    .eq("id", noteId)
    .maybeSingle();

  if (noteError) {
    return { ok: false, error: noteError.message };
  }
  if (!note?.audio_storage_path) {
    return { ok: false, error: "Fichier audio introuvable pour cette note." };
  }

  const manage = await assertTechnicalVisitAudioNoteManageAllowed(supabase, note.technical_visit_id);
  if (!manage.ok) {
    return { ok: false, error: manage.message };
  }

  if (note.transcription_status !== "failed") {
    return { ok: false, error: "Seules les notes en échec peuvent être relancées." };
  }

  await supabase
    .from("technical_visit_audio_notes")
    .update({ transcription_status: "transcribing", transcription_error: null })
    .eq("id", noteId);

  const { data: blob, error: dlError } = await supabase.storage
    .from(TECHNICAL_VISIT_MEDIA_BUCKET)
    .download(note.audio_storage_path);

  if (dlError || !blob) {
    await supabase
      .from("technical_visit_audio_notes")
      .update({
        transcription_status: "failed",
        transcription_error: dlError?.message ?? "Téléchargement du fichier impossible.",
      })
      .eq("id", noteId);
    await refreshTechnicalVisitAlerts(supabase, note.technical_visit_id);
    revalidateVisit(note.technical_visit_id);
    return { ok: false, error: dlError?.message ?? "Téléchargement du fichier impossible." };
  }

  const buf = await blob.arrayBuffer();
  const ext = note.audio_storage_path.split(".").pop() ?? "webm";
  const retryFile = new File([buf], `retry.${ext}`, { type: note.mime_type });

  const tx = await transcribeTechnicalVisitAudioFile(retryFile);
  if ("error" in tx) {
    await supabase
      .from("technical_visit_audio_notes")
      .update({
        transcription_status: "failed",
        transcription_error: tx.error,
      })
      .eq("id", noteId);
    await refreshTechnicalVisitAlerts(supabase, note.technical_visit_id);
    revalidateVisit(note.technical_visit_id);
    return { ok: false, error: tx.error };
  }

  await supabase
    .from("technical_visit_audio_notes")
    .update({
      transcription_status: "transcribed",
      transcription_text: tx.text,
      transcription_error: null,
    })
    .eq("id", noteId);

  await refreshTechnicalVisitAlerts(supabase, note.technical_visit_id);
  revalidateVisit(note.technical_visit_id);
  return { ok: true };
}
